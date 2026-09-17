import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { astGrepSearchTool } from "../../tools/ast-tools.js";

type SearchArgs = Parameters<typeof astGrepSearchTool.handler>[0];

/** Run the search tool over a temp directory holding the given files. */
async function search(
  files: Record<string, string>,
  args: Omit<SearchArgs, "path">,
) {
  const dir = mkdtempSync(join(tmpdir(), "omd-ast-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content);
    }
    const result = await astGrepSearchTool.handler({ path: dir, ...args });
    return result.content.map((block) => block.text).join("\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("ast_grep_search language support", () => {
  // Python is no longer built into @ast-grep/napi; it needs its lang pack.
  it("searches a language loaded from a @ast-grep/lang-* pack", async () => {
    const text = await search(
      { "sample.py": "def f(x):\n    return x + 1\n" },
      {
        pattern: "return $A",
        language: "python",
      },
    );
    expect(text).toContain("Found 1 match(es)");
  });

  it("searches a language built into @ast-grep/napi", async () => {
    const text = await search(
      { "sample.ts": "const total = 1;\n" },
      {
        pattern: "const $NAME = $VALUE",
        language: "typescript",
      },
    );
    expect(text).toContain("Found 1 match(es)");
  });
});
