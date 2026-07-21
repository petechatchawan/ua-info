import { CPUArchitecture } from '../constants';
import type { CPUInfo } from '../types';

function createCPU(architecture: string, bitness: 32 | 64 | null): CPUInfo {
    return { architecture, bitness };
}

export function detectCPU(userAgent: string): CPUInfo | null {
    if (/\b(?:arm64|aarch64|AppleWebKit.+(?:iPhone|iPad))\b/i.test(userAgent)) {
        return createCPU(CPUArchitecture.ARM64, 64);
    }
    if (/\b(?:armv8|armv7|arm)\b/i.test(userAgent)) return createCPU(CPUArchitecture.ARM, 32);
    if (/\b(?:x86_64|x64|Win64|WOW64|amd64)\b/i.test(userAgent)) {
        return createCPU(CPUArchitecture.X86_64, 64);
    }
    if (/\b(?:i[3-6]86|x86|Win32)\b/i.test(userAgent)) return createCPU(CPUArchitecture.X86, 32);
    if (/\bmips64\b/i.test(userAgent)) return createCPU(CPUArchitecture.MIPS, 64);
    if (/\bmips\b/i.test(userAgent)) return createCPU(CPUArchitecture.MIPS, 32);
    if (/\briscv64\b/i.test(userAgent)) return createCPU(CPUArchitecture.RISCV, 64);
    if (/\b(?:ppc|powerpc)\b/i.test(userAgent)) return createCPU(CPUArchitecture.PowerPC, null);
    if (/\bsparc\b/i.test(userAgent)) return createCPU(CPUArchitecture.SPARC, null);
    return null;
}
