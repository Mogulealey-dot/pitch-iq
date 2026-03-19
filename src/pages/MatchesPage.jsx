import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { COMPETITIONS, getCompetitionById } from '../config/competitions'
import styles from './MatchesPage.module.css'

const STATUS_OPTIONS = ['FT', 'AET', 'Pens']

const STATUS_STYLES = {
  FT:   { background: 'rgba(34,197,94,0.15)',  color: '#22c55e',  border: 'rgba(34,197,94,0.3)' },
  AET:  { background: 'rgba(245,158,11,0.15)', color: '#f59e0b',  border: 'rgba(245,158,11,0.3)' },
  Pens: { background: 'rgba(99,102,241,0.15)', color: '#818cf8',  border: 'rgba(99,102,241,0.3)' },
}

const EMPTY_FORM = {
  homeTeam: '', awayTeam: '',
  homeScore: '', awayScore: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  competition: 'premier-league',
  venue: '',
  status: 'FT',
  homePossession: 50, awayPossession: 50,
  homeShots: '', awayShots: '',
  homeOnTarget: '', awayOnTarget: '',
  homeCorners: '', awayCorners: '',
  homeFouls: '', awayFouls: '',
  homeYellow: '', awayYellow: '',
  homeRed: '', awayRed: '',
  myPrediction: '',
  notes: '',
  tags: '',
  showStats: false,
}

