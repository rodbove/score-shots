import { del, list, put } from '@vercel/blob';

export const PREFIX = 'gh-scores/';

export async function putObject(name, bytes, mime) {
  await put(PREFIX + name, Buffer.from(bytes), {
    access: 'public',
    contentType: mime,
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
  });
}

export async function listObjects() {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs
    .map((b) => ({ name: b.pathname.slice(PREFIX.length), size: b.size, createdAt: b.uploadedAt }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function removeObject(name) {
  const { blobs } = await list({ prefix: PREFIX + name, limit: 1 });
  if (blobs[0]) await del(blobs[0].url);
}

export function authorized(request) {
  const key = process.env.UPLOAD_KEY;
  return Boolean(key) && request.headers.get('x-upload-key') === key;
}

export function publicUrl(request, name) {
  return `${new URL(request.url).origin}/i/${name}`;
}
