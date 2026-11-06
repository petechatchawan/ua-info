import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('ua-inspect/package.json');
const packageMetadata = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    readonly version: string;
};

export default defineConfig({
    base: '/ua-inspect/',
    define: {
        __UA_INFO_VERSION__: JSON.stringify(packageMetadata.version),
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
    server: { host: '127.0.0.1' },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
