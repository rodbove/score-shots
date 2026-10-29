import { randomBytes } from 'node:crypto';
import { inspectImage } from '../lib/inspect.js';
import { authorized, publicUrl, putObject } from '../lib/storage.js';

export async function POST(request) {
  if (!authorized(request)) return Response.json({ error: 'Invalid upload key' }, { status: 401 });

  const bytes = new Uint8Array(await request.arrayBuffer());
  const image = inspectImage(bytes);
  if (!image) return Response.json({ error: 'Not a PNG, JPEG, GIF or WebP image' }, { status: 415 });

  const name = `${randomBytes(6).toString('base64url')}.${image.ext}`;
  await putObject(name, bytes, image.mime);

  return Response.json({ name, url: publicUrl(request, name), width: image.width, height: image.height });
}
