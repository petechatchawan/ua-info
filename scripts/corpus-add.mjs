import { appendFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpusDirectory = path.join(root, 'test', 'corpus');

const USAGE = `Usage: npm run build && npm run corpus:add -- --topic <name> --id <kebab-id> --src <source> [--header name=value]... "<User-Agent>"

  --topic   corpus file without extension (browsers, platforms, clients, contexts, hints, ...)
  --id      unique kebab-case id
  --src     doc:<url> | observed:<where>@<yyyy-mm-dd> | synthetic:<why>
  --header  Client Hints header, repeatable (parseRequest is used when present)

The expectation is the CURRENT result of the built package. Review it before committing: an entry
that records a wrong result must be turned into an open entry with the desired result.`;

function fail(message) {
  process.stderr.write(`${message}\n\n${USAGE}\n`);
  process.exit(2);
}

const { values, positionals } = parseArgs({
  options: {
    topic: { type: 'string' },
    id: { type: 'string' },
    src: { type: 'string' },
    header: { type: 'string', multiple: true },
  },
  allowPositionals: true,
});

const [userAgent] = positionals;
if (!values.topic || !values.id || !values.src || userAgent === undefined) fail('Missing argument.');
if (!/^[a-z0-9]+$/.test(values.topic)) fail('--topic must be a plain file name such as browsers.');

const headers = {};
for (const pair of values.header ?? []) {
  const separator = pair.indexOf('=');
  if (separator < 1) fail(`--header must be name=value, received ${pair}.`);
  headers[pair.slice(0, separator).toLowerCase()] = pair.slice(separator + 1);
}

for (const file of await readdir(corpusDirectory)) {
  if (!file.endsWith('.jsonl')) continue;
  for (const line of (await readFile(path.join(corpusDirectory, file), 'utf8')).split('\n')) {
    if (line.trim() && JSON.parse(line).id === values.id) fail(`The id ${values.id} already exists in ${file}.`);
  }
}

const { parse } = await import('../dist/esm/index.js');
const { parseRequest } = await import('../dist/esm/server.js');
const hasHeaders = Object.keys(headers).length > 0;
const { ua, ...expectation } = hasHeaders
  ? parseRequest({ ...headers, 'user-agent': userAgent })
  : parse(userAgent);

const entry = { id: values.id, ua: userAgent, ...(hasHeaders ? { headers } : {}), src: values.src, expect: expectation };
await appendFile(path.join(corpusDirectory, `${values.topic}.jsonl`), `${JSON.stringify(entry)}\n`);

const { browser, os, device, client, context } = expectation;
process.stdout.write(
  `Added ${values.id} to test/corpus/${values.topic}.jsonl\n` +
  `  browser ${browser.name} ${browser.version?.full ?? ''} (${browser.mode}), os ${os.name} ${os.version?.full ?? ''}, ` +
  `device ${device.type} ${device.vendor ?? ''} ${device.model ?? ''}, client ${client.type ?? 'none'} ${client.name ?? ''}, context ${context.name ?? 'none'}\n` +
  'Check the expectation against what the UA really is, then run npm test.\n',
);
