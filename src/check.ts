import type {
  AppId,
  BrowserFamily,
  BrowserId,
  BrowserMode,
  ClientId,
  ClientInfo,
  ClientType,
  ContextId,
  ContextType,
  DeviceType,
  EngineId,
  OSId,
  UAInfo,
  VendorId,
} from './types';

type Many<T> = T | readonly T[];

/**
 * What to look for. Keys combine with AND and the values of one key combine with OR, so
 * `{ browser: 'chrome', os: ['android', 'harmonyos'] }` is Chrome on Android or HarmonyOS.
 * Every value is a stable lowercase ID, and a misspelled one fails to compile.
 */
export interface Query {
  readonly browser?: Many<BrowserId>;
  readonly family?: Many<BrowserFamily>;
  readonly mode?: Many<BrowserMode>;
  readonly engine?: Many<EngineId>;
  readonly os?: Many<OSId>;
  readonly device?: Many<DeviceType>;
  readonly vendor?: Many<VendorId>;
  readonly client?: Many<ClientId>;
  readonly clientType?: Many<ClientType>;
  readonly context?: Many<ContextId>;
  readonly contextType?: Many<ContextType>;
  readonly app?: Many<AppId>;
}

type Element<T> = T extends readonly (infer U)[] ? U : T;
type Has<Q extends Query, K extends keyof Query> = K extends keyof Q ? true : false;

type Narrowed<Q extends Query> =
  & (Has<Q, 'browser'> extends true ? { readonly browser: { readonly name: Element<Q['browser']> } } : unknown)
  & (Has<Q, 'family'> extends true ? { readonly browser: { readonly family: Element<Q['family']> } } : unknown)
  & (Has<Q, 'mode'> extends true ? { readonly browser: { readonly mode: Element<Q['mode']> } } : unknown)
  & (Has<Q, 'engine'> extends true ? { readonly engine: { readonly name: Element<Q['engine']> } } : unknown)
  & (Has<Q, 'os'> extends true ? { readonly os: { readonly name: Element<Q['os']> } } : unknown)
  & (Has<Q, 'device'> extends true ? { readonly device: { readonly type: Element<Q['device']> } } : unknown)
  & (Has<Q, 'vendor'> extends true ? { readonly device: { readonly vendor: Element<Q['vendor']> } } : unknown)
  & (Has<Q, 'client'> extends true ? { readonly client: { readonly name: Element<Q['client']> } } : unknown)
  & (Has<Q, 'clientType'> extends true ? { readonly client: { readonly type: Element<Q['clientType']> } } : unknown)
  & (Has<Q, 'context'> extends true ? { readonly context: { readonly name: Element<Q['context']> } } : unknown)
  & (Has<Q, 'contextType'> extends true ? { readonly context: { readonly type: Element<Q['contextType']> } } : unknown)
  & (Has<Q, 'app'> extends true ? { readonly context: { readonly app: Element<Q['app']> } } : unknown);

function matches<T>(actual: T | null, wanted: Many<T> | undefined): boolean {
  if (wanted === undefined) return true;
  if (actual === null) return false;
  return Array.isArray(wanted) ? (wanted as readonly T[]).includes(actual) : actual === wanted;
}

/** True when `info` satisfies every key of the query, and narrows the fields that the query names. */
export function is<Q extends Query>(info: UAInfo, query: Q): info is UAInfo & Narrowed<Q> {
  return (
    matches(info.browser.name, query.browser) &&
    matches(info.browser.family, query.family) &&
    matches(info.browser.mode, query.mode) &&
    matches(info.engine.name, query.engine) &&
    matches(info.os.name, query.os) &&
    matches(info.device.type, query.device) &&
    matches(info.device.vendor, query.vendor) &&
    matches(info.client.name, query.client) &&
    matches(info.client.type, query.clientType) &&
    matches(info.context.name, query.context) &&
    matches(info.context.type, query.contextType) &&
    matches(info.context.app, query.app)
  );
}

const BOT_TYPES: readonly (ClientInfo['type'])[] = ['bot', 'crawler', 'ai-crawler'];

/** True for the client types that fetch pages on their own: `bot`, `crawler` and `ai-crawler`. */
export function isBot(info: UAInfo): boolean {
  return BOT_TYPES.includes(info.client.type);
}
