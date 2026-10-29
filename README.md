# Score Shots

Image host for Guitar Hero score screenshots. Upload a screenshot and get a direct image link for ScoreHero.

## Stack

- Zig: `src/inspect.zig` compiles to WebAssembly. It checks the file signature and reads the image size (PNG, JPEG, GIF, WebP).
- Vercel Functions: `api/upload.js` runs the Zig module, then stores the image in Vercel Blob.
- Static frontend: `public/index.html`.

## Environment

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token. The Blob store connection adds it.
- `UPLOAD_KEY`: key that the site asks for before upload or delete.

## Build

```bash
./scripts/build.sh
```

The script runs the Zig tests and writes `lib/inspect.wasm`. It downloads Zig when Zig is not installed.
