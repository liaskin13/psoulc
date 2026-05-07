import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const effectGuardPattern = /useEffect\(\(\) => \{\s*if \(isMobile && \(stage === "console" \|\| stage === "architect"\)\) \{\s*setStage\("room"\);\s*\}\s*\}, \[isMobile, stage\]\);/m;
assert.match(
  appSource,
  effectGuardPattern,
  'Mobile stage redirect must remain inside useEffect([isMobile, stage]).'
);

const renderGuardPattern = /\/\/ ── CONSOLE MOBILE GUARD[\s\S]*?if \(isMobile && \(stage === "console" \|\| stage === "architect"\)\) \{([\s\S]*?)\n  \}/m;
const renderGuardMatch = appSource.match(renderGuardPattern);
assert.ok(renderGuardMatch, 'Render-time mobile guard block must exist.');
assert.ok(
  !/setStage\(/.test(renderGuardMatch[1]),
  'Render-time mobile guard must not mutate stage state.'
);

console.log('mobile route guard smoke: PASS');
