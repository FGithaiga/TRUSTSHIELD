/**
 * Thin client for the TrustShield 254 Django REST API.
 *
 * Every screen talks to the backend through these functions only, so the
 * response shapes defined here are the frontend/backend contract, implemented
 * by the Django API in backend/. Set VITE_USE_MOCK=true to run the UI without
 * the backend, against an in-browser mock of the same contract (./mock.js).
 */
import { mockRequest } from './mock'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
export const UNAUTHORIZED_EVENT = 'ts254:unauthorized'

const TOKEN_KEY = 'ts254.token'

/** "Remember me" keeps the token in localStorage; otherwise it lives only until the browser closes. */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  set: (token, remember = true) => {
    tokenStore.clear()
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

export class ApiError extends Error {
  constructor(status, data) {
    super(extractMessage(data) || `Request failed (${status})`)
    this.status = status
    this.data = data
    // DRF field errors arrive as { field: ["message"] }
    this.fields = data && typeof data === 'object' && !data.detail ? data : {}
  }
}

function extractMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.non_field_errors) return data.non_field_errors[0]
  const first = Object.values(data)[0]
  return Array.isArray(first) ? first[0] : ''
}

async function request(method, path, body, { anonymous = false } = {}) {
  const token = anonymous ? null : tokenStore.get()

  if (USE_MOCK) {
    const { status, data } = await mockRequest(method, path, body, token)
    if (status >= 400) throw new ApiError(status, data)
    return data
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { detail: 'Cannot reach the TrustShield service. Check your connection and try again.' })
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (response.status === 401 && token) {
    // Token expired or revoked elsewhere: end the session everywhere in the app,
    // then retry once without it so public endpoints (pulse, guidance) still load.
    tokenStore.clear()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    return request(method, path, body, { anonymous: true })
  }
  if (response.status === 429) throw new ApiError(429, { detail: 'Too many requests. Please wait a moment and try again.' })
  if (response.status >= 500 && !data?.detail) throw new ApiError(response.status, { detail: 'The TrustShield service had a problem. Please try again.' })
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const api = {
  health: () => request('GET', '/health/'),

  auth: {
    register: (payload) => request('POST', '/auth/register/', payload),
    login: (payload) => request('POST', '/auth/login/', payload),
    logout: () => request('POST', '/auth/logout/'),
    me: () => request('GET', '/auth/me/'),
    updateMe: (payload) => request('PATCH', '/auth/me/', payload),
    requestPasswordReset: (email) => request('POST', '/auth/password-reset/', { email }),
    confirmPasswordReset: (payload) => request('POST', '/auth/password-reset/confirm/', payload),
    changePassword: (payload) => request('POST', '/auth/change-password/', payload),
  },

  scans: {
    /** scan_type: "mpesa" | "url" | "offer" */
    analyze: (payload) => request('POST', '/scans/analyze/', payload),
    list: (params) => request('GET', `/scans/${qs(params)}`),
    get: (id) => request('GET', `/scans/${id}/`),
    remove: (id) => request('DELETE', `/scans/${id}/`),
    /** verdict: "agree" | "disagree"; actual: "scam" | "legit" | "unsure" */
    feedback: (id, payload) => request('PUT', `/scans/${id}/feedback/`, payload),
  },

  pulse: () => request('GET', '/pulse/'),

  trainer: {
    round: () => request('GET', '/trainer/round/'),
    answer: (payload) => request('POST', '/trainer/answer/', payload),
    stats: () => request('GET', '/trainer/stats/'),
  },

  dashboard: {
    summary: (params) => request('GET', `/dashboard/summary/${qs(params)}`),
  },

  guidance: () => request('GET', '/guidance/'),

  incidents: {
    list: () => request('GET', '/incidents/'),
    create: (payload) => request('POST', '/incidents/', payload),
  },

  reports: {
    list: (params) => request('GET', `/reports/${qs(params)}`),
    create: (payload) => request('POST', '/reports/', payload),
  },
}
