import { useState, useEffect, useRef } from 'react'
import styles from './LivePage.module.css'
import { COMPETITIONS } from '../config/competitions'
import { format } from 'date-fns'

const EMPTY_SETUP = {
  homeTeam: '', awayTeam: '',
  competition: 'premier-league',
  date: format(new Date(), 'yyyy-MM-dd'),
  venue: '',
}

export default function LivePage({ uid, addMatch, showToast }) {
  const [phase, setPhase] = useState('setup') // 'setup' | 'live'
  const [setup, setSetup] = useState(EMPTY_SETUP)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [events, setEvents] = useState([])
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Scroll event log to top on new event
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [events])

  const minute = Math.floor(elapsed / 60)
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startMatch = () => {
    if (!setup.homeTeam.trim() || !setup.awayTeam.trim()) return
    setPhase('live')
    setRunning(true)
  }

  const logEvent = (type, team) => {
    const label = team === 'home' ? setup.homeTeam : setup.awayTeam
    const event = { type, team, minute: minute + 1, timestamp: Date.now(), teamName: label }
    if (type === 'goal') {
      if (team === 'home') setHomeScore(s => s + 1)
      else setAwayScore(s => s + 1)
    }
    setEvents(prev => [event, ...prev])
  }

  const handleFullTime = async () => {
    setRunning(false)
    setSaving(true)
    try {
      await addMatch({
        homeTeam: setup.homeTeam,
        awayTeam: setup.awayTeam,
        homeScore,
        awayScore,
        date: setup.date,
        competition: setup.competition,
        venue: setup.venue,
        status: 'FT',
        liveEvents: [...events].reverse(),
        stats: {},
        myPrediction: '',
        notes: `Live tracked. ${events.length} event${events.length !== 1 ? 's' : ''} logged.`,
        tags: ['live-tracked'],
      })
      showToast?.('Match saved ⚽')
      // Reset
      setPhase('setup')
      setSetup(EMPTY_SETUP)
      setHomeScore(0)
      setAwayScore(0)
      setElapsed(0)
      setEvents([])
    } catch {
      showToast?.('Failed to save match', 'error')
    } finally {
      setSaving(false)
    }
  }

  const EVENT_TYPES = [
    { type: 'goal',         icon: '⚽', label: 'Goal' },
    { type: 'yellow',       icon: '🟨', label: 'Yellow' },
    { type: 'red',          icon: '🟥', label: 'Red Card' },
    { type: 'substitution', icon: '🔄', label: 'Sub' },
  ]

  if (phase === 'setup') {
    return (
      <div className={styles.page}>
        <div className={styles.setupWrap}>
          <div className={styles.setupHeader}>
            <div className={styles.liveIndicator}>🔴 LIVE</div>
            <h1 className={styles.setupTitle}>Live Match Tracker</h1>
            <p className={styles.setupSub}>Track goals, cards and events in real time</p>
          </div>

          <div className={styles.setupCard}>
            <div className={styles.teamsRow}>
              <div className={styles.teamInput}>
                <label className={styles.label}>Home Team</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Arsenal"
                  value={setup.homeTeam}
                  onChange={e => setSetup(s => ({ ...s, homeTeam: e.target.value }))}
                />
              </div>
              <div className={styles.vsLabel}>VS</div>
              <div className={styles.teamInput}>
                <label className={styles.label}>Away Team</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Chelsea"
                  value={setup.awayTeam}
                  onChange={e => setSetup(s => ({ ...s, awayTeam: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.setupGrid}>
              <div>
                <label className={styles.label}>Competition</label>
                <select className={styles.input} value={setup.competition} onChange={e => setSetup(s => ({ ...s, competition: e.target.value }))}>
                  {COMPETITIONS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.label}>Date</label>
                <input className={styles.input} type="date" value={setup.date} onChange={e => setSetup(s => ({ ...s, date: e.target.value }))} />
              </div>
              <div>
                <label className={styles.label}>Venue (optional)</label>
                <input className={styles.input} placeholder="e.g. Anfield" value={setup.venue} onChange={e => setSetup(s => ({ ...s, venue: e.target.value }))} />
              </div>
            </div>

            <button
              className={styles.startBtn}
              onClick={startMatch}
              disabled={!setup.homeTeam.trim() || !setup.awayTeam.trim()}
            >
              ▶ Start Match
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        <div className={styles.teamBlock}>
          <span className={styles.teamName}>{setup.homeTeam}</span>
          <span className={styles.teamSide}>HOME</span>
        </div>
        <div className={styles.scoreCenter}>
          <div className={styles.score}>
            <span className={styles.scoreNum}>{homeScore}</span>
            <span className={styles.scoreDash}>—</span>
            <span className={styles.scoreNum}>{awayScore}</span>
          </div>
          <div className={styles.timer}>{formatTime(elapsed)}</div>
          <div className={styles.timerControls}>
            <button className={styles.timerBtn} onClick={() => setRunning(r => !r)}>
              {running ? '⏸' : '▶'}
            </button>
            <button
              className={`${styles.timerBtn} ${styles.ftBtn}`}
              onClick={handleFullTime}
              disabled={saving}
            >
              {saving ? '...' : '⏹ FT'}
            </button>
          </div>
        </div>
        <div className={styles.teamBlock} style={{ alignItems: 'flex-end' }}>
          <span className={styles.teamName}>{setup.awayTeam}</span>
          <span className={styles.teamSide}>AWAY</span>
        </div>
      </div>

      {/* Event buttons */}
      <div className={styles.eventSection}>
        <div className={styles.eventCol}>
          <div className={styles.colLabel}>{setup.homeTeam}</div>
          {EVENT_TYPES.map(ev => (
            <button key={ev.type} className={`${styles.eventBtn} ${styles.homeBtn}`} onClick={() => logEvent(ev.type, 'home')}>
              {ev.icon} {ev.label}
            </button>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.eventCol}>
          <div className={styles.colLabel}>{setup.awayTeam}</div>
          {EVENT_TYPES.map(ev => (
            <button key={ev.type} className={`${styles.eventBtn} ${styles.awayBtn}`} onClick={() => logEvent(ev.type, 'away')}>
              {ev.icon} {ev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className={styles.logCard}>
        <h3 className={styles.logTitle}>Match Events {events.length > 0 && <span className={styles.logCount}>{events.length}</span>}</h3>
        {events.length === 0 ? (
          <p className={styles.logEmpty}>No events yet — tap the buttons above to log them</p>
        ) : (
          <div className={styles.logList} ref={logRef}>
            {events.map((ev, i) => (
              <div key={i} className={styles.logRow}>
                <span className={styles.logMin}>{ev.minute}'</span>
                <span className={styles.logIcon}>
                  {ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : ev.type === 'red' ? '🟥' : '🔄'}
                </span>
                <span className={styles.logDesc}>
                  {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)} — {ev.teamName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
