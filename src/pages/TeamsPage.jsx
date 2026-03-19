import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { getCompetitionById } from '../config/competitions'
import styles from './TeamsPage.module.css'

const EMOJI_OPTIONS = ['⚽', '🏆', '🔵', '🔴', '⚪', '🟡', '🟢', '🟣', '🟠', '⚫', '🦁', '🐦', '🦅', '⭐', '🌟', '🔥', '💪']

const EMPTY_FORM = {
  name: '',
  shortName: '',
  emoji: '⚽',
  color: '#00e5a0',
  league: '',
  country: '',
}

export default function TeamsPage({ teams, matches, addTeam, updateTeam, removeTeam, loading, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (t) => {
    setForm({
      name: t.name || '',
      shortName: t.shortName || '',
      emoji: t.emoji || '⚽',
      color: t.color || '#00e5a0',
      league: t.league || '',
      country: t.country || '',
    })
    setEditId(t.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      shortName: form.shortName.trim().toUpperCase().slice(0, 3),
      emoji: form.emoji,
      color: form.color,
      league: form.league.trim(),
      country: form.country.trim(),
    }
    if (editId) {
      await updateTeam(editId, payload)
    } else {
      await addTeam(payload)
      showToast?.('Team added')
    }
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const handleDelete = async (id) => {
    await removeTeam(id)
    setConfirmDelete(null)
    if (selectedTeam?.id === id) setSelectedTeam(null)
    showToast?.('Team removed', 'error')
  }

  // Compute team stats from matches
  const teamStats = useMemo(() => {
    const map = {}
    teams.forEach(t => {
      map[t.name] = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
    })
    matches.forEach(m => {
      const hasScore = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
      const h = Number(m.homeScore), a = Number(m.awayScore)
      // home team
      if (m.homeTeam && map[m.homeTeam] !== undefined) {
        map[m.homeTeam].played++
        if (hasScore) {
          map[m.homeTeam].goalsFor += h
          map[m.homeTeam].goalsAgainst += a
          if (h > a) map[m.homeTeam].wins++
          else if (h === a) map[m.homeTeam].draws++
          else map[m.homeTeam].losses++
        }
      }
      // away team
      if (m.awayTeam && map[m.awayTeam] !== undefined) {
        map[m.awayTeam].played++
        if (hasScore) {
          map[m.awayTeam].goalsFor += a
          map[m.awayTeam].goalsAgainst += h
          if (a > h) map[m.awayTeam].wins++
          else if (h === a) map[m.awayTeam].draws++
          else map[m.awayTeam].losses++
        }
      }
    })
    return map
  }, [teams, matches])

  const teamMatches = useMemo(() => {
    if (!selectedTeam) return []
    return matches
      .filter(m => m.homeTeam === selectedTeam.name || m.awayTeam === selectedTeam.name)
      .sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date)
      })
  }, [selectedTeam, matches])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Teams</h1>
          <p className={styles.sub}>{teams.length} teams tracked</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Team</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className={styles.empty}>
          No teams yet. <button className={styles.emptyLink} onClick={openAdd}>Add your first team →</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {teams.map(t => {
            const s = teamStats[t.name] || { played: 0, wins: 0, draws: 0, losses: 0 }
            const winRate = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0
            return (
              <div
                key={t.id}
                className={`${styles.card} ${selectedTeam?.id === t.id ? styles.cardActive : ''}`}
                style={{ '--team-color': t.color || '#00e5a0' }}
                onClick={() => setSelectedTeam(selectedTeam?.id === t.id ? null : t)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.teamEmoji} style={{ background: (t.color || '#00e5a0') + '22', borderColor: (t.color || '#00e5a0') + '44' }}>
                    {t.emoji || '⚽'}
                  </div>
                  <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                    <button className={styles.editBtn} onClick={() => openEdit(t)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setConfirmDelete(t.id)}>✕</button>
                  </div>
                </div>
                <div className={styles.teamName}>{t.name}</div>
                {t.shortName && <div className={styles.shortName}>{t.shortName}</div>}
                {t.league && <div className={styles.league}>{t.league}{t.country ? ` · ${t.country}` : ''}</div>}

                <div className={styles.statsRow}>
                  <div className={styles.stat}><span className={styles.statVal}>{s.played}</span><span className={styles.statLbl}>P</span></div>
                  <div className={styles.stat}><span className={`${styles.statVal} ${styles.win}`}>{s.wins}</span><span className={styles.statLbl}>W</span></div>
                  <div className={styles.stat}><span className={`${styles.statVal} ${styles.draw}`}>{s.draws}</span><span className={styles.statLbl}>D</span></div>
                  <div className={styles.stat}><span className={`${styles.statVal} ${styles.loss}`}>{s.losses}</span><span className={styles.statLbl}>L</span></div>
                </div>

                <div className={styles.winRateBar}>
                  <div className={styles.winRateFill} style={{ width: winRate + '%', background: t.color || '#00e5a0' }} />
                </div>
                <div className={styles.winRateLabel}>{winRate}% win rate</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Team match history */}
      {selectedTeam && (
        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}>
              {selectedTeam.emoji} {selectedTeam.name} — Match History
            </h2>
            <button className={styles.closeBtn} onClick={() => setSelectedTeam(null)}>✕</button>
          </div>
          {teamMatches.length === 0 ? (
            <div className={styles.empty}>No matches recorded for this team yet.</div>
          ) : (
            <div className={styles.matchList}>
              {teamMatches.map(m => {
                const hasScore = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
                const comp = getCompetitionById(m.competition)
                const isHome = m.homeTeam === selectedTeam.name
                let resultClass = ''
                if (hasScore) {
                  const h = Number(m.homeScore), a = Number(m.awayScore)
                  const teamGoals = isHome ? h : a
                  const oppGoals = isHome ? a : h
                  if (teamGoals > oppGoals) resultClass = styles.win
                  else if (teamGoals === oppGoals) resultClass = styles.draw
                  else resultClass = styles.loss
                }
                return (
                  <div key={m.id} className={styles.matchRow}>
                    <span className={styles.matchDate}>{m.date ? format(parseISO(m.date), 'MMM d, yyyy') : '—'}</span>
                    <span className={styles.matchTeams}>
                      <strong>{m.homeTeam}</strong> vs <strong>{m.awayTeam}</strong>
                    </span>
                    {hasScore && (
                      <span className={`${styles.matchScore} ${resultClass}`}>
                        {m.homeScore} — {m.awayScore}
                      </span>
                    )}
                    <span className={styles.compBadge} style={{ background: comp.color + '33', borderColor: comp.color + '66' }}>
                      {comp.emoji} {comp.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h3>Delete Team?</h3>
            <p>This will not delete the matches. Cannot be undone.</p>
            <div className={styles.dialogBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editId ? 'Edit Team' : 'Add Team'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Team Name</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Arsenal"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Short Name (3 chars)</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. ARS"
                    maxLength={3}
                    value={form.shortName}
                    onChange={e => setField('shortName', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>League</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Premier League"
                    value={form.league}
                    onChange={e => setField('league', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Country</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. England"
                    value={form.country}
                    onChange={e => setField('country', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Team Emoji</label>
                <div className={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      className={`${styles.emojiBtn} ${form.emoji === em ? styles.emojiBtnActive : ''}`}
                      onClick={() => setField('emoji', em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Team Color</label>
                <div className={styles.colorRow}>
                  <input
                    className={styles.colorInput}
                    type="color"
                    value={form.color}
                    onChange={e => setField('color', e.target.value)}
                  />
                  <span className={styles.colorValue}>{form.color}</span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>{editId ? 'Save Changes' : 'Add Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
