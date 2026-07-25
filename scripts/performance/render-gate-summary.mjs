function fixed(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : fixed(value, 3);
}

function signed(value) {
  return `${value >= 0 ? '+' : ''}${formatNumber(value)}`;
}

function renderFinding(item) {
  return `- **${item.code}** \`${item.path}\`: current ${formatNumber(item.current)}, baseline ${formatNumber(item.baseline)}, delta ${signed(item.delta)} — ${item.message}`;
}

export function renderGateSummary({ result, report, baseline, policy, baselinePath }) {
  const lines = [
    `# ua-info Performance Gate: ${result.status.toUpperCase()}`,
    '',
    `- Mode: **${result.mode}**`,
    `- Package: \`${report.package.name}@${report.package.version}\``,
    `- Baseline: \`${baselinePath}\``,
    `- Required esbuild: \`${policy.requiredEsbuild}\``,
    `- Commit: \`${report.environment.commit ?? 'unavailable'}\``,
    '',
    result.status === 'pass'
      ? '> Deterministic static budgets passed. Advisory warnings do not fail this gate.'
      : '> One or more deterministic static budgets were exceeded.',
    '',
    '## Blocking comparisons',
    '',
    '| Metric | Current | Maximum | Delta | Result |',
    '| --- | ---: | ---: | ---: | --- |',
  ];

  for (const item of result.comparisons.filter((entry) => entry.kind === 'blocking-maximum')) {
    lines.push(
      `| \`${item.path}\` | ${formatNumber(item.current)} | ${formatNumber(item.baseline)} | ${signed(item.delta)} | ${item.status.toUpperCase()} |`,
    );
  }

  lines.push('', '## Advisory comparisons', '');
  const advisory = result.comparisons.filter((entry) => entry.kind !== 'blocking-maximum');
  if (advisory.length === 0) {
    lines.push('No advisory comparisons were produced.');
  } else {
    lines.push('| Metric | Current | Baseline | Delta | Result |', '| --- | ---: | ---: | ---: | --- |');
    for (const item of advisory) {
      lines.push(
        `| \`${item.path}\` | ${formatNumber(item.current)} | ${formatNumber(item.baseline)} | ${signed(item.delta)} | ${item.status.toUpperCase()} |`,
      );
    }
  }

  lines.push('', '## Blocking violations', '');
  if (result.blockingViolations.length === 0) {
    lines.push('None.');
  } else {
    lines.push(...result.blockingViolations.map(renderFinding));
  }

  lines.push('', '## Warnings', '');
  if (result.warnings.length === 0) {
    lines.push('None.');
  } else {
    lines.push(...result.warnings.map(renderFinding));
  }

  if (result.status === 'fail') {
    lines.push(
      '',
      '## Baseline update protocol',
      '',
      'Do not edit the baseline only to silence this failure. A legitimate increase requires implementation justification, two exact-head Node.js 22 reports with matching static metrics, and updated run/job/artifact provenance in the reviewed baseline.',
    );
  }

  const source = baseline.baselineSource;
  if (source) {
    lines.push(
      '',
      '## Baseline provenance',
      '',
      `- Source head: \`${source.commit}\``,
      `- Run: \`${source.runId}\``,
      `- Job: \`${source.jobId ?? 'unavailable'}\``,
      `- Artifact: \`${source.artifactId ?? 'unavailable'}\``,
      `- Runner: ${source.runner}`,
    );
  }

  lines.push('');
  return lines.join('\n');
}
