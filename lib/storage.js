import { del, list, put } from '@vercel/blob';

export const PREFIX = 'gh-scores/';
export const META_PREFIX = 'gh-meta/';

export async function putObject(name, bytes, mime) {
  await put(PREFIX + name, Buffer.from(bytes), {
    access: 'public',
    contentType: mime,
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
  });
}

export async function putMeta(name, meta) {
  await put(`${META_PREFIX}${name}.json`, JSON.stringify(meta), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

async function listAll(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readMeta(blob) {
  try {
    const res = await fetch(blob.url);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

export async function listObjects() {
  const [images, metas] = await Promise.all([listAll(PREFIX), listAll(META_PREFIX)]);
  const metaByName = new Map(
    await Promise.all(metas.map(async (m) => [m.pathname.slice(META_PREFIX.length, -'.json'.length), await readMeta(m)])),
  );
  return images
    .map((b) => {
      const name = b.pathname.slice(PREFIX.length);
      return { name, size: b.size, createdAt: b.uploadedAt, ...metaByName.get(name) };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function removeObject(name) {
  const [images, metas] = await Promise.all([
    list({ prefix: PREFIX + name, limit: 1 }),
    list({ prefix: `${META_PREFIX}${name}.json`, limit: 1 }),
  ]);
  const urls = [...images.blobs, ...metas.blobs].map((b) => b.url);
  if (urls.length) await del(urls);
}

export function authorized(request) {
  const key = process.env.UPLOAD_KEY;
  return Boolean(key) && request.headers.get('x-upload-key') === key;
}

export function publicUrl(request, name) {
  return `${new URL(request.url).origin}/i/${name}`;
}
