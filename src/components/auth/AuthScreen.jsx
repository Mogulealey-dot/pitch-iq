import { useState } from 'react'
import styles from './AuthScreen.module.css'
import { APP_NAME } from '../../config/constants'

export default function AuthScreen({ onSignIn, onSignUp, onGoogle, onReset, error }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'signin') onSignIn(email, password)
    else if (mode === 'signup') onSignUp(email, password, name)
    else if (mode === 'reset') {
      onReset(email).then(ok => {
        if (ok) setResetSuccess(true)
      })
    }
  }

  const goToSignin = () => {
    setMode('signin')
    setResetSuccess(false)
  }

  if (mode === 'reset') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>⚽</span>
            <h1 className={styles.title}>{APP_NAME}</h1>
            <p className={styles.subtitle}>Reset Password</p>
          </div>

          <p className={styles.resetSubtitle}>We'll send a reset link to your email</p>

          {resetSuccess ? (
            <p className={styles.successMsg}>Check your inbox for a reset link</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.primaryBtn} type="submit">
                Send Reset Link
              </button>
            </form>
          )}

          <button className={styles.backLink} onClick={goToSignin}>
            ← Back to sign in
          </button>

          <p className={styles.security}>🔒 Secure login · Data synced across devices</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>⚽</span>
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.subtitle}>Your football match intelligence hub</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'signin' ? styles.active : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${mode === 'signup' ? styles.active : ''}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              className={styles.input}
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            className={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {mode === 'signin' && (
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => setMode('reset')}
            >
              Forgot password?
            </button>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.primaryBtn} type="submit">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <button className={styles.googleBtn} onClick={onGoogle}>
          <span>🔵</span> Continue with Google
        </button>

        <p className={styles.security}>🔒 Secure login · Data synced across devices</p>
      </div>
    </div>
  )
}
