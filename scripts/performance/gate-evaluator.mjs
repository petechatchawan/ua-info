import { validateGatePolicy } from './gate-policy.mjs';
import { validateReport } from './report-schema.mjs';

function wrapValidation(prefix, value) {
  try {
    return validateReport(value);
  } catch (error) {
    throw new Error(`${prefix}: ${error.message}`, { cause: error });
  }
}

function byId(items, id, label) {
  const value = items.find((item) => item.id === id);
  if (!value) throw new Error(`PERF_GATE_BASELINE_INVALID: Missing ${label} scenario ${id}.`);
  return value;
}

function deltaPercent(current, baseline) {
  if (baseline === 0) return current === 0 ? 0 : Number.POSITIVE_INFINITY;
  return ((current - baseline) / baseline) * 100;
}

function finding({ code, path, current, baseline, delta, message }) {
  return { code, path, current, baseline, delta, message };
}

function compareMaximum({ path, current, baseline, comparisons, violations }) {
  const delta = current - baseline;
  comparisons.push({
    path,
    kind: 'blocking-maximum',
    current,
    baseline,
    delta,
    status: delta > 0 ? 'fail' : 'pass',
  });
  if (delta > 0) {
    violations.push(finding({
      code: 'PERF_GATE_STATIC_BUDGET_EXCEEDED',
      path,
      current,
      baseline,
      delta,
      message: `${path} is ${delta} above the reviewed maximum.`,
    }));
  }
}

function compareGrowthWarning({ code, path, current, baseline, comparisons, warnings }) {
  const delta = current - baseline;
  comparisons.push({
    path,
    kind: 'advisory-growth',
    current,
    baseline,
    delta,
    status: delta > 0 ? 'warn' : 'pass',
  });
  if (delta > 0) {
    warnings.push(finding({
      code,
      path,
      current,
      baseline,
      delta,
      message: `${path} increased by ${delta}; this metric is advisory.`,
    }));
  }
}

function compareSlowdownWarning({ path, current, baseline, thresholdPercent, comparisons, warnings }) {
  if (baseline <= 0) {
    throw new Error(`PERF_GATE_BASELINE_INVALID: ${path} baseline must be greater than zero.`);
  }
  const slowdownPercent = deltaPercent(current, baseline);
  comparisons.push({
    path,
    kind: 'advisory-cold-import',
    current,
    baseline,
    delta: current - baseline,
    deltaPercent: slowdownPercent,
    thresholdPercent,
    status: slowdownPercent > thresholdPercent ? 'warn' : 'pass',
  });
  if (slowdownPercent > thresholdPercent) {
    warnings.push(finding({
      code: 'PERF_GATE_COLD_IMPORT_SLOWDOWN',
      path,
      current,
      baseline,
      delta: current - baseline,
      message: `${path} slowed by ${slowdownPercent.toFixed(2)}%, above the ${thresholdPercent}% advisory threshold.`,
    }));
  }
}

function compareThroughputWarning({ path, current, baseline, thresholdPercent, comparisons, warnings }) {
  if (baseline <= 0) {
    throw new Error(`PERF_GATE_BASELINE_INVALID: ${path} baseline must be greater than zero.`);
  }
  const dropPercent = ((baseline - current) / baseline) * 100;
  comparisons.push({
    path,
    kind: 'advisory-throughput',
    current,
    baseline,
    delta: current - baseline,
    deltaPercent: -dropPercent,
    thresholdPercent,
    status: dropPercent > thresholdPercent ? 'warn' : 'pass',
  });
  if (dropPercent > thresholdPercent) {
    warnings.push(finding({
      code: 'PERF_GATE_THROUGHPUT_DROP',
      path,
      current,
      baseline,
      delta: current - baseline,
      message: `${path} dropped by ${dropPercent.toFixed(2)}%, above the ${thresholdPercent}% advisory threshold.`,
    }));
  }
}

