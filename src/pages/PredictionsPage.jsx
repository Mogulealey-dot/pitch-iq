import { useState, useMemo } from 'react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getCompetitionById } from '../config/competitions'
import styles from './PredictionsPage.module.css'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill }}>{p.name}: {p.value}{p.name === 'Accuracy' ? '%' : ''}</div>
      ))}
    </div>
  )
}

export default function PredictionsPage({ matches, loading }) {
  const [filter, setFilter] = useState('all')

  // Only matches with a prediction set
  const withPrediction = useMemo(() =>
    [...matches]
      .filter(m => m.myPrediction && m.myPrediction !== '')
      .sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date)
      }),
    [matches]
  )

  const getStatus = (m) => {
    const hasResult = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
    if (!hasResult) return 'pending'
    const h = Number(m.homeScore), a = Number(m.awayScore)
    const actual = h > a ? 'home' : h === a ? 'draw' : 'away'
    return actual === m.myPrediction ? 'correct' : 'wrong'
  }

  const stats = useMemo(() => {
    const total = withPrediction.length
    let correct = 0, wrong = 0, pending = 0
    withPrediction.forEach(m => {
      const s = getStatus(m)
      if (s === 'correct') correct++
      else if (s === 'wrong') wrong++
      else pending++
    })
    const accuracy = (total - pending) > 0 ? Math.round((correct / (total - pending)) * 100) : 0
    return { total, correct, wrong, pending, accuracy }
  }, [withPrediction])

  const filtered = useMemo(() => {
    if (filter === 'all') return withPrediction
    return withPrediction.filter(m => getStatus(m) === filter)
  }, [withPrediction, filter])

  // Monthly accuracy chart — last 6 months
  const monthlyChart = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      const monthPreds = withPrediction.filter(m => {
        if (!m.date) return false
        try { return isWithinInterval(parseISO(m.date), { start, end }) }
        catch { return false }
      })
      const resolved = monthPreds.filter(m => getStatus(m) !== 'pending')
      const correct = resolved.filter(m => getStatus(m) === 'correct').length
      const acc = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0
      result.push({
        month: format(d, 'MMM'),
        accuracy: acc,
        count: resolved.length,
      })
    }
    return result
  }, [withPrediction])

  const PRED_LABEL = { home: 'Home Win', draw: 'Draw', away: 'Away Win' }

  if (loading) return <div className={styles.loading}>Loading predictions...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Predictions</h1>
        <p className={styles.sub}>Track how well your match predictions perform</p>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Predictions</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Correct</div>
          <div className={`${styles.statValue} ${styles.green}`}>{stats.correct}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Wrong</div>
          <div className={`${styles.statValue} ${styles.red}`}>{stats.wrong}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending</div>
          <div className={`${styles.statValue} ${styles.yellow}`}>{stats.pending}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Accuracy</div>
          <div className={`${styles.statValue} ${styles.accent}`}>{stats.accuracy}%</div>
          <div className={styles.statSub}>{stats.total - stats.pending} resolved</div>
        </div>
      </div>

      {/* Monthly chart */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Monthly Accuracy</h2>
        <p className={styles.cardSub}>Prediction accuracy % per month (resolved predictions only)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: -20, bottom: 5 }}>
            <XAxis dataKey="month" tick={{ fill: '#7a9bbf', fontSize: 12 }} />
            <YAxis tick={{ fill: '#3d5a7a', fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
              {monthlyChart.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.accuracy >= 60 ? '#00e5a0' : entry.accuracy >= 40 ? '#f59e0b' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {['all', 'correct', 'wrong', 'pending'].map(f => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.filterCount}>
              {f === 'all' ? stats.total : f === 'correct' ? stats.correct : f === 'wrong' ? stats.wrong : stats.pending}
            </span>
          </button>
        ))}
      </div>

      {/* Prediction list */}
      {withPrediction.length === 0 ? (
        <div className={styles.empty}>
          No predictions yet. Add predictions when recording matches.
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No {filter} predictions.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map(m => {
            const status = getStatus(m)
            const comp = getCompetitionById(m.competition)
            const hasResult = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
            const h = hasResult ? Number(m.homeScore) : null
            const a = hasResult ? Number(m.awayScore) : null
            const actualResult = hasResult
              ? (h > a ? 'Home Win' : h === a ? 'Draw' : 'Away Win')
              : null
            return (
              <div key={m.id} className={`${styles.row} ${styles['row_' + status]}`}>
                <div className={styles.rowDate}>
                  {m.date ? format(parseISO(m.date), 'MMM d, yyyy') : '—'}
                </div>
                <div className={styles.rowMatch}>
                  <span className={styles.teamName}>{m.homeTeam || '—'}</span>
                  <span className={styles.score}>
                    {hasResult ? `${m.homeScore} — ${m.awayScore}` : 'Pending'}
                  </span>
                  <span className={styles.teamName} style={{ textAlign: 'right' }}>{m.awayTeam || '—'}</span>
                </div>
                <div className={styles.rowPred}>
                  <div className={styles.predItem}>
                    <span className={styles.predLabel}>My Prediction</span>
                    <span className={styles.predValue}>{PRED_LABEL[m.myPrediction] || m.myPrediction}</span>
                  </div>
                  {actualResult && (
                    <div className={styles.predItem}>
                      <span className={styles.predLabel}>Result</span>
                      <span className={styles.predValue}>{actualResult}</span>
                    </div>
                  )}
                </div>
                <div className={styles.rowComp}>
                  <span className={styles.compBadge} style={{ background: comp.color + '33', borderColor: comp.color + '66' }}>
                    {comp.emoji} {comp.label}
                  </span>
                </div>
                <div className={`${styles.statusBadge} ${styles[status]}`}>
                  {status === 'correct' && '✓ Correct'}
                  {status === 'wrong' && '✗ Wrong'}
                  {status === 'pending' && '● Pending'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
