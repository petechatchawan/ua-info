import { ContextId } from '../constants';
import type { ContextInfo, ContextType, ProductInfo } from '../types';
import { parseVersion } from '../version';

function host(name: string, versionRaw?: string): ProductInfo {
  return { name, version: versionRaw ? parseVersion(versionRaw) : null };
}

function context(type: ContextType, name: ContextInfo['name'], versionRaw?: string): ContextInfo {
  return { type, name, host: host(name ?? '', versionRaw) };
}

export function detectContext(userAgent: string): ContextInfo {
  const messenger = /\bFBAN\/(?:Orca-Android|MessengerForiOS)\b/i.test(userAgent)
    ? /\bFBAV\/([0-9.]+)/i.exec(userAgent)
    : null;
  if (messenger?.[1]) return context('in-app-browser', ContextId.Messenger, messenger[1]);

  const line = /\bLine\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (line?.[1]) return context('in-app-browser', ContextId.Line, line[1]);

  const instagram = /\bInstagram[ /]([0-9.]+)/i.exec(userAgent);
  if (instagram?.[1]) return context('in-app-browser', ContextId.Instagram, instagram[1]);

  const weChat = /\bMicroMessenger\/([0-9.]+)/i.exec(userAgent);
  if (weChat?.[1]) return context('in-app-browser', ContextId.WeChat, weChat[1]);

  const facebook = /(?:FBAV\/|\[FBAN\/[^;\]]+;FBAV\/)([0-9.]+)/i.exec(userAgent);
  if (facebook?.[1]) return context('in-app-browser', ContextId.Facebook, facebook[1]);

  return { type: null, name: null, host: null };
}
