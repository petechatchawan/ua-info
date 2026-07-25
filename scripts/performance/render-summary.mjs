function fixed(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function bytes(value) {
  return `${Math.round(value)} B (${fixed(value / 1024)} KiB)`;
}

function percentageDelta(current, previous) {
  if (!Number.isFinite(previous) || previous === 0) return 'n/a';
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? '+' : ''}${fixed(delta)}%`;
}

function byId(items, id) {
  return items?.find((item) => item.id === id) ?? null;
}

function baselineValue(baseline, path, id, key) {
  if (!baseline) return null;
  const collection = path.reduce((value, segment) => value?.[segment], baseline);
  return byId(collection, id)?.[key] ?? null;
}

export function renderSummary(report, baseline = null) {
  const lines = [
    '# ua-info Performance & Bundle Size',
    '',
    `- Policy: **${report.policy}**`,
    `- Package: \`${report.package.name}@${report.package.version}\``,
    `- Runtime: Node.js ${report.environment.node} on ${report.environment.platform}/${report.environment.arch}`,
    `- Commit: \`${report.environment.commit ?? 'unavailable'}\``,
    `- Generated: ${report.generatedAt}`,
    '',
    '> Metric movement is informational in this foundation phase. Harness or schema failures remain blocking.',
    '',
    '## Package',
    '',
    '| Metric | Value | Baseline delta |',
    '| --- | ---: | ---: |',
    `| Tarball | ${bytes(report.sizes.package.tarballBytes)} | ${percentageDelta(report.sizes.package.tarballBytes, baseline?.sizes?.package?.tarballBytes)} |`,
    `| Unpacked | ${bytes(report.sizes.package.unpackedBytes)} | ${percentageDelta(report.sizes.package.unpackedBytes, baseline?.sizes?.package?.unpackedBytes)} |`,
    `| Files | ${report.sizes.package.fileCount} | ${percentageDelta(report.sizes.package.fileCount, baseline?.sizes?.package?.fileCount)} |`,
    '',
    '## Distribution output',
    '',
    '| Build | Raw bytes | Files | Baseline delta |',
    '| --- | ---: | ---: | ---: |',
  ];

  for (const item of report.sizes.distributions) {
    lines.push(
      `| ${item.id} | ${bytes(item.rawBytes)} | ${item.fileCount} | ${percentageDelta(item.rawBytes, baselineValue(baseline, ['sizes', 'distributions'], item.id, 'rawBytes'))} |`,
    );
  }

  lines.push(
    '',
    '## Consumer bundles',
    '',
    '| Scenario | Platform | Raw | Gzip | Brotli | Raw delta |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  );
  for (const item of report.sizes.bundles) {
    lines.push(
      `| ${item.id} | ${item.platform} | ${bytes(item.rawBytes)} | ${bytes(item.gzipBytes)} | ${bytes(item.brotliBytes)} | ${percentageDelta(item.rawBytes, baselineValue(baseline, ['sizes', 'bundles'], item.id, 'rawBytes'))} |`,
    );
  }

  lines.push(
    '',
    '## Cold imports',
    '',
    '| Scenario | Median ms | p95 ms | Min ms | Max ms | Median delta |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  );
  for (const item of report.runtime.coldImports) {
    lines.push(
      `| ${item.id} | ${fixed(item.medianMilliseconds, 3)} | ${fixed(item.p95Milliseconds, 3)} | ${fixed(item.minimumMilliseconds, 3)} | ${fixed(item.maximumMilliseconds, 3)} | ${percentageDelta(item.medianMilliseconds, baselineValue(baseline, ['runtime', 'coldImports'], item.id, 'medianMilliseconds'))} |`,
    );
  }

  lines.push(
    '',
    '## Parse throughput',
    '',
    '| Scenario | Median ops/s | p95 ns/op | Samples | Throughput delta |',
    '| --- | ---: | ---: | ---: | ---: |',
  );
  for (const item of report.runtime.parseThroughput) {
    lines.push(
      `| ${item.id} | ${fixed(item.medianOperationsPerSecond)} | ${fixed(item.p95NanosecondsPerOperation)} | ${item.sampleCount} | ${percentageDelta(item.medianOperationsPerSecond, baselineValue(baseline, ['runtime', 'parseThroughput'], item.id, 'medianOperationsPerSecond'))} |`,
    );
  }

  lines.push('', `esbuild ${report.environment.esbuild}; npm ${report.environment.npm}.`, '');
  return lines.join('\n');
}
