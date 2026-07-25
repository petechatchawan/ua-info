/**
 * Strict, allocation-free predicates for querying and narrowing a canonical `UAResult`.
 * Values are compared exactly as supplied; these helpers do not normalize or reparse input.
 * A successful match describes parsed claims and does not authenticate request identity.
 */
import type {
    BrowserInfo,
    BrowserMode,
    ClientInfo,
    ClientKind,
    ContextInfo,
    ContextKind,
    CPUInfo,
    DeviceInfo,
    DeviceType,
    EngineInfo,
    OSInfo,
    UAResult,
} from './types';

type BrowserResult<T extends string> = {
    readonly browser: BrowserInfo & { readonly id: T };
};

type BrowserFamilyResult<T extends string> = {
    readonly browser: BrowserInfo & { readonly family: T };
};

type BrowserModeResult<T extends BrowserMode> = {
    readonly browser: BrowserInfo & { readonly mode: T };
};

type EngineResult<T extends string> = {
    readonly engine: EngineInfo & { readonly id: T };
};

type OperatingSystemResult<T extends string> = {
    readonly os: OSInfo & { readonly id: T };
};

type DeviceTypeResult<T extends DeviceType> = {
    readonly device: DeviceInfo & { readonly type: T };
};

type CPUArchitectureResult<T extends string> = {
    readonly cpu: CPUInfo & { readonly architecture: T };
};

type ClientKindResult<T extends ClientKind> = {
    readonly client: ClientInfo & { readonly kind: T };
};

type ContextKindResult<T extends ContextKind> = {
    readonly context: ContextInfo & { readonly kind: T };
};

/** Check the normalized browser product ID and narrow `result.browser` on success. */
export function isBrowser<T extends string>(
    result: UAResult,
    id: T,
): result is UAResult & BrowserResult<T> {
    return result.browser?.id === id;
}

/** Check the normalized browser family and narrow `result.browser` on success. */
export function isBrowserFamily<T extends string>(
    result: UAResult,
    family: T,
): result is UAResult & BrowserFamilyResult<T> {
    return result.browser?.family === family;
}

/** Check the browser execution mode and narrow `result.browser` on success. */
export function isBrowserMode<T extends BrowserMode>(
    result: UAResult,
    mode: T,
): result is UAResult & BrowserModeResult<T> {
    return result.browser?.mode === mode;
}

/** Check the normalized rendering-engine ID and narrow `result.engine` on success. */
export function isEngine<T extends string>(
    result: UAResult,
    id: T,
): result is UAResult & EngineResult<T> {
    return result.engine?.id === id;
}

/** Check the normalized operating-system ID and narrow `result.os` on success. */
export function isOperatingSystem<T extends string>(
    result: UAResult,
    id: T,
): result is UAResult & OperatingSystemResult<T> {
    return result.os?.id === id;
}

/** Check the device class and narrow `result.device.type` on success. */
export function isDeviceType<T extends DeviceType>(
    result: UAResult,
    type: T,
): result is UAResult & DeviceTypeResult<T> {
    return result.device.type === type;
}

/** Check the normalized CPU architecture and narrow `result.cpu` on success. */
export function isCPUArchitecture<T extends string>(
    result: UAResult,
    architecture: T,
): result is UAResult & CPUArchitectureResult<T> {
    return result.cpu?.architecture === architecture;
}

/** Check the selected non-browser client kind and narrow `result.client` on success. */
export function isClientKind<T extends ClientKind>(
    result: UAResult,
    kind: T,
): result is UAResult & ClientKindResult<T> {
    return result.client?.kind === kind;
}

/** Check the execution-context kind and narrow `result.context` on success. */
export function isContextKind<T extends ContextKind>(
    result: UAResult,
    kind: T,
): result is UAResult & ContextKindResult<T> {
    return result.context?.kind === kind;
}
