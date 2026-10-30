import type { CPUArchitecture } from '../constants';
import type { RowSpec } from '../core/match';

export interface CPUSignal {
  readonly bitness: 32 | 64 | null;
}

export type CPURow = RowSpec<CPUArchitecture, CPUSignal>;

const word = (words: string, bitness: CPUSignal['bitness']) => ({ words, bitness, versionOptional: true as const });

// Edges only where two architectures can share a User-Agent: a 64-bit token beats the 32-bit family it extends.
export const CPUS: Readonly<Record<CPUArchitecture, CPURow>> = {
  arm: { match: [word('armv8', 32), word('armv7', 32), word('arm', 32)] },
  arm64: {
    beats: ['arm', 'x86_64', 'x86'],
    match: [word('arm64', 64), word('aarch64', 64), word('iphone', 64), word('ipad', 64)],
  },
  mips: { match: [word('mips64', 64), word('mips', 32)] },
  powerpc: { match: [word('ppc', null), word('powerpc', null)] },
  riscv: { match: [word('riscv64', 64)] },
  sparc: { match: [word('sparc', null)] },
  x86: {
    match: ['i386', 'i486', 'i586', 'i686', 'x86', 'win32'].map((value) => word(value, 32)),
  },
  x86_64: {
    beats: ['x86'],
    match: ['x86_64', 'x64', 'win64', 'wow64', 'amd64'].map((value) => word(value, 64)),
  },
};
