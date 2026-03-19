import { useState } from 'react'
import Layout from './components/layout/Layout'
import { useMatches } from './hooks/useMatches'
import { useFirestore } from './hooks/useFirestore'
import { useToast } from './hooks/useToast'
import Toast from './components/common/Toast'
import DashboardPage from './pages/DashboardPage'
import MatchesPage from './pages/MatchesPage'
import TeamsPage from './pages/TeamsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PredictionsPage from './pages/PredictionsPage'
import SettingsPage from './pages/SettingsPage'
import LivePage from './pages/LivePage'

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

  const { toasts, show: showToast, remove: removeToast } = useToast()

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} matches={matches} stats={stats} loading={matchesLoading} onNavigate={setActivePage} />
      case 'matches':
        return <MatchesPage uid={uid} matches={matches} addMatch={addMatch} updateMatch={updateMatch} removeMatch={removeMatch} loading={matchesLoading} showToast={showToast} />
      case 'live':
        return <LivePage uid={uid} matches={matches} addMatch={addMatch} showToast={showToast} />
      case 'teams':
        return <TeamsPage teams={teams} matches={matches} addTeam={addTeam} updateTeam={updateTeam} removeTeam={removeTeam} loading={teamsLoading} showToast={showToast} />
      case 'analytics':
        return <AnalyticsPage matches={matches} teams={teams} loading={matchesLoading} />
      case 'predictions':
        return <PredictionsPage matches={matches} loading={matchesLoading} />
      case 'settings':
        return <SettingsPage user={user} matches={matches} settings={settings} updateSettings={updateSettings} logOut={logOut} removeMatch={removeMatch} showToast={showToast} />
      default:
        return <DashboardPage user={user} matches={matches} stats={stats} loading={matchesLoading} onNavigate={setActivePage} />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} user={user}>
      {renderPage()}
      <Toast toasts={toasts} remove={removeToast} />
    </Layout>
  )
}
