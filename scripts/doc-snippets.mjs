const FENCE = /^```(?:ts|typescript)([^\n]*)\n([\s\S]*?)^```$/gm;
const IMPORT = /^import\s+(type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\}\s*)?from\s*'([^']+)';?$/;
const ERROR_NOTE = /\/\/\s*error\b/;

const AMBIENT = {
  info: 'UAInfo',
  userAgent: 'string',
  lineUserAgent: 'string',
  request: 'any',
  liff: 'any',
};

export function extractTypeScriptBlocks(markdown) {
  const blocks = [];
  for (const match of markdown.matchAll(FENCE)) {
    if (/\bskip\b/.test(match[1])) continue;
    blocks.push({ code: match[2], line: markdown.slice(0, match.index).split('\n').length + 1 });
  }
  return blocks;
}

export function buildSnippetModule(blocks) {
  const modules = new Map([['user-agent-parser-ts', { fallback: null, names: new Set(['UAInfo']) }]]);
  const bodies = [];
  for (const block of blocks) {
    const body = [];
    for (const line of block.code.split('\n')) {
      const imported = IMPORT.exec(line.trim());
      if (!imported) {
        if (ERROR_NOTE.test(line)) body.push('// @ts-expect-error');
        body.push(line);
        continue;
      }
      const [, , fallback, names, source] = imported;
      const entry = modules.get(source) ?? { fallback: null, names: new Set() };
      if (fallback) entry.fallback = fallback;
      for (const name of (names ?? '').split(',').map((part) => part.trim().replace(/^type\s+/, ''))) {
        if (name) entry.names.add(name);
      }
      modules.set(source, entry);
    }
    bodies.push(`// line ${block.line}\nasync function snippet${block.line}() {\n${body.join('\n')}\n}`);
  }
  const imports = [...modules].map(([source, { fallback, names }]) => {
    const clause = [fallback, names.size > 0 ? `{ ${[...names].join(', ')} }` : null].filter(Boolean).join(', ');
    return `import ${clause} from '${source}';`;
  });
  const imported = new Set([...modules.values()].flatMap(({ fallback, names }) => [fallback, ...names]));
  const declarations = Object.entries(AMBIENT)
    .filter(([name]) => !imported.has(name))
    .map(([name, type]) => `declare const ${name}: ${type};`);
  return [...imports, ...declarations, ...bodies, 'export {};', ''].join('\n');
}
