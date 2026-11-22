import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

// Step 1 of resetting a password: ask for the email and send the reset link.
function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('') // Supabase error code, translated when shown
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')
    setSending(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>{t('auth.forgotTitle')}</h1>

      {sent ? (
        // Supabase answers the same whether the email has an account or not, so nobody can
        // use this form to find out who is registered. We say it the same way.
        <p role="status">{t('auth.resetSent', { email })}</p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="muted">{t('auth.forgotHint')}</p>
          <label>
            {t('auth.email')}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {error && (
            <p role="alert" className="form-error">
              {t(`auth.errors.${error}`, { defaultValue: t('auth.errors.network') })}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={sending}>
            {t(sending ? 'auth.sending' : 'auth.sendResetLink')}
          </button>
        </form>
      )}

      <Link to="/login" className="auth-link">
        {t('auth.backToLogin')}
      </Link>
    </section>
  )
}

export default ForgotPasswordPage
