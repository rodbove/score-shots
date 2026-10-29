import { DIFFICULTIES, GAMES } from '../lib/games.js';

export function GET() {
  return Response.json({ games: GAMES, difficulties: DIFFICULTIES });
}
