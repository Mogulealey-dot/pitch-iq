export const COMPETITIONS = [
  { id: 'premier-league',  label: 'Premier League',  emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#3d0066' },
  { id: 'la-liga',         label: 'La Liga',          emoji: '🇪🇸', color: '#c8102e' },
  { id: 'bundesliga',      label: 'Bundesliga',        emoji: '🇩🇪', color: '#d20515' },
  { id: 'serie-a',         label: 'Serie A',           emoji: '🇮🇹', color: '#024494' },
  { id: 'ligue-1',         label: 'Ligue 1',           emoji: '🇫🇷', color: '#003189' },
  { id: 'champions-league',label: 'Champions League',  emoji: '⭐', color: '#001f5a' },
  { id: 'europa-league',   label: 'Europa League',     emoji: '🟠', color: '#f05000' },
  { id: 'world-cup',       label: 'World Cup',         emoji: '🌍', color: '#4CAF50' },
  { id: 'euro',            label: 'Euros',             emoji: '🇪🇺', color: '#003399' },
  { id: 'fa-cup',          label: 'FA Cup',            emoji: '🏆', color: '#ffffff' },
  { id: 'copa-del-rey',    label: 'Copa del Rey',      emoji: '🥇', color: '#c8102e' },
  { id: 'other',           label: 'Other',             emoji: '⚽', color: '#334155' },
]

export function getCompetitionById(id) {
  return COMPETITIONS.find(c => c.id === id) || COMPETITIONS[COMPETITIONS.length - 1]
}
