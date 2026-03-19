import { format, parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { COMPETITIONS, getCompetitionById } from '../config/competitions'
import styles from './DashboardPage.module.css'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${accent ? styles.accent : ''}`}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function CompBadge({ competitionId }) {
  const comp = getCompetitionById(competitionId)
  return (
    <span className={styles.compBadge} style={{ background: comp.color + '33', borderColor: comp.color + '66' }}>
      {comp.emoji} {comp.label}
    </span>
  )
}

const FORM_COLORS = { H: '#22c55e', D: '#f59e0b', A: '#ef4444' }
const FORM_LABELS = { H: 'H', D: 'D', A: 'A' }

export default function DashboardPage({ user, matches, stats, loading, onNavigate }) {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Manager'

  // Top competitions bar chart data
  const compChartData = COMPETITIONS
    .map(c => ({ name: c.label, emoji: c.emoji, count: stats.byCompetition[c.id] || 0, color: c.color }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  // Goal distribution by competition
  const goalDistData = COMPETITIONS.map(c => {
    const compMatches = matches.filter(m =>
      m.competition === c.id &&
      m.homeScore != null && m.homeScore !== '' &&
      m.awayScore != null && m.awayScore !== ''
    )
    if (!compMatches.length) return null
    const avgHome = (compMatches.reduce((s, m) => s + Number(m.homeScore), 0) / compMatches.length).toFixed(1)
    const avgAway = (compMatches.reduce((s, m) => s + Number(m.awayScore), 0) / compMatches.length).toFixed(1)
    return { name: c.emoji + ' ' + c.label.split(' ').slice(0, 2).join(' '), avgHome: Number(avgHome), avgAway: Number(avgAway) }
  }).filter(Boolean)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className={styles.loading}>Loading your data...</div>
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, {displayName} 👋</h1>
          <p className={styles.date}>{today}</p>
        </div>
        <button className={styles.recordBtn} onClick={() => onNavigate('matches')}>
          + Record Match
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <StatCard label="Total Matches" value={stats.totalMatches} sub="recorded" />
        <StatCard
          label="Home Win Rate"
          value={stats.totalCompleted > 0 ? `${Math.round((stats.homeWins / stats.totalCompleted) * 100)}%` : '—'}
          sub={`${stats.homeWins} home wins`}
          accent
        />
        <StatCard
          label="Avg Goals / Match"
          value={stats.avgGoals}
          sub="per game"
        />
        <StatCard
          label="Prediction Accuracy"
          value={stats.predictionAccuracy != null ? `${stats.predictionAccuracy}%` : '—'}
          sub={stats.totalPredicted > 0 ? `${stats.correctPredictions}/${stats.totalPredicted} correct` : 'No predictions yet'}
          accent
        />
      </div>

      <div className={styles.grid}>
        {/* Recent matches */}
        <div className={`${styles.card} ${styles.recentCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Matches</h2>
            <button className={styles.viewAll} onClick={() => onNavigate('matches')}>View all →</button>
          </div>
          {stats.recentMatches.length === 0 ? (
            <div className={styles.empty}>No matches recorded yet. <button className={styles.emptyLink} onClick={() => onNavigate('matches')}>Record your first match →</button></div>
          ) : (
            <div className={styles.matchList}>
              {stats.recentMatches.map(m => {
                const hasScore = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
                return (
                  <div key={m.id} className={styles.matchRow}>
                    <div className={styles.matchDate}>
                      {m.date ? format(parseISO(m.date), 'MMM d') : '—'}
                    </div>
                    <div className={styles.matchTeams}>
                      <span className={styles.teamName}>{m.homeTeam || '—'}</span>
                      <span className={styles.score}>
                        {hasScore ? `${m.homeScore} — ${m.awayScore}` : 'vs'}
                      </span>
                      <span className={styles.teamName}>{m.awayTeam || '—'}</span>
                    </div>
                    <CompBadge competitionId={m.competition} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form guide */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Form Guide</h2>
            <span className={styles.cardSub}>Last 10 matches</span>
          </div>
          {stats.last10Form.length === 0 ? (
            <div className={styles.empty}>No completed matches yet.</div>
          ) : (
            <div className={styles.formGuide}>
              {stats.last10Form.map((result, i) => (
                <div
                  key={i}
                  className={styles.formDot}
                  style={{ background: FORM_COLORS[result] }}
                  title={result === 'H' ? 'Home Win' : result === 'D' ? 'Draw' : 'Away Win'}
                >
                  {FORM_LABELS[result]}
                </div>
              ))}
            </div>
          )}
          <div className={styles.formLegend}>
            <span><span className={styles.dot} style={{ background: '#22c55e' }} />H Win</span>
            <span><span className={styles.dot} style={{ background: '#f59e0b' }} />Draw</span>
            <span><span className={styles.dot} style={{ background: '#ef4444' }} />A Win</span>
          </div>
        </div>

        {/* Top competitions */}
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top Competitions</h2>
            <span className={styles.cardSub}>by matches recorded</span>
          </div>
          {compChartData.length === 0 ? (
            <div className={styles.empty}>Record matches to see competition breakdown.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compChartData} margin={{ top: 8, right: 8, left: -20, bottom: 5 }}>
                <XAxis dataKey="emoji" tick={{ fill: '#7a9bbf', fontSize: 18 }} />
                <YAxis tick={{ fill: '#3d5a7a', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Matches" radius={[4, 4, 0, 0]}>
                  {compChartData.map((entry, i) => (
                    <Cell key={i} fill="#00e5a0" opacity={1 - i * 0.08} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Goal distribution */}
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Goal Distribution</h2>
            <span className={styles.cardSub}>avg home vs away goals</span>
          </div>
          {goalDistData.length === 0 ? (
            <div className={styles.empty}>Record matches with scores to see goal distribution.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={goalDistData} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#7a9bbf', fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: '#3d5a7a', fontSize: 11 }} allowDecimals={true} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgHome" name="Avg Home Goals" fill="#00e5a0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="avgAway" name="Avg Away Goals" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
