import { execFile as execFileCallback } from 'node:child_process';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function invalid(message, cause) {
  return new Error(`CONFORMANCE_SOURCE_INVALID: ${message}`, cause === undefined ? undefined : { cause });
}

export async function assertExternalPath({ candidatePath, worktreeRoot, label }) {
  if (typeof candidatePath !== 'string' || candidatePath.length === 0) {
    throw invalid(`unable to resolve ${label}.`);
  }
  if (typeof worktreeRoot !== 'string' || worktreeRoot.length === 0) {
    throw invalid('unable to resolve ua-info worktree.');
  }

  let resolvedCandidate;
  let resolvedWorktree;
  try {
    [resolvedCandidate, resolvedWorktree] = await Promise.all([
      realpath(candidatePath),
      realpath(worktreeRoot),
    ]);
  } catch (error) {
    throw invalid(`unable to resolve ${label}.`, error);
  }

  if (isWithin(resolvedWorktree, resolvedCandidate)) {
    throw new Error(`CONFORMANCE_SOURCE_UNSAFE: ${label} resolves inside the ua-info worktree.`);
  }

  return resolvedCandidate;
}

export async function resolveExternalSource({ sourceDir, worktreeRoot }) {
  const [sourceRoot, resolvedWorktreeRoot] = await Promise.all([
    assertExternalPath({ candidatePath: sourceDir, worktreeRoot, label: 'external source root' }),
    realpath(worktreeRoot).catch((error) => {
      throw invalid('unable to resolve ua-info worktree.', error);
    }),
  ]);

  return Object.freeze({ sourceRoot, worktreeRoot: resolvedWorktreeRoot });
}

export async function readLocalGitState(sourceRoot) {
  try {
    const [{ stdout: revisionOutput }, { stdout: statusOutput }] = await Promise.all([
      execFile('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }),
      execFile('git', ['-C', sourceRoot, 'status', '--porcelain'], { encoding: 'utf8' }),
    ]);
    const revision = revisionOutput.trim();
    if (revision.length === 0) {
      return Object.freeze({ revision: null, dirty: null });
    }
    return Object.freeze({ revision, dirty: statusOutput.trim().length > 0 });
  } catch {
    return Object.freeze({ revision: null, dirty: null });
  }
}
