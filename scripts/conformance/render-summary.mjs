import { validateExternalConformanceReport } from './report-schema.mjs';

function percentage(count, total) {
  return total === 0 ? '0.00%' : `${((count / total) * 100).toFixed(2)}%`;
}

function cell(count, total) {
  return `${count} (${percentage(count, total)})`;
}

function escapeMarkdown(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/`/g, '\\`').replace(/\r?\n/g, ' ');
}

export function renderExternalConformanceSummary(report) {
  validateExternalConformanceReport(report);
  const rows = [
    ['Browser', report.domains.browser],
    ['OS', report.domains.os],
    ['Device', report.domains.device],
    ['Total', report.totals],
  ];
  const lines = [
    '# ua-info External Conformance Audit',
    '',
    `- Package: \`${escapeMarkdown(report.package.name)}@${escapeMarkdown(report.package.version)}\``,
    `- Package commit: \`${escapeMarkdown(report.package.commit ?? 'unknown')}\``,
    `- Source revision: \`${escapeMarkdown(report.sourceRevision ?? 'unknown')}\``,
    `- Generated at: \`${escapeMarkdown(report.generatedAt)}\``,
    '',
  ];
  if (report.sourceRevision?.includes('(dirty)')) lines.push('> **Warning:** The external checkout was dirty when this audit ran.', '');
  lines.push(
    'Interoperability observations are not implementation requirements.',
    '',
    '| Domain | Total | Exact | Semantic-equivalent | Partial | Unsupported |',
    '|---|---:|---:|---:|---:|---:|',
  );
  for (const [label, summary] of rows) {
    lines.push(`| ${label} | ${summary.total} | ${cell(summary.exact, summary.total)} | ${cell(summary.semanticEquivalent, summary.total)} | ${cell(summary.partial, summary.total)} | ${cell(summary.unsupported, summary.total)} |`);
  }
  lines.push('', '## Highest-frequency non-exact gap groups', '');
  const groups = [...report.gapGroups].sort((left, right) => right.count - left.count || left.domain.localeCompare(right.domain, 'en') || left.classification.localeCompare(right.classification, 'en') || left.expectedIdentity.localeCompare(right.expectedIdentity, 'en')).slice(0, 20);
  if (groups.length === 0) lines.push('No non-exact gap groups were observed.');
  else {
    lines.push('| Domain | Classification | Expected identity | Count | Locators |', '|---|---|---|---:|---|');
    for (const group of groups) {
      const locators = group.locators.map((locator) => `\`${escapeMarkdown(locator)}\``).join(', ');
      lines.push(`| ${escapeMarkdown(group.domain)} | ${escapeMarkdown(group.classification)} | ${escapeMarkdown(group.expectedIdentity)} | ${group.count} | ${locators} |`);
    }
  }
  return `${lines.join('\n')}\n`;
}
