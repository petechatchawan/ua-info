export function formatVersion(version) {
    return version && /_/g.test(version) ? version.replace(/_/g, '.') : (version !== null && version !== void 0 ? version : '');
}
