#!/usr/bin/env node
/**
 * 이모지 금지 검사. 사람이 기억하는 대신 기계가 잡는다(harness 5장).
 *
 * 대상
 *   app/**\/*.ts, *.tsx  - UI 이모지 금지. 아이콘은 shared/ui/Icon.tsx 의 SVG (expo-app-conventions 8장)
 *   docs/**\/*.md, 루트 *.md - 산출물 이모지 금지 (deliverable-write 30행)
 *
 * 스테이지된 파일만 본다. 통과 못 하면 종료 코드 1.
 */
const fs = require('fs');

const EMOJI = /\p{Extended_Pictographic}/u;
const TARGET = (f) =>
  (f.startsWith('app/') && (f.endsWith('.ts') || f.endsWith('.tsx'))) ||
  (f.endsWith('.md') && !f.startsWith('.claude/'));

let failed = false;
for (const file of process.argv.slice(2).filter(TARGET)) {
  if (!fs.existsSync(file)) continue;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (!EMOJI.test(line)) return;
      if (!failed) console.error('\n이모지가 남아 있다. 아이콘은 SVG로, 문서는 말로 적는다.\n');
      failed = true;
      console.error('  ' + file + ':' + (i + 1) + '  ' + line.trim().slice(0, 100));
    });
}

if (failed) {
  console.error('\n  UI 아이콘: app/src/shared/ui/Icon.tsx 에 추가해서 <Icon name="..." /> 로 쓴다');
  console.error('  문서 강조: > [!IMPORTANT] / > [!WARNING] 같은 Markdown 구조로\n');
  process.exit(1);
}
