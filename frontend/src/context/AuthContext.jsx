import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore, UNAUTHORIZED_EVENT } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'anonymous')

  useEffect(() => {
    if (!tokenStore.get()) return
    api.auth
      .me()
      .then((u) => {
        setUser(u)
        setStatus('authenticated')
      })
      .catch(() => {
        tokenStore.clear()
        setStatus('anonymous')
      })
  }, [])

  useEffect(() => {
    const expire = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, expire)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, expire)
  }, [])

  const finish = useCallback(({ token, user: u }, remember = true) => {
    tokenStore.set(token, remember)
    setUser(u)
    setStatus('authenticated')
    return u
  }, [])

  const login = useCallback((payload, { remember = true } = {}) => api.auth.login(payload).then((data) => finish(data, remember)), [finish])
  const register = useCallback((payload) => api.auth.register(payload).then(finish), [finish])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      /* token may already be invalid; clear locally regardless */
    }
    tokenStore.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const changePassword = useCallback(
    (payload) => api.auth.changePassword(payload).then((data) => finish(data, !!localStorage.getItem('ts254.token'))),
    [finish],
  )

  const updateUser = useCallback((payload) => api.auth.updateMe(payload).then((u) => (setUser(u), u)), [])

  const value = useMemo(() => ({ user, status, login, register, logout, updateUser, changePassword }), [user, status, login, register, logout, updateUser, changePassword])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
