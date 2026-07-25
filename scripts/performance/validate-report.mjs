import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson } from './lib.mjs';
import { validateReport } from './report-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);

export async function validateReportFile(filePath) {
  const report = await readJson(filePath);
  validateReport(report);
  return report;
}

if (process.argv[1] === modulePath) {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node validate-report.mjs <report.json>');
  const report = await validateReportFile(path.resolve(input));
  process.stdout.write(
    `Performance report verified: ${report.package.name}@${report.package.version}, schema ${report.schemaVersion}, ${report.policy}.\n`,
  );
}
