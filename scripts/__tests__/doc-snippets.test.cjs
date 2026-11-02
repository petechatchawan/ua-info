describe('documentation snippets', () => {
  let snippets;

  beforeAll(async () => {
    snippets = await import('../doc-snippets.mjs');
  });

  const fence = (info, code) => '```ts' + info + '\n' + code + '\n```\n';

  test('checks ts blocks and leaves other fences and skipped blocks alone', () => {
    const markdown = [
      fence('', 'const a = 1;'),
      fence(' skip', 'const b = 2;'),
      '```bash\nnpm i\n```\n',
      fence('', 'const c = 3;'),
    ].join('\n');

    const blocks = snippets.extractTypeScriptBlocks(markdown);

    expect(blocks.map((block) => block.code.trim())).toEqual(['const a = 1;', 'const c = 3;']);
    expect(blocks[0].line).toBe(2);
  });

  test('hoists one import per module so later blocks can use earlier imports', () => {
    const output = snippets.buildSnippetModule([
      { line: 1, code: "import { parse } from 'user-agent-parser-ts';\nparse('');" },
      { line: 9, code: "import { parse, UAInfo } from 'user-agent-parser-ts';\nimport { is } from 'user-agent-parser-ts/check';\nis(info, {});" },
    ]);

    expect(output.match(/from 'user-agent-parser-ts';/g)).toHaveLength(1);
    expect(output).toContain("import { UAInfo, parse } from 'user-agent-parser-ts';");
    expect(output).toContain("import { is } from 'user-agent-parser-ts/check';");
    expect(output).toContain('declare const info: UAInfo;');
  });

  test('does not declare a name that a block imports itself', () => {
    const output = snippets.buildSnippetModule([{ line: 1, code: "import liff from '@line/liff';\nliff;" }]);

    expect(output).toContain("import liff from '@line/liff';");
    expect(output).not.toContain('declare const liff');
  });

  test('turns a documented "// error" into an expected compile error', () => {
    const output = snippets.buildSnippetModule([{ line: 5, code: "is(info, { browser: 'chrom' });  // error" }]);

    expect(output).toContain("// @ts-expect-error\nis(info, { browser: 'chrom' });  // error");
  });
});
