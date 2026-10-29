import { randomBytes } from 'node:crypto';
import { parseMeta } from '../lib/games.js';
import { inspectImage } from '../lib/inspect.js';
import { authorized, publicUrl, putMeta, putObject } from '../lib/storage.js';

export async function POST(request) {
  if (!authorized(request)) return Response.json({ error: 'Invalid upload key' }, { status: 401 });

  const { meta, error } = parseMeta(new URL(request.url).searchParams);
  if (error) return Response.json({ error }, { status: 400 });

  const bytes = new Uint8Array(await request.arrayBuffer());
  const image = inspectImage(bytes);
  if (!image) return Response.json({ error: 'Not a PNG, JPEG, GIF or WebP image' }, { status: 415 });

  const name = `${randomBytes(6).toString('base64url')}.${image.ext}`;
  await putObject(name, bytes, image.mime);
  await putMeta(name, meta);

  return Response.json({ name, url: publicUrl(request, name), width: image.width, height: image.height, ...meta });
}
