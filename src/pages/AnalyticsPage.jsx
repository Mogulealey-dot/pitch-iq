import { useState, useMemo } from 'react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts'
import { COMPETITIONS, getCompetitionById } from '../config/competitions'
import styles from './AnalyticsPage.module.css'

const OUTCOME_COLORS = ['#00e5a0', '#6366f1', '#f59e0b']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 2) : p.value}</div>
      ))}
    </div>
  )
}

function CircularProgress({ value, label, sub }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className={styles.circleWrap}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="var(--bg-border)" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none"
          stroke="#00e5a0" strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={64} y={60} textAnchor="middle" fill="#e8edf5" fontSize={22} fontWeight={800} fontFamily="Inter, sans-serif">
          {value}%
        </text>
        <text x={64} y={78} textAnchor="middle" fill="#7a9bbf" fontSize={11} fontFamily="Inter, sans-serif">
          accuracy
        </text>
      </svg>
      <div className={styles.circleLabel}>{label}</div>
      {sub && <div className={styles.circleSub}>{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage({ matches, teams, loading }) {
  const [h2hTeam1, setH2hTeam1] = useState('')
  const [h2hTeam2, setH2hTeam2] = useState('')

  const completed = useMemo(() =>
    matches.filter(m =>
      m.homeScore != null && m.homeScore !== '' &&
      m.awayScore != null && m.awayScore !== ''
    ), [matches])

  // Outcome distribution
  const outcomes = useMemo(() => {
    let h = 0, d = 0, a = 0
    completed.forEach(m => {
      const hs = Number(m.homeScore), as = Number(m.awayScore)
      if (hs > as) h++
      else if (hs === as) d++
      else a++
    })
    return [
      { name: 'Home Wins', value: h },
      { name: 'Draws', value: d },
      { name: 'Away Wins', value: a },
    ].filter(d => d.value > 0)
  }, [completed])

  // Goals over time — last 6 months
  const goalsOverTime = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      const monthMatches = completed.filter(m => {
        if (!m.date) return false
        try {
          const md = parseISO(m.date)
          return isWithinInterval(md, { start, end })
        } catch { return false }
      })
      const homeGoals = monthMatches.reduce((s, m) => s + Number(m.homeScore), 0)
      const awayGoals = monthMatches.reduce((s, m) => s + Number(m.awayScore), 0)
      const count = monthMatches.length
      months.push({
        month: format(d, 'MMM'),
        avgHome: count > 0 ? Number((homeGoals / count).toFixed(2)) : 0,
        avgAway: count > 0 ? Number((awayGoals / count).toFixed(2)) : 0,
        matches: count,
      })
    }
    return months
  }, [completed])

  // Competition breakdown table
  const compBreakdown = useMemo(() => {
    return COMPETITIONS.map(c => {
      const ms = completed.filter(m => m.competition === c.id)
      if (!ms.length) return null
      let hw = 0, dr = 0, aw = 0, goals = 0
      ms.forEach(m => {
        const h = Number(m.homeScore), a = Number(m.awayScore)
        goals += h + a
        if (h > a) hw++
        else if (h === a) dr++
        else aw++
      })
      return {
        id: c.id,
        emoji: c.emoji,
        label: c.label,
        matches: ms.length,
        homeWins: hw,
        draws: dr,
        awayWins: aw,
        avgGoals: (goals / ms.length).toFixed(2),
      }
    }).filter(Boolean)
  }, [completed])

  // Prediction accuracy
  const predStats = useMemo(() => {
    const predicted = completed.filter(m => m.myPrediction && m.myPrediction !== '')
    let correct = 0
    predicted.forEach(m => {
      const h = Number(m.homeScore), a = Number(m.awayScore)
      const actual = h > a ? 'home' : h === a ? 'draw' : 'away'
      if (actual === m.myPrediction) correct++
    })
    return {
      total: predicted.length,
      correct,
      accuracy: predicted.length > 0 ? Math.round((correct / predicted.length) * 100) : 0,
    }
  }, [completed])

  // H2H
  const h2hStats = useMemo(() => {
    if (!h2hTeam1 || !h2hTeam2 || h2hTeam1 === h2hTeam2) return null
    const h2hMatches = matches.filter(m =>
      (m.homeTeam === h2hTeam1 && m.awayTeam === h2hTeam2) ||
      (m.homeTeam === h2hTeam2 && m.awayTeam === h2hTeam1)
    )
    if (!h2hMatches.length) return { matches: [], t1Wins: 0, t2Wins: 0, draws: 0 }
    let t1W = 0, t2W = 0, dr = 0
    h2hMatches.forEach(m => {
      const hasScore = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
      if (!hasScore) return
      const h = Number(m.homeScore), a = Number(m.awayScore)
      const homeIsT1 = m.homeTeam === h2hTeam1
      const t1Goals = homeIsT1 ? h : a
      const t2Goals = homeIsT1 ? a : h
      if (t1Goals > t2Goals) t1W++
      else if (t2Goals > t1Goals) t2W++
      else dr++
    })
    return { matches: h2hMatches, t1Wins: t1W, t2Wins: t2W, draws: dr }
  }, [h2hTeam1, h2hTeam2, matches])

  // Top scoring matches
  const topScoring = useMemo(() => {
    return [...completed]
      .sort((a, b) => (Number(b.homeScore) + Number(b.awayScore)) - (Number(a.homeScore) + Number(a.awayScore)))
      .slice(0, 5)
  }, [completed])

  // All team names for H2H picker
  const allTeamNames = useMemo(() => {
    const names = new Set()
    matches.forEach(m => {
      if (m.homeTeam) names.add(m.homeTeam)
      if (m.awayTeam) names.add(m.awayTeam)
    })
    teams.forEach(t => { if (t.name) names.add(t.name) })
    return [...names].sort()
  }, [matches, teams])

  if (loading) return <div className={styles.loading}>Loading analytics...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.sub}>{completed.length} completed matches analysed</p>
      </div>

      <div className={styles.grid}>
        {/* Match Outcomes Pie */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Match Outcomes</h2>
          {outcomes.length === 0 ? (
            <div className={styles.empty}>No completed matches yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={outcomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomes.map((_, i) => (
                      <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                {outcomes.map((o, i) => (
                  <div key={o.name} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: OUTCOME_COLORS[i] }} />
                    <span className={styles.legendLabel}>{o.name}</span>
                    <span className={styles.legendVal}>{o.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Prediction accuracy circle */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Prediction Accuracy</h2>
          {predStats.total === 0 ? (
            <div className={styles.empty}>No predictions recorded yet.</div>
          ) : (
            <div className={styles.predCenter}>
              <CircularProgress
                value={predStats.accuracy}
                label="Overall Accuracy"
                sub={`${predStats.correct} correct out of ${predStats.total}`}
              />
            </div>
          )}
        </div>

        {/* Goals over time */}
        <div className={`${styles.card} ${styles.wideCard}`}>
          <h2 className={styles.cardTitle}>Goals Over Time</h2>
          <p className={styles.cardSub}>Average home vs away goals — last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={goalsOverTime} margin={{ top: 8, right: 16, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
              <XAxis dataKey="month" tick={{ fill: '#7a9bbf', fontSize: 12 }} />
              <YAxis tick={{ fill: '#3d5a7a', fontSize: 11 }} allowDecimals={true} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => <span style={{ color: '#7a9bbf', fontSize: '0.8rem' }}>{val}</span>}
              />
              <Line type="monotone" dataKey="avgHome" name="Avg Home Goals" stroke="#00e5a0" strokeWidth={2.5} dot={{ fill: '#00e5a0', r: 4 }} />
              <Line type="monotone" dataKey="avgAway" name="Avg Away Goals" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Competition breakdown */}
        <div className={`${styles.card} ${styles.wideCard}`}>
          <h2 className={styles.cardTitle}>Competition Breakdown</h2>
          {compBreakdown.length === 0 ? (
            <div className={styles.empty}>Record matches to see competition breakdown.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Competition</th>
                    <th>Matches</th>
                    <th>Home W</th>
                    <th>Draws</th>
                    <th>Away W</th>
                    <th>Avg Goals</th>
                  </tr>
                </thead>
                <tbody>
                  {compBreakdown.map(c => (
                    <tr key={c.id}>
                      <td><span className={styles.compCell}>{c.emoji} {c.label}</span></td>
                      <td className={styles.numCell}>{c.matches}</td>
                      <td className={`${styles.numCell} ${styles.green}`}>{c.homeWins}</td>
                      <td className={`${styles.numCell} ${styles.yellow}`}>{c.draws}</td>
                      <td className={`${styles.numCell} ${styles.red}`}>{c.awayWins}</td>
                      <td className={`${styles.numCell} ${styles.accent}`}>{c.avgGoals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Head-to-head */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Head to Head</h2>
          <div className={styles.h2hPickers}>
            <select className={styles.select} value={h2hTeam1} onChange={e => setH2hTeam1(e.target.value)}>
              <option value="">Select Team 1</option>
              {allTeamNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className={styles.versus}>vs</span>
            <select className={styles.select} value={h2hTeam2} onChange={e => setH2hTeam2(e.target.value)}>
              <option value="">Select Team 2</option>
              {allTeamNames.filter(n => n !== h2hTeam1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {h2hStats && (
            <div className={styles.h2hStats}>
              <div className={styles.h2hRow}>
                <div className={styles.h2hTeam}>{h2hTeam1}</div>
                <div className={styles.h2hNumbers}>
                  <span className={styles.h2hWin}>{h2hStats.t1Wins}</span>
                  <span className={styles.h2hDraw}>{h2hStats.draws}</span>
                  <span className={styles.h2hLoss}>{h2hStats.t2Wins}</span>
                </div>
                <div className={styles.h2hTeam} style={{ textAlign: 'right' }}>{h2hTeam2}</div>
              </div>
              <div className={styles.h2hLabels}>
                <span>Wins</span><span>Draws</span><span>Wins</span>
              </div>
              <div className={styles.h2hCount}>{h2hStats.matches.length} match{h2hStats.matches.length !== 1 ? 'es' : ''} recorded</div>
            </div>
          )}
        </div>

        {/* Top scoring matches */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top Scoring Matches</h2>
          {topScoring.length === 0 ? (
            <div className={styles.empty}>No scored matches yet.</div>
          ) : (
            <div className={styles.topList}>
              {topScoring.map((m, i) => {
                const total = Number(m.homeScore) + Number(m.awayScore)
                const comp = getCompetitionById(m.competition)
                return (
                  <div key={m.id} className={styles.topRow}>
                    <span className={styles.topRank}>{i + 1}</span>
                    <div className={styles.topMatch}>
                      <div className={styles.topTeams}>
                        <span>{m.homeTeam}</span>
                        <span className={styles.topScore}>{m.homeScore} — {m.awayScore}</span>
                        <span>{m.awayTeam}</span>
                      </div>
                      <div className={styles.topMeta}>
                        <span>{comp.emoji} {comp.label}</span>
                        {m.date && <span>{format(parseISO(m.date), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                    <span className={styles.topGoals}>{total} goals</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
