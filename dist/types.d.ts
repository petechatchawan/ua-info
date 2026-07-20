export type BrowserName = 'Chrome' | 'Chrome Mobile' | 'Safari' | 'Safari Mobile' | 'Firefox' | 'Opera' | 'Opera Mini' | 'IE' | 'Edge' | 'Samsung Internet' | 'Facebook' | 'Line' | 'Instagram' | 'Twitter' | 'Tiktok' | 'Headless Chrome' | 'Chrome Webview' | 'Android Browser' | 'Xiaomi Browser' | 'Huawei Browser' | 'Brave' | 'Vivaldi' | 'Yandex' | 'UC Browser' | 'Arc' | 'Other';
export type OSName = 'Windows' | 'Android' | 'iOS' | 'MacOS' | 'HarmonyOS' | 'Linux' | 'Other' | 'Chrome OS';
export interface PropertyValue {
    value: BrowserName | Function | RegExp;
    transform?: Function;
}
export interface PropertyDefinition {
    name?: BrowserName | OSName | PropertyValue;
    version?: string | PropertyValue;
    type?: string | PropertyValue;
    vendor?: string | PropertyValue;
    model?: string | PropertyValue;
}
export interface MappingEntry {
    regex: RegExp[];
    properties: PropertyDefinition;
}
export interface UserAgentResult {
    [key: string]: any;
}
export interface UserAgentInfo {
    userAgentString: string;
    browser: BrowserInfo;
    os: OSInfo;
    device: DeviceInfo;
}
export interface BrowserInfo {
    name: BrowserName;
    version: string;
    type?: string;
    toString(): string;
}
export interface OSInfo {
    name: OSName;
    version: string;
    toString(): string;
}
export interface DeviceInfo {
    type: string;
    vendor: string;
    model: string;
    toString(): string;
}
