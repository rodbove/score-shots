import { authorized, listObjects, publicUrl, removeObject } from '../lib/storage.js';

export async function GET(request) {
  const objects = await listObjects();
  return Response.json(objects.map((o) => ({ ...o, url: publicUrl(request, o.name) })));
}

export async function DELETE(request) {
  if (!authorized(request)) return Response.json({ error: 'Invalid upload key' }, { status: 401 });
  const name = new URL(request.url).searchParams.get('name') ?? '';
  if (!/^[\w-]+\.(png|jpg|gif|webp)$/.test(name)) return Response.json({ error: 'Bad name' }, { status: 400 });
  await removeObject(name);
  return new Response(null, { status: 204 });
}
