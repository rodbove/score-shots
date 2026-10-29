export const GAMES = [
  'Guitar Hero',
  'Guitar Hero II',
  'Guitar Hero Encore: Rocks the 80s',
  'Guitar Hero III: Legends of Rock',
  'Guitar Hero: Aerosmith',
  'Guitar Hero World Tour',
  'Guitar Hero: Metallica',
  'Guitar Hero Smash Hits',
  'Guitar Hero 5',
  'Band Hero',
  'Guitar Hero: Van Halen',
  'Guitar Hero: Warriors of Rock',
  'Guitar Hero Live',
  'Guitar Hero On Tour',
  'Other',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

export function parseMeta(params) {
  const game = params.get('game') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const song = (params.get('song') ?? '').trim().slice(0, 120);
  if (!GAMES.includes(game)) return { error: 'Pick a game' };
  if (!DIFFICULTIES.includes(difficulty)) return { error: 'Pick a difficulty' };
  if (!song) return { error: 'Enter a song' };
  return { meta: { game, song, difficulty } };
}
