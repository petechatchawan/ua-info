import path from 'node:path';

const DOMAINS = Object.freeze(['browser', 'os', 'device']);
const CLASSIFICATIONS = Object.freeze(['exact', 'semantic-equivalent', 'partial', 'unsupported']);
const COUNT_KEY = Object.freeze({ exact: 'exact', 'semantic-equivalent': 'semanticEquivalent', partial: 'partial', unsupported: 'unsupported' });
const GAP_SEVERITY = Object.freeze({ unsupported: 0, partial: 1, 'semantic-equivalent': 2 });
const FORBIDDEN_KEYS = new Set(['ua', 'useragent', 'expect', 'description', 'sourcedir']);

function counts() { return { total: 0, exact: 0, semanticEquivalent: 0, partial: 0, unsupported: 0 }; }
function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`CONFORMANCE_REPORT_INVALID: ${label} must be an object.`);
  const actual = Object.keys(value).sort(); const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new Error(`CONFORMANCE_REPORT_INVALID: ${label} has unknown or missing keys.`);
}
function validCount(value, label) { if (!Number.isInteger(value) || value < 0) throw new Error(`CONFORMANCE_REPORT_INVALID: ${label} must be a non-negative integer.`); }
function validLocator(value) { return typeof value === 'string' && !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes('..') && /^[^#]+#\d+$/.test(value); }
function validateCounts(value, label) {
  exactKeys(value, ['total', 'exact', 'semanticEquivalent', 'partial', 'unsupported'], label);
  for (const key of Object.keys(value)) validCount(value[key], `${label}.${key}`);
  if (value.total !== value.exact + value.semanticEquivalent + value.partial + value.unsupported) throw new Error(`CONFORMANCE_REPORT_INVALID: ${label} totals do not reconcile.`);
}

export function assertPrivacySafeOutput(value, forbiddenSentinels = []) {
  const visit = (current) => {
    if (typeof current === 'string') {
      if (path.isAbsolute(current) || /^[A-Za-z]:[\\/]/.test(current)) throw new Error('CONFORMANCE_PRIVACY_VIOLATION: absolute path detected.');
      for (const sentinel of forbiddenSentinels) if (typeof sentinel === 'string' && sentinel.length > 0 && current.includes(sentinel)) throw new Error('CONFORMANCE_PRIVACY_VIOLATION: forbidden sentinel detected.');
      return;
    }
    if (Array.isArray(current)) { for (const item of current) visit(item); return; }
    if (!current || typeof current !== 'object') return;
    for (const [key, child] of Object.entries(current)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) throw new Error(`CONFORMANCE_PRIVACY_VIOLATION: forbidden key ${key}.`);
      visit(child);
    }
  };
  visit(value); return value;
}

export function validateExternalConformanceReport(report) {
  exactKeys(report, ['schemaVersion', 'profile', 'generatedAt', 'sourceRevision', 'package', 'domains', 'totals', 'gapGroups'], 'report');
  if (report.schemaVersion !== 1 || report.profile !== 'ua-parser-js') throw new Error('CONFORMANCE_REPORT_INVALID: unsupported schema or profile.');
  if (typeof report.generatedAt !== 'string' || Number.isNaN(Date.parse(report.generatedAt))) throw new Error('CONFORMANCE_REPORT_INVALID: generatedAt must be an ISO date.');
  if (report.sourceRevision !== null && typeof report.sourceRevision !== 'string') throw new Error('CONFORMANCE_REPORT_INVALID: sourceRevision must be a string or null.');
  exactKeys(report.package, ['name', 'version', 'commit'], 'package');
  if (report.package.name !== 'ua-info' || typeof report.package.version !== 'string' || (report.package.commit !== null && typeof report.package.commit !== 'string')) throw new Error('CONFORMANCE_REPORT_INVALID: invalid package metadata.');
  exactKeys(report.domains, DOMAINS, 'domains');
  for (const domain of DOMAINS) validateCounts(report.domains[domain], `domains.${domain}`);
  validateCounts(report.totals, 'totals');
  for (const key of ['total', 'exact', 'semanticEquivalent', 'partial', 'unsupported']) {
    const sum = DOMAINS.reduce((total, domain) => total + report.domains[domain][key], 0);
    if (report.totals[key] !== sum) throw new Error(`CONFORMANCE_REPORT_INVALID: totals.${key} does not reconcile.`);
  }
  if (!Array.isArray(report.gapGroups)) throw new Error('CONFORMANCE_REPORT_INVALID: gapGroups must be an array.');
  for (const [index, group] of report.gapGroups.entries()) {
    exactKeys(group, ['domain', 'classification', 'expectedIdentity', 'count', 'locators'], `gapGroups[${index}]`);
    if (!DOMAINS.includes(group.domain) || !['semantic-equivalent', 'partial', 'unsupported'].includes(group.classification)) throw new Error('CONFORMANCE_REPORT_INVALID: invalid gap group domain or classification.');
    if (typeof group.expectedIdentity !== 'string' || group.expectedIdentity.length === 0 || group.expectedIdentity.length > 120) throw new Error('CONFORMANCE_REPORT_INVALID: invalid expected identity.');
    validCount(group.count, 'gap group count');
    if (group.count === 0 || !Array.isArray(group.locators) || group.locators.length > 5 || group.locators.some((locator) => !validLocator(locator))) throw new Error('CONFORMANCE_REPORT_INVALID: invalid gap group locators.');
  }
  assertPrivacySafeOutput(report); return report;
}

export function createExternalConformanceReport({ generatedAt, sourceRevision, packageInfo, observations }) {
  const domains = { browser: counts(), os: counts(), device: counts() }; const totals = counts(); const groups = new Map();
  for (const observation of observations) {
    if (!DOMAINS.includes(observation.domain) || !CLASSIFICATIONS.includes(observation.classification)) throw new Error('CONFORMANCE_REPORT_INVALID: invalid observation.');
    const key = COUNT_KEY[observation.classification]; domains[observation.domain].total += 1; domains[observation.domain][key] += 1; totals.total += 1; totals[key] += 1;
    if (observation.classification === 'exact') continue;
    const groupKey = `${observation.domain}\0${observation.classification}\0${observation.expectedIdentity}`;
    const group = groups.get(groupKey) || { domain: observation.domain, classification: observation.classification, expectedIdentity: observation.expectedIdentity, count: 0, locators: [] };
    group.count += 1; group.locators.push(observation.locator); groups.set(groupKey, group);
  }
  const gapGroups = [...groups.values()].map((group) => ({ ...group, locators: [...new Set(group.locators)].sort().slice(0, 5) })).sort((left, right) => DOMAINS.indexOf(left.domain) - DOMAINS.indexOf(right.domain) || GAP_SEVERITY[left.classification] - GAP_SEVERITY[right.classification] || right.count - left.count || left.expectedIdentity.localeCompare(right.expectedIdentity, 'en'));
  const report = { schemaVersion: 1, profile: 'ua-parser-js', generatedAt, sourceRevision, package: { name: packageInfo.name, version: packageInfo.version, commit: packageInfo.commit ?? null }, domains, totals, gapGroups };
  validateExternalConformanceReport(report); return report;
}
