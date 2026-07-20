export function formatVersion(version?: string): string {
    return version && /_/g.test(version) ? version.replace(/_/g, '.') : (version ?? '');
}
