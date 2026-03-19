import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/auth/AuthScreen'
import App from './App'

export default function Root() {
  const { user, error, signIn, signUp, signInWithGoogle, logOut, resetPassword } = useAuth()

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#050b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#00e5a0', fontSize: '1.5rem' }}>⚽ Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onGoogle={signInWithGoogle} onReset={resetPassword} error={error} />
  }

  return <App user={user} logOut={logOut} />
}
