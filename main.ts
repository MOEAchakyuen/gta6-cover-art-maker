// Vice Cover Maker — the hand-in program for gta6-cover-art-01 (Node 22,
// standard library only). It copies the app/ folder and the screenshots/
// folder from beside this file into the output directory (MAKEFUN_OUTPUT_DIR
// outside the grader, /output inside it) and writes output/dossier.json,
// the summary the judge reads, using the vendored make.fun library.
//
// Run it twice to check determinism:
//   mkdir -p /tmp/out1 /tmp/out2 && MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts && MAKEFUN_OUTPUT_DIR=/tmp/out2 node main.ts
//   diff -r /tmp/out1 /tmp/out2
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's caps: text_max_bytes shapes the dossier text; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots, one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files in all, or a
// path under app/ over 1000 bytes). app/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
