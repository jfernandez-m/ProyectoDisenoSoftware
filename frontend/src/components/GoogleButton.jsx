import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// Google's official button. After the user picks an account, Google gives us a signed
// ID token ("credential") and we pass it to onCredential.
function GoogleButton({ onCredential }) {
  const ref = useRef(null)
  const { i18n } = useTranslation()

  // Keeps the latest onCredential without re-creating Google's button on every render.
  const onCredentialRef = useRef(onCredential)
  useEffect(() => {
    onCredentialRef.current = onCredential
  })

  useEffect(() => {
    if (!window.google) return // script blocked (e.g. ad blocker): no button
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: ({ credential }) => onCredentialRef.current(credential),
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
