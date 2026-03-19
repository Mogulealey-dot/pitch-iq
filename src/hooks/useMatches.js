import { useMemo } from 'react'
import { useFirestore } from './useFirestore'
import { parseISO, isValid } from 'date-fns'

export function useMatches(uid) {
  const {
    data: matches,
    loading: matchesLoading,
    add: addMatch,
    update: updateMatch,
    remove: removeMatch,
  } = useFirestore(uid, 'matches')

  const {
    data: teams,
    loading: teamsLoading,
    add: addTeam,
    update: updateTeam,
    remove: removeTeam,
  } = useFirestore(uid, 'teams')

  const stats = useMemo(() => {
    const completed = matches.filter(m =>
      m.homeScore !== '' && m.homeScore != null &&
      m.awayScore !== '' && m.awayScore != null
    )

    const totalMatches = matches.length
    const totalCompleted = completed.length

    let homeWins = 0, draws = 0, awayWins = 0
    let totalGoals = 0

    completed.forEach(m => {
      const h = Number(m.homeScore)
      const a = Number(m.awayScore)
      totalGoals += h + a
      if (h > a) homeWins++
      else if (h === a) draws++
      else awayWins++
    })

    const avgGoals = totalCompleted > 0 ? (totalGoals / totalCompleted).toFixed(2) : '0.00'

    // Prediction accuracy
    const predicted = matches.filter(m =>
      m.myPrediction && m.myPrediction !== '' &&
      m.homeScore !== '' && m.homeScore != null &&
      m.awayScore !== '' && m.awayScore != null
    )
    let correctPredictions = 0
    predicted.forEach(m => {
      const h = Number(m.homeScore)
      const a = Number(m.awayScore)
      const actual = h > a ? 'home' : h === a ? 'draw' : 'away'
      if (actual === m.myPrediction) correctPredictions++
    })
    const predictionAccuracy = predicted.length > 0
      ? Math.round((correctPredictions / predicted.length) * 100)
      : null

    // By competition
    const byCompetition = {}
    matches.forEach(m => {
      const comp = m.competition || 'other'
      if (!byCompetition[comp]) byCompetition[comp] = 0
      byCompetition[comp]++
    })

    // Recent matches (last 5 sorted by date desc)
    const sorted = [...matches].sort((a, b) => {
      const da = a.date ? parseISO(a.date) : new Date(0)
      const db2 = b.date ? parseISO(b.date) : new Date(0)
      return db2 - da
    })
    const recentMatches = sorted.slice(0, 5)

    // Last 10 form
    const last10 = sorted.slice(0, 10)
    const last10Form = last10.map(m => {
      if (m.homeScore == null || m.homeScore === '' || m.awayScore == null || m.awayScore === '') return null
      const h = Number(m.homeScore)
      const a = Number(m.awayScore)
      return h > a ? 'H' : h === a ? 'D' : 'A'
    }).filter(Boolean)

    return {
      totalMatches,
      totalCompleted,
      homeWins,
      draws,
      awayWins,
      avgGoals,
      totalGoals,
      predictionAccuracy,
      correctPredictions,
      totalPredicted: predicted.length,
      byCompetition,
      recentMatches,
      last10Form,
    }
  }, [matches])

  return {
    matches,
    matchesLoading,
    addMatch,
    updateMatch,
    removeMatch,
    teams,
    teamsLoading,
    addTeam,
    updateTeam,
    removeTeam,
    stats,
  }
}