function assertCompatibleIdentity(report, baseline, policy) {
  if (
    report.package.name !== baseline.package.name ||
    report.package.version !== baseline.package.version
  ) {
    throw new Error(
      `PERF_GATE_REPORT_INVALID: Current package ${report.package.name}@${report.package.version} must match baseline ${baseline.package.name}@${baseline.package.version}.`,
    );
  }
  for (const [label, value] of [
    ['current', report.environment.esbuild],
    ['baseline', baseline.environment.esbuild],
  ]) {
    if (value !== policy.requiredEsbuild) {
      throw new Error(
        `PERF_GATE_TOOLCHAIN_MISMATCH: ${label} esbuild ${value} must equal ${policy.requiredEsbuild}.`,
      );
    }
  }
}

export function evaluatePerformanceGate({ report, baseline, policy }) {
  wrapValidation('PERF_GATE_REPORT_INVALID', report);
  wrapValidation('PERF_GATE_BASELINE_INVALID', baseline);
  validateGatePolicy(policy);
  assertCompatibleIdentity(report, baseline, policy);

  const comparisons = [];
  const blockingViolations = [];
  const warnings = [];

  for (const metric of policy.blocking.package) {
    compareMaximum({
      path: `sizes.package.${metric}`,
      current: report.sizes.package[metric],
      baseline: baseline.sizes.package[metric],
      comparisons,
      violations: blockingViolations,
    });
  }

  for (const reportItem of report.sizes.distributions) {
    const baselineItem = byId(baseline.sizes.distributions, reportItem.id, 'distribution');
    for (const metric of policy.blocking.distributions) {
      compareMaximum({
        path: `sizes.distributions.${reportItem.id}.${metric}`,
        current: reportItem[metric],
        baseline: baselineItem[metric],
        comparisons,
        violations: blockingViolations,
      });
    }
  }

  for (const reportItem of report.sizes.bundles) {
    const baselineItem = byId(baseline.sizes.bundles, reportItem.id, 'bundle');
    for (const metric of policy.blocking.bundles) {
      compareMaximum({
        path: `sizes.bundles.${reportItem.id}.${metric}`,
        current: reportItem[metric],
        baseline: baselineItem[metric],
        comparisons,
        violations: blockingViolations,
      });
    }
  }

  for (const metric of policy.advisory.package) {
    compareGrowthWarning({
      code: 'PERF_GATE_TARBALL_GROWTH',
      path: `sizes.package.${metric}`,
      current: report.sizes.package[metric],
      baseline: baseline.sizes.package[metric],
      comparisons,
      warnings,
    });
  }

  for (const reportItem of report.sizes.bundles) {
    const baselineItem = byId(baseline.sizes.bundles, reportItem.id, 'bundle');
    for (const metric of policy.advisory.bundles) {
      compareGrowthWarning({
        code: 'PERF_GATE_COMPRESSED_GROWTH',
        path: `sizes.bundles.${reportItem.id}.${metric}`,
        current: reportItem[metric],
        baseline: baselineItem[metric],
        comparisons,
        warnings,
      });
    }
  }

  for (const reportItem of report.runtime.coldImports) {
    const baselineItem = byId(baseline.runtime.coldImports, reportItem.id, 'cold import');
    compareSlowdownWarning({
      path: `runtime.coldImports.${reportItem.id}.medianMilliseconds`,
      current: reportItem.medianMilliseconds,
      baseline: baselineItem.medianMilliseconds,
      thresholdPercent: policy.advisory.coldImportSlowdownPercent,
      comparisons,
      warnings,
    });
  }

  for (const reportItem of report.runtime.parseThroughput) {
    const baselineItem = byId(baseline.runtime.parseThroughput, reportItem.id, 'throughput');
    compareThroughputWarning({
      path: `runtime.parseThroughput.${reportItem.id}.medianOperationsPerSecond`,
      current: reportItem.medianOperationsPerSecond,
      baseline: baselineItem.medianOperationsPerSecond,
      thresholdPercent: policy.advisory.parseThroughputDropPercent,
      comparisons,
      warnings,
    });
  }

  return {
    schemaVersion: 1,
    mode: 'static-hard-gate',
    status: blockingViolations.length === 0 ? 'pass' : 'fail',
    blockingViolations,
    warnings,
    comparisons,
  };
}
