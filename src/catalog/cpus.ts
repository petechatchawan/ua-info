import type { RowSpec } from '../core/match';

export interface CPUSignal {
  readonly bitness: 32 | 64 | null;
}

export interface CPURow extends RowSpec<string, CPUSignal> {
  readonly label: string;
}

const word = (words: string, bitness: CPUSignal['bitness']) => ({ words, bitness, versionOptional: true as const });

// Edges only where two architectures can share a UA: a 64-bit token beats the 32-bit family it extends.
const rows = {
  arm: { label: 'ARM', match: [word('armv8', 32), word('armv7', 32), word('arm', 32)] },
  arm64: {
    label: 'ARM64',
    beats: ['arm', 'x86_64', 'x86'],
    match: [word('arm64', 64), word('aarch64', 64), word('iphone', 64), word('ipad', 64)],
  },
  mips: { label: 'MIPS', match: [word('mips64', 64), word('mips', 32)] },
  powerpc: { label: 'PowerPC', match: [word('ppc', null), word('powerpc', null)] },
  riscv: { label: 'RISC-V', match: [word('riscv64', 64)] },
  sparc: { label: 'SPARC', match: [word('sparc', null)] },
  x86: {
    label: 'x86',
    match: [word('i386', 32), word('i486', 32), word('i586', 32), word('i686', 32), word('x86', 32), word('win32', 32)],
  },
  x86_64: {
    label: 'x86-64',
    beats: ['x86'],
    match: [word('x86_64', 64), word('x64', 64), word('win64', 64), word('wow64', 64), word('amd64', 64)],
  },
} as const satisfies Readonly<Record<string, CPURow>>;

export type CPUArchitecture = keyof typeof rows;
export const CPUS: Readonly<Record<CPUArchitecture, CPURow>> = rows;
