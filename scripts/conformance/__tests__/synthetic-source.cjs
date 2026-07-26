const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_FILES = Object.freeze({
  'test/data/ua/browser/browser-all.json': [{ ua: 'IndependentBrowser/7.4 ExampleOS/3.2', desc: 'Invented independent browser fixture', expect: { name: 'Independent Browser', version: '7.4', major: '7' } }],
  'test/data/ua/os/alpha.json': [{ ua: 'AlphaRuntime/1 ExampleOS/3.2', desc: 'Invented alpha operating-system fixture', expect: { name: 'ExampleOS', version: '3.2' } }],
  'test/data/ua/os/zeta.json': [{ ua: 'ZetaRuntime/2 OtherOS/9', desc: 'Invented zeta operating-system fixture', expect: { name: 'OtherOS', version: '9' } }],
  'test/data/ua/device/alpha.json': [{ ua: 'ExamplePhone/Q1 AlphaRuntime/1', desc: 'Invented alpha device fixture', expect: { type: 'mobile', vendor: 'Example Vendor', model: 'Q1' } }],
  'test/data/ua/device/zeta.json': [{ ua: 'ExampleSlate/Z9 ZetaRuntime/2', desc: 'Invented zeta device fixture', expect: { type: 'tablet', vendor: 'Example Vendor', model: 'Z9' } }],
});

async function createSyntheticExternalSource(root, overrides = {}) {
  const sourceRoot = overrides.sourceRoot || path.join(root, 'external-source');
  const files = { ...DEFAULT_FILES, ...(overrides.files || {}) };
  for (const [relativeFile, value] of Object.entries(files)) {
    const absoluteFile = path.join(sourceRoot, relativeFile);
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  }
  return {
    sourceRoot,
    sentinels: {
      userAgents: Object.values(files).filter(Array.isArray).flatMap((records) => records.map((record) => record.ua).filter(Boolean)),
      descriptions: Object.values(files).filter(Array.isArray).flatMap((records) => records.map((record) => record.desc).filter(Boolean)),
    },
  };
}

module.exports = { createSyntheticExternalSource };
