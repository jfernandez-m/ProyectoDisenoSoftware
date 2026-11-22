import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

function LoginPage() {
  const { t } = useTranslation()
  const { user, login, register, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('') // Supabase error code, translated when shown
  const [sending, setSending] = useState(false)

  // Already logged in (or just logged in): go to the home page.
  if (user) return <Navigate to="/" replace />

  const isRegister = mode === 'register'

  // Runs a login call and turns a failure into a translated message.
  async function run(action) {
    setError('')
    setSending(true)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    run(() => (isRegister ? register : login)(email, password))
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <section className="auth-card">
      <h1>{t(isRegister ? 'auth.registerTitle' : 'auth.loginTitle')}</h1>

      <button
        type="button"
        className="button-google"
        onClick={() => run(loginWithGoogle)}
        disabled={sending}
      >
        {t('auth.google')}
      </button>
      <p className="divider">{t('auth.or')}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
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

        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            required
          />
        </label>
        {isRegister && <small className="muted">{t('auth.passwordHint')}</small>}
        {!isRegister && (
          <Link to="/forgot-password" className="auth-link">
            {t('auth.forgotPassword')}
          </Link>
        )}

        {error && (
          <p role="alert" className="form-error">
            {t(`auth.errors.${error}`, { defaultValue: t('auth.errors.network') })}
          </p>
        )}

        <button type="submit" className="button-primary" disabled={sending}>
          {t(sending ? 'auth.sending' : isRegister ? 'auth.register' : 'auth.login')}
        </button>
      </form>

      <button type="button" className="button-link" onClick={switchMode}>
        {t(isRegister ? 'auth.haveAccount' : 'auth.noAccount')}
      </button>
    </section>
  )
}

export default LoginPage
