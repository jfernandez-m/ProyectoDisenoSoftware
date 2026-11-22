import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

// Step 2 of resetting a password: the link in the email opens this page.
// Supabase reads the token in the link and starts a temporary session, so here we
// already know who the user is and only ask for the new password.
function ResetPasswordPage() {
  const { t } = useTranslation()
  const { user, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('') // Supabase error code, translated when shown
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')
    setSending(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // undefined = Supabase is still reading the link.
  if (user === undefined) return <p>{t('loading')}</p>

  return (
    <section className="auth-card">
      <h1>{t('auth.resetTitle')}</h1>

      {/* No session: the link was already used, expired, or the page was opened directly. */}
      {user === null && (
        <>
          <p role="alert" className="form-error">{t('auth.resetInvalid')}</p>
          <Link to="/forgot-password" className="auth-link">
            {t('auth.sendResetLink')}
          </Link>
        </>
      )}

      {user && done && (
        <>
          <p role="status">{t('auth.resetDone')}</p>
          <Link to="/" className="auth-link">
            {t('nav.home')}
          </Link>
        </>
      )}

      {user && !done && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t('auth.newPassword')}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          <small className="muted">{t('auth.passwordHint')}</small>

          {error && (
            <p role="alert" className="form-error">
              {t(`auth.errors.${error}`, { defaultValue: t('auth.errors.network') })}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={sending}>
            {t(sending ? 'auth.sending' : 'auth.savePassword')}
          </button>
        </form>
      )}
    </section>
  )
}

export default ResetPasswordPage
