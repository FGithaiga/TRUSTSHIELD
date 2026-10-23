/* Daily safety tips. One is shown per day, the same for everyone. */
export const TIPS = [
  { sw: 'Usitume PIN yako kwa mtu yeyote.', en: 'Never share your M-PESA PIN. Safaricom will never ask for it.' },
  { sw: 'Angalia salio lako kwanza.', en: 'Got a "Confirmed" message? Check your balance on your own phone before acting on it.' },
  { sw: 'Pesa iliyotumwa kimakosa hurudishwa na Safaricom.', en: 'Wrong transfers are reversed by Safaricom. Do not send money back to a caller.' },
  { sw: 'Kazi halali haikulipishi ada.', en: 'Real employers do not charge application, training or registration fees.' },
  { sw: 'Andika anwani mwenyewe.', en: 'Type official website addresses yourself instead of opening links in messages.' },
  { sw: 'Haraka ni ishara ya hatari.', en: 'Pressure to act "now" or "tonight" is designed to stop you thinking. Pause first.' },
  { sw: 'Faida ya uhakika haipo.', en: 'Nobody can guarantee to double your money. Guaranteed returns are a warning sign.' },
  { sw: 'Uliza mtu unayemwamini.', en: 'Not sure? Ask someone you trust before you pay. Scammers count on you deciding alone.' },
  { sw: 'Linganisha jina kwenye M-PESA.', en: 'Before entering your PIN, check that the name on the M-PESA prompt matches who you are paying.' },
  { sw: 'Ripoti ujumbe wa ulaghai kwa 333.', en: 'Forward scam SMS messages to 333 so Safaricom can act on them.' },
]

export function tipOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date - start) / 864e5)
  return TIPS[day % TIPS.length]
}
