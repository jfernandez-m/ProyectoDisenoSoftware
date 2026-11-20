import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

function LoginPage() {
  const { t } = useTranslation()
  const { user, login, register, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('') // backend error code, translated when shown
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
    run(() => (isRegister ? register : login)(username, password))
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <section className="auth-card">
      <h1>{t(isRegister ? 'auth.registerTitle' : 'auth.loginTitle')}</h1>

      <GoogleButton onCredential={(credential) => run(() => loginWithGoogle(credential))} />
      <p className="divider">{t('auth.or')}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {t('auth.username')}
          {/* Same rules as the backend, so the browser warns before sending. */}
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            pattern="[A-Za-z0-9_]{3,20}"
            title={t('auth.usernameHint')}
            required
          />
        </label>
        {isRegister && <small className="muted">{t('auth.usernameHint')}</small>}

        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            maxLength={128}
            required
          />
        </label>
        {isRegister && <small className="muted">{t('auth.passwordHint')}</small>}

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
