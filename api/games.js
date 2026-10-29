import { DIFFICULTIES, GAMES, SONGS } from '../lib/games.js';

export function GET() {
  const games = GAMES.map((name) => ({ name, disc: SONGS[name]?.disc ?? [], dlc: SONGS[name]?.dlc ?? [] }));
  return Response.json({ games, difficulties: DIFFICULTIES }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