function CompBadge({ competitionId }) {
  const comp = getCompetitionById(competitionId)
  return (
    <span className={styles.compBadge} style={{ background: comp.color + '33', borderColor: comp.color + '66' }}>
      {comp.emoji} {comp.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.FT
  return (
    <span className={styles.statusBadge} style={{ background: s.background, color: s.color, borderColor: s.border }}>
      {status}
    </span>
  )
}

function PredictionIcon({ match }) {
  if (!match.myPrediction) return <span className={styles.predNone}>—</span>
  const hasResult = match.homeScore != null && match.homeScore !== '' && match.awayScore != null && match.awayScore !== ''
  if (!hasResult) return <span className={styles.predPending} title="Pending">●</span>
  const h = Number(match.homeScore), a = Number(match.awayScore)
  const actual = h > a ? 'home' : h === a ? 'draw' : 'away'
  if (actual === match.myPrediction) return <span className={styles.predCorrect} title="Correct prediction">✓</span>
  return <span className={styles.predWrong} title="Wrong prediction">✗</span>
}

export default function MatchesPage({ matches, addMatch, updateMatch, removeMatch, loading, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterComp, setFilterComp] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePossessionChange = (side, val) => {
    const n = Math.min(100, Math.max(0, Number(val)))
    if (side === 'home') {
      setForm(f => ({ ...f, homePossession: n, awayPossession: 100 - n }))
    } else {
      setForm(f => ({ ...f, awayPossession: n, homePossession: 100 - n }))
    }
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (m) => {
    setForm({
      homeTeam: m.homeTeam || '',
      awayTeam: m.awayTeam || '',
      homeScore: m.homeScore ?? '',
      awayScore: m.awayScore ?? '',
      date: m.date || format(new Date(), 'yyyy-MM-dd'),
      competition: m.competition || 'premier-league',
      venue: m.venue || '',
      status: m.status || 'FT',
      homePossession: m.stats?.homePossession ?? 50,
      awayPossession: m.stats?.awayPossession ?? 50,
      homeShots: m.stats?.homeShots ?? '',
      awayShots: m.stats?.awayShots ?? '',
      homeOnTarget: m.stats?.homeOnTarget ?? '',
      awayOnTarget: m.stats?.awayOnTarget ?? '',
      homeCorners: m.stats?.homeCorners ?? '',
      awayCorners: m.stats?.awayCorners ?? '',
      homeFouls: m.stats?.homeFouls ?? '',
      awayFouls: m.stats?.awayFouls ?? '',
      homeYellow: m.stats?.homeYellow ?? '',
      awayYellow: m.stats?.awayYellow ?? '',
      homeRed: m.stats?.homeRed ?? '',
      awayRed: m.stats?.awayRed ?? '',
      myPrediction: m.myPrediction || '',
      notes: m.notes || '',
      tags: Array.isArray(m.tags) ? m.tags.join(', ') : (m.tags || ''),
      showStats: false,
    })
    setEditId(m.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const payload = {
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      homeScore: form.homeScore === '' ? null : Number(form.homeScore),
      awayScore: form.awayScore === '' ? null : Number(form.awayScore),
      date: form.date,
      competition: form.competition,
      venue: form.venue.trim(),
      status: form.status,
      stats: {
        homePossession: Number(form.homePossession),
        awayPossession: Number(form.awayPossession),
        homeShots: form.homeShots === '' ? null : Number(form.homeShots),
        awayShots: form.awayShots === '' ? null : Number(form.awayShots),
        homeOnTarget: form.homeOnTarget === '' ? null : Number(form.homeOnTarget),
        awayOnTarget: form.awayOnTarget === '' ? null : Number(form.awayOnTarget),
        homeCorners: form.homeCorners === '' ? null : Number(form.homeCorners),
        awayCorners: form.awayCorners === '' ? null : Number(form.awayCorners),
        homeFouls: form.homeFouls === '' ? null : Number(form.homeFouls),
        awayFouls: form.awayFouls === '' ? null : Number(form.awayFouls),
        homeYellow: form.homeYellow === '' ? null : Number(form.homeYellow),
        awayYellow: form.awayYellow === '' ? null : Number(form.awayYellow),
        homeRed: form.homeRed === '' ? null : Number(form.homeRed),
        awayRed: form.awayRed === '' ? null : Number(form.awayRed),
      },
      myPrediction: form.myPrediction,
      notes: form.notes.trim(),
      tags: tagsArr,
    }
    if (editId) {
      await updateMatch(editId, payload)
      showToast?.('Match updated')
    } else {
      await addMatch(payload)
      showToast?.('Match recorded ⚽')
    }
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const handleDelete = async (id) => {
    await removeMatch(id)
    setConfirmDelete(null)
    showToast?.('Match deleted', 'error')
  }

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (filterComp && m.competition !== filterComp) return false
      if (filterStatus && m.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !m.homeTeam?.toLowerCase().includes(q) &&
          !m.awayTeam?.toLowerCase().includes(q) &&
          !m.venue?.toLowerCase().includes(q)
        ) return false
      }
      if (filterFrom && m.date && m.date < filterFrom) return false
      if (filterTo && m.date && m.date > filterTo) return false
      return true
    }).sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return b.date.localeCompare(a.date)
    })
  }, [matches, filterComp, filterStatus, search, filterFrom, filterTo])

  const totalGoals = filtered.reduce((s, m) => {
    if (m.homeScore != null && m.awayScore != null) {
      return s + Number(m.homeScore) + Number(m.awayScore)
    }
    return s
  }, 0)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Matches</h1>
          <p className={styles.sub}>{matches.length} total recorded</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ Record Match</button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search teams or venue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.select} value={filterComp} onChange={e => setFilterComp(e.target.value)}>
          <option value="">All Competitions</option>
          {COMPETITIONS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
        <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className={styles.dateInput}
          type="date"
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          placeholder="From"
        />
        <input
          className={styles.dateInput}
          type="date"
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          placeholder="To"
        />
        {(filterComp || filterStatus || filterFrom || filterTo || search) && (
          <button className={styles.clearBtn} onClick={() => {
            setFilterComp(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setSearch('')
          }}>Clear</button>
        )}
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <span>{filtered.length} matches shown</span>
        <span>·</span>
        <span>{totalGoals} total goals</span>
      </div>

      {/* Match list */}
      {loading ? (
        <div className={styles.loading}>Loading matches...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {matches.length === 0 ? (
            <>No matches yet. <button className={styles.emptyLink} onClick={openAdd}>Record your first match →</button></>
          ) : 'No matches match your filters.'}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(m => {
            const hasScore = m.homeScore != null && m.homeScore !== '' && m.awayScore != null && m.awayScore !== ''
            return (
              <div key={m.id} className={styles.row}>
                <div className={styles.rowDate}>
                  {m.date ? format(parseISO(m.date), 'MMM d, yyyy') : '—'}
                </div>
                <div className={styles.rowMatch}>
                  <span className={styles.teamHome}>{m.homeTeam || '—'}</span>
                  <span className={styles.rowScore}>
                    {hasScore ? `${m.homeScore} — ${m.awayScore}` : 'vs'}
                  </span>
                  <span className={styles.teamAway}>{m.awayTeam || '—'}</span>
                </div>
                <div className={styles.rowMeta}>
                  <CompBadge competitionId={m.competition} />
                  {m.status && <StatusBadge status={m.status} />}
                  <PredictionIcon match={m} />
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(m)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => setConfirmDelete(m.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h3>Delete Match?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.dialogBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editId ? 'Edit Match' : 'Record Match'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Teams + Score */}
              <div className={styles.scoreRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Home Team</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Arsenal"
                    value={form.homeTeam}
                    onChange={e => setField('homeTeam', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.scoreInputs}>
                  <input
                    className={`${styles.input} ${styles.scoreNum}`}
                    type="number"
                    min="0"
                    placeholder="—"
                    value={form.homeScore}
                    onChange={e => setField('homeScore', e.target.value)}
                  />
                  <span className={styles.scoreDash}>—</span>
                  <input
                    className={`${styles.input} ${styles.scoreNum}`}
                    type="number"
                    min="0"
                    placeholder="—"
                    value={form.awayScore}
                    onChange={e => setField('awayScore', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Away Team</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Chelsea"
                    value={form.awayTeam}
                    onChange={e => setField('awayTeam', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Date, Competition, Venue, Status */}
              <div className={styles.row4}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Date</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.date}
                    onChange={e => setField('date', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Competition</label>
                  <select className={styles.select} value={form.competition} onChange={e => setField('competition', e.target.value)}>
                    {COMPETITIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Venue</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Emirates Stadium"
                    value={form.venue}
                    onChange={e => setField('venue', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.select} value={form.status} onChange={e => setField('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Stats toggle */}
              <button
                type="button"
                className={styles.statsToggle}
                onClick={() => setField('showStats', !form.showStats)}
              >
                {form.showStats ? '▼' : '▶'} Match Stats (optional)
              </button>

              {form.showStats && (
                <div className={styles.statsSection}>
                  {/* Possession */}
                  <div className={styles.statRow}>
                    <label className={styles.label}>Possession</label>
                    <div className={styles.possessionRow}>
                      <input
                        className={`${styles.input} ${styles.possInput}`}
                        type="number"
                        min="0" max="100"
                        value={form.homePossession}
                        onChange={e => handlePossessionChange('home', e.target.value)}
                      />
                      <div className={styles.possBar}>
                        <div className={styles.possHome} style={{ width: form.homePossession + '%' }} />
                      </div>
                      <input
                        className={`${styles.input} ${styles.possInput}`}
                        type="number"
                        min="0" max="100"
                        value={form.awayPossession}
                        onChange={e => handlePossessionChange('away', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Stat grid */}
                  <div className={styles.statsGrid}>
                    {[
                      ['Shots', 'homeShots', 'awayShots'],
                      ['On Target', 'homeOnTarget', 'awayOnTarget'],
                      ['Corners', 'homeCorners', 'awayCorners'],
                      ['Fouls', 'homeFouls', 'awayFouls'],
                      ['Yellow Cards', 'homeYellow', 'awayYellow'],
                      ['Red Cards', 'homeRed', 'awayRed'],
                    ].map(([lbl, hk, ak]) => (
                      <div key={lbl} className={styles.statItem}>
                        <input
                          className={`${styles.input} ${styles.statInput}`}
                          type="number" min="0"
                          placeholder="0"
                          value={form[hk]}
                          onChange={e => setField(hk, e.target.value)}
                        />
                        <span className={styles.statLabel}>{lbl}</span>
                        <input
                          className={`${styles.input} ${styles.statInput}`}
                          type="number" min="0"
                          placeholder="0"
                          value={form[ak]}
                          onChange={e => setField(ak, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prediction */}
              <div className={styles.formGroup}>
                <label className={styles.label}>My Prediction</label>
                <div className={styles.predRadios}>
                  {[
                    { val: 'home', label: 'Home Win' },
                    { val: 'draw', label: 'Draw' },
                    { val: 'away', label: 'Away Win' },
                    { val: '',     label: 'None' },
                  ].map(({ val, label }) => (
                    <label key={val || 'none'} className={`${styles.radio} ${form.myPrediction === val ? styles.radioActive : ''}`}>
                      <input
                        type="radio"
                        name="prediction"
                        value={val}
                        checked={form.myPrediction === val}
                        onChange={() => setField('myPrediction', val)}
                        style={{ display: 'none' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes + Tags */}
              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Notes</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Any notes about this match..."
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tags (comma separated)</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. derby, cup final, upset"
                    value={form.tags}
                    onChange={e => setField('tags', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editId ? 'Save Changes' : 'Record Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
