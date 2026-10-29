import { readFileSync } from 'node:fs';

const FORMATS = [null, 'png', 'jpeg', 'gif', 'webp'];
const MIME = { png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

const wasm = readFileSync(new URL('./inspect.wasm', import.meta.url));
const { instance } = await WebAssembly.instantiate(wasm);
const zig = instance.exports;

export function inspectImage(bytes) {
  if (bytes.length > zig.inputCap()) return null;
  new Uint8Array(zig.memory.buffer, zig.inputPtr(), bytes.length).set(bytes);
  const format = FORMATS[zig.inspect(bytes.length)];
  if (!format) return null;
  return {
    format,
    ext: format === 'jpeg' ? 'jpg' : format,
    mime: MIME[format],
    width: zig.imageWidth(),
    height: zig.imageHeight(),
  };
}
