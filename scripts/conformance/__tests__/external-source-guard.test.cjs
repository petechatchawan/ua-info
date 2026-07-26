const { mkdtemp, mkdir, symlink, writeFile, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let guard;
let tempRoot;

beforeAll(async () => {
  guard = await import(pathToFileURL(path.resolve(__dirname, '../external-source-guard.mjs')).href);
});

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ua-info-conformance-guard-'));
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

test.each([
  ['missing source', 'missing', 'CONFORMANCE_SOURCE_INVALID'],
  ['source equals worktree', 'equal', 'CONFORMANCE_SOURCE_UNSAFE'],
  ['source nested in worktree', 'nested', 'CONFORMANCE_SOURCE_UNSAFE'],
  ['sibling source', 'sibling', null],
])('%s', async (_name, kind, expectedCode) => {
  const worktreeRoot = path.join(tempRoot, 'worktree');
  const siblingRoot = path.join(tempRoot, 'external');
  await mkdir(worktreeRoot);
  await mkdir(siblingRoot);

  const sourceDir = kind === 'missing'
    ? path.join(tempRoot, 'missing')
    : kind === 'equal'
      ? worktreeRoot
      : kind === 'nested'
        ? path.join(worktreeRoot, 'tmp-source')
        : siblingRoot;

  if (kind === 'nested') await mkdir(sourceDir);

  const operation = guard.resolveExternalSource({ sourceDir, worktreeRoot });
  if (expectedCode === null) {
    await expect(operation).resolves.toMatchObject({ sourceRoot: siblingRoot, worktreeRoot });
  } else {
    await expect(operation).rejects.toThrow(expectedCode);
  }
});

test('rejects a root symlink outside the repository that resolves inside', async () => {
  const worktreeRoot = path.join(tempRoot, 'worktree');
  const inside = path.join(worktreeRoot, 'source');
  const symlinkRoot = path.join(tempRoot, 'external-link');
  await mkdir(inside, { recursive: true });
  await symlink(inside, symlinkRoot, 'dir');

  await expect(guard.resolveExternalSource({ sourceDir: symlinkRoot, worktreeRoot }))
    .rejects.toThrow('CONFORMANCE_SOURCE_UNSAFE');
});

test('rejects a child JSON symlink that resolves inside the worktree', async () => {
  const worktreeRoot = path.join(tempRoot, 'worktree');
  const siblingRoot = path.join(tempRoot, 'external');
  const insideFile = path.join(worktreeRoot, 'inside.json');
  const childLink = path.join(siblingRoot, 'child.json');
  await mkdir(worktreeRoot);
  await mkdir(siblingRoot);
  await writeFile(insideFile, '{}');
  await symlink(insideFile, childLink, 'file');

  await expect(guard.assertExternalPath({
    candidatePath: childLink,
    worktreeRoot,
    label: 'child JSON file',
  })).rejects.toThrow('CONFORMANCE_SOURCE_UNSAFE');
});

test('accepts a safe sibling child path', async () => {
  const worktreeRoot = path.join(tempRoot, 'worktree');
  const siblingRoot = path.join(tempRoot, 'external');
  const child = path.join(siblingRoot, 'child.json');
  await mkdir(worktreeRoot);
  await mkdir(siblingRoot);
  await writeFile(child, '{}');

  await expect(guard.assertExternalPath({
    candidatePath: child,
    worktreeRoot,
    label: 'child JSON file',
  })).resolves.toBe(child);
});

test('returns null Git state for a non-Git source', async () => {
  const sourceRoot = path.join(tempRoot, 'external');
  await mkdir(sourceRoot);
  await expect(guard.readLocalGitState(sourceRoot)).resolves.toEqual({ revision: null, dirty: null });
});
