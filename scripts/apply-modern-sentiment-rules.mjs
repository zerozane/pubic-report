import fs from 'node:fs';
import path from 'node:path';
import { classifyModernSentiment } from './sentiment-rules.mjs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/apply-modern-sentiment-rules.mjs <report.json> [...]');
  process.exit(1);
}

for (const input of files) {
  const file = path.resolve(process.cwd(), input);
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;
  for (const item of report.evidence || []) {
    if (item.recordType !== 'comment') continue;
    const next = classifyModernSentiment(item.text);
    if (!next || next === item.sentiment) continue;
    item.sentiment = next;
    changed += 1;
  }
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`${path.relative(process.cwd(), file)}\tchanged=${changed}`);
}
