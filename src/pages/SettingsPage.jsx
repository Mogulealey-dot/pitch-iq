import { useState } from 'react'
import { APP_NAME } from '../config/constants'
import styles from './SettingsPage.module.css'

export default function SettingsPage({ user, matches, settings, updateSettings, logOut, removeMatch, showToast }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  const exportData = () => {
    const data = {
      exported: new Date().toISOString(),
      app: APP_NAME,
      user: user?.email,
      matchCount: matches.length,
      matches: matches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        date: m.date,
        competition: m.competition,
        venue: m.venue,
        status: m.status,
        stats: m.stats,
        myPrediction: m.myPrediction,
        notes: m.notes,
        tags: m.tags,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pitchiq-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast?.('Data exported', 'info')
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      for (const m of matches) {
        await removeMatch(m.id)
      }
      setCleared(true)
      setConfirmClear(false)
    } catch (e) {
      console.error('Error clearing matches:', e)
    }
    setClearing(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.sub}>Manage your account and data</p>
      </div>

      {/* Profile */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <div className={styles.card}>
          <div className={styles.profileRow}>
            <div className={styles.avatar}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user?.displayName || 'User'}</div>
              <div className={styles.profileEmail}>{user?.email}</div>
              <div className={styles.profileSince}>Firebase Auth · UID: {user?.uid?.slice(0, 12)}...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Data</h2>
        <div className={styles.card}>
          <div className={styles.dataRow}>
            <div>
              <div className={styles.dataLabel}>Export Match Data</div>
              <div className={styles.dataSub}>
                Download all {matches.length} match{matches.length !== 1 ? 'es' : ''} as a JSON file
              </div>
            </div>
            <button className={styles.exportBtn} onClick={exportData} disabled={matches.length === 0}>
              Export JSON
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.dataRow}>
            <div>
              <div className={styles.dataLabel}>Match Count</div>
              <div className={styles.dataSub}>Total matches recorded in your account</div>
            </div>
            <div className={styles.countBadge}>{matches.length}</div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.section}>
        <h2 className={`${styles.sectionTitle} ${styles.danger}`}>Danger Zone</h2>
        <div className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.dataRow}>
            <div>
              <div className={styles.dataLabel}>Clear All Matches</div>
              <div className={styles.dataSub}>
                Permanently delete all {matches.length} recorded match{matches.length !== 1 ? 'es' : ''}. This cannot be undone.
              </div>
            </div>
            <button
              className={styles.dangerBtn}
              onClick={() => setConfirmClear(true)}
              disabled={matches.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className={styles.section}>
        <div className={styles.card}>
          <div className={styles.dataRow}>
            <div>
              <div className={styles.dataLabel}>Sign Out</div>
              <div className={styles.dataSub}>Sign out of your {APP_NAME} account</div>
            </div>
            <button className={styles.signOutBtn} onClick={logOut}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className={styles.section}>
        <div className={styles.appInfo}>
          <span className={styles.appLogo}>⚽</span>
          <div>
            <div className={styles.appName}>{APP_NAME}</div>
            <div className={styles.appDesc}>
              Football match recording &amp; analytics · Built with React 19 + Firebase
            </div>
          </div>
        </div>
      </div>

      {/* Clear confirm */}
      {confirmClear && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogIcon}>⚠️</div>
            <h3>Clear All Matches?</h3>
            <p>This will permanently delete all <strong>{matches.length} matches</strong> and cannot be undone.</p>
            <div className={styles.dialogBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmClear(false)} disabled={clearing}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleClearAll} disabled={clearing}>
                {clearing ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cleared && (
        <div className={styles.toast}>All matches cleared successfully.</div>
      )}
    </div>
  )
}
