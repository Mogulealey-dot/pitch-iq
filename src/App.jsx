import { useState } from 'react'
import Layout from './components/layout/Layout'
import { useMatches } from './hooks/useMatches'
import { useFirestore } from './hooks/useFirestore'
import DashboardPage from './pages/DashboardPage'
import MatchesPage from './pages/MatchesPage'
import TeamsPage from './pages/TeamsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PredictionsPage from './pages/PredictionsPage'
import SettingsPage from './pages/SettingsPage'

export default function App({ user, logOut }) {
  const [activePage, setActivePage] = useState('dashboard')
  const uid = user?.uid

  const {
    matches, matchesLoading, addMatch, updateMatch, removeMatch,
    teams, teamsLoading, addTeam, updateTeam, removeTeam,
    stats,
  } = useMatches(uid)

  const { data: settingsArr, add: addSettings, update: updateSettingsDoc } = useFirestore(uid, 'settings')
  const settings = settingsArr[0] || {}
  const updateSettings = async (data) => {
    if (settingsArr[0]) await updateSettingsDoc(settingsArr[0].id, data)
    else await addSettings(data)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} matches={matches} stats={stats} loading={matchesLoading} onNavigate={setActivePage} />
      case 'matches':
        return <MatchesPage uid={uid} matches={matches} addMatch={addMatch} updateMatch={updateMatch} removeMatch={removeMatch} loading={matchesLoading} />
      case 'teams':
        return <TeamsPage teams={teams} matches={matches} addTeam={addTeam} updateTeam={updateTeam} removeTeam={removeTeam} loading={teamsLoading} />
      case 'analytics':
        return <AnalyticsPage matches={matches} teams={teams} loading={matchesLoading} />
      case 'predictions':
        return <PredictionsPage matches={matches} loading={matchesLoading} />
      case 'settings':
        return <SettingsPage user={user} matches={matches} settings={settings} updateSettings={updateSettings} logOut={logOut} removeMatch={removeMatch} />
      default:
        return <DashboardPage user={user} matches={matches} stats={stats} loading={matchesLoading} onNavigate={setActivePage} />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} user={user}>
      {renderPage()}
    </Layout>
  )
}
