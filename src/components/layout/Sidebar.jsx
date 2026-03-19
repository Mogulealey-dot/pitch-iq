import styles from './Sidebar.module.css'
import { APP_NAME } from '../../config/constants'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
  { id: 'matches',      label: 'Matches',       icon: '⚽' },
  { id: 'teams',        label: 'Teams',         icon: '🏆' },
  { id: 'analytics',   label: 'Analytics',     icon: '📈' },
  { id: 'predictions', label: 'Predictions',   icon: '🎯' },
  { id: 'settings',    label: 'Settings',      icon: '⚙️' },
]

export default function Sidebar({ activePage, onNavigate, user }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoWrap}>⚽</div>
        <span className={styles.name}>{APP_NAME}</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className={styles.userDetails}>
          <div className={styles.userName}>{user?.displayName || 'User'}</div>
          <div className={styles.userEmail}>{user?.email}</div>
        </div>
      </div>
    </aside>
  )
}
