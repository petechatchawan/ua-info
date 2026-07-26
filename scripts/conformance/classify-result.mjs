const DEVICE_TYPE_ALIAS = Object.freeze({ smarttv: 'smart-tv' });

function asserted(value) {
  return value !== undefined && value !== null && value !== 'undefined';
}

export function normalizeIdentity(value) {
  if (!asserted(value)) return null;
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9.+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120) || null;
}

function normalizeVersion(value) {
  if (!asserted(value)) return null;
  return String(value).normalize('NFKC').trim().toLowerCase().replace(/_/g, '.').replace(/\s+/g, '');
}

function normalizeDeviceType(value) {
  const normalized = normalizeIdentity(value);
  return normalized === null ? null : (DEVICE_TYPE_ALIAS[normalized] || normalized);
}

function expectedIdentity(expected, domain) {
  const candidates = domain === 'device'
    ? [expected.type, expected.vendor, expected.model]
    : [expected.name, expected.version, expected.major, expected.type];
  return candidates.map(normalizeIdentity).filter(Boolean).join(' | ').slice(0, 120) || 'unasserted';
}

function result(status, expected, domain, matchedFields, mismatchedFields) {
  return Object.freeze({
    status,
    expectedIdentity: expectedIdentity(expected, domain),
    matchedFields: Object.freeze([...matchedFields].sort()),
    mismatchedFields: Object.freeze([...mismatchedFields].sort()),
  });
}

function compareField(field, expectedValue, actualValue, normalizer, matched, mismatched) {
  if (!asserted(expectedValue)) return;
  if (normalizer(expectedValue) === normalizer(actualValue)) matched.push(field);
  else mismatched.push(field);
}

function classifyBrowser(externalCase, actualResult) {
  const expected = externalCase.expected;
  const browser = actualResult?.browser ?? null;
  const host = actualResult?.context?.host ?? null;
  const expectedName = normalizeIdentity(expected.name);
  const expectedType = normalizeIdentity(expected.type);
  const directName = normalizeIdentity(browser?.name);
  const hostName = normalizeIdentity(host?.name);

  if (expectedType === 'inapp' && expectedName !== null && hostName === expectedName) {
    const matched = ['context.host.name'];
    const mismatched = [];
    compareField('context.host.version', expected.version, host?.version?.raw, normalizeVersion, matched, mismatched);
    compareField('context.host.major', expected.major, host?.version?.major, normalizeVersion, matched, mismatched);
    return result(mismatched.length === 0 ? 'semantic-equivalent' : 'partial', expected, 'browser', matched, mismatched);
  }

  if (expectedName === null || browser === null || directName !== expectedName) {
    return result('unsupported', expected, 'browser', [], expectedName === null ? [] : ['browser.name']);
  }

  const matched = ['browser.name'];
  const mismatched = [];
  compareField('browser.version', expected.version, browser.version?.raw, normalizeVersion, matched, mismatched);
  compareField('browser.major', expected.major, browser.version?.major, normalizeVersion, matched, mismatched);
  if (expectedType !== null) compareField('browser.type', expected.type, browser.mode, normalizeIdentity, matched, mismatched);
  return result(mismatched.length === 0 ? 'exact' : 'partial', expected, 'browser', matched, mismatched);
}

function classifyOs(externalCase, actualResult) {
  const expected = externalCase.expected;
  const os = actualResult?.os ?? null;
  const expectedName = normalizeIdentity(expected.name);
  const actualName = normalizeIdentity(os?.name);
  if (expectedName === null || actualName === null) {
    return result('unsupported', expected, 'os', [], expectedName === null ? [] : ['os.name']);
  }
  if (expectedName !== actualName) {
    const genericLinuxFallback = actualName === 'linux' && expectedName.includes('linux');
    return result(genericLinuxFallback ? 'partial' : 'unsupported', expected, 'os', [], ['os.name']);
  }
  const matched = ['os.name'];
  const mismatched = [];
  compareField('os.version', expected.version, os.version?.raw, normalizeVersion, matched, mismatched);
  return result(mismatched.length === 0 ? 'exact' : 'partial', expected, 'os', matched, mismatched);
}

function classifyDevice(externalCase, actualResult) {
  const expected = externalCase.expected;
  const device = actualResult?.device ?? null;
  const expectedType = normalizeDeviceType(expected.type);
  const actualType = normalizeDeviceType(device?.type);
  if (expectedType !== null && (actualType === null || actualType === 'unknown' || actualType !== expectedType)) {
    return result('unsupported', expected, 'device', [], ['device.type']);
  }
  const matched = [];
  const mismatched = [];
  compareField('device.type', expected.type, device?.type, normalizeDeviceType, matched, mismatched);
  compareField('device.vendor', expected.vendor, device?.vendor, normalizeIdentity, matched, mismatched);
  compareField('device.model', expected.model, device?.model, normalizeIdentity, matched, mismatched);
  if (matched.length === 0) return result('unsupported', expected, 'device', matched, mismatched);
  return result(mismatched.length === 0 ? 'exact' : 'partial', expected, 'device', matched, mismatched);
}

export function classifyExternalCase(externalCase, actualResult) {
  if (!externalCase || !['browser', 'os', 'device'].includes(externalCase.domain)) {
    throw new Error('CONFORMANCE_CLASSIFICATION_INVALID: unsupported external domain.');
  }
  if (externalCase.domain === 'browser') return classifyBrowser(externalCase, actualResult);
  if (externalCase.domain === 'os') return classifyOs(externalCase, actualResult);
  return classifyDevice(externalCase, actualResult);
}
