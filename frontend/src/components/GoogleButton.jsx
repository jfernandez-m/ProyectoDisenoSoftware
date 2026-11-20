import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// Google's official button. After the user picks an account, Google gives us a signed
// ID token ("credential"); the backend verifies it and starts our session.
function GoogleButton() {
  const ref = useRef(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!window.google) return // script blocked (e.g. ad blocker): no button
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        })
        window.location.reload() // shortcut: replaced by shared login state in the login page step
      },
    })
    window.google.accounts.id.renderButton(ref.current, {
      theme: 'outline',
      size: 'large',
      locale: i18n.language, // the button follows our language switcher
    })
  }, [i18n.language])

  return <div ref={ref} />
}

export default GoogleButton
