/**
 * Guards against dated model snapshot IDs in content the orchestrator reads
 * or that gets emitted into user repositories. Routing selects a complexity
 * tier and the model comes from the user's subagentModelSettings, so neither
 * prose nor source may pin an ID.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCANNED_DIRS = ['skills', 'commands', 'templates', 'droids'];
const SCANNED_FILES = ['docs/FACTORY.md'];
const MODEL_ID = /claude-[a-z0-9.-]*\d{6,}/i;
// Vendor family names are not valid Factory model values and do not survive a
// snapshot bump; tiers are light/medium/heavy, routed via subagentModelSettings.
const VENDOR_TIER_NAME = /\b(haiku|sonnet|opus)\b/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('no hardcoded model snapshot IDs', () => {
  // AGENTS.md files are read by the orchestrator as standing instructions, so a
  // vendor name there misroutes delegation exactly like one in a skill would.
  const agentsFiles = [
    join(packageRoot, 'AGENTS.md'),
    ...walk(join(packageRoot, 'src')).filter((f) => f.endsWith('AGENTS.md')),
  ];
  const files = [
    ...SCANNED_DIRS.flatMap((d) => walk(join(packageRoot, d))),
    ...SCANNED_FILES.map((f) => join(packageRoot, f)),
    ...agentsFiles,
  ];

  it('scans a non-trivial number of files', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('finds no dated model IDs in skills, commands, templates, droids, AGENTS.md, or FACTORY.md', () => {
    const offenders = files
      .filter((file) => MODEL_ID.test(readFileSync(file, 'utf8')))
      .map((file) => relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });

  it('finds no vendor model family names standing in for a tier', () => {
    const offenders = files
      .filter((file) => VENDOR_TIER_NAME.test(readFileSync(file, 'utf8')))
      .map((file) => relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });

  it('pins no model in droid frontmatter, so complexity routing applies', () => {
    const offenders = walk(join(packageRoot, 'droids'))
      .filter((file) => file.endsWith('.md'))
      .filter((file) => {
        const model = readFileSync(file, 'utf8').match(/^model:\s+(\S+)/m);
        return model !== null && model[1] !== 'inherit';
      })
      .map((file) => relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });

  it('finds no dated model IDs in shipped source', () => {
    // Analytics parses real transcripts to estimate cost, so its fixtures and
    // tests legitimately carry real IDs. docs/droid/ is a verbatim mirror of
    // Factory's published docs and must not be edited to satisfy this guard.
    const offenders = walk(join(packageRoot, 'src'))
      .filter((file) => /\.(ts|mjs|md)$/.test(file))
      .filter((file) => !file.includes(`${sep}__tests__${sep}`))
      .filter((file) => MODEL_ID.test(readFileSync(file, 'utf8')))
      .map((file) => relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });
});
