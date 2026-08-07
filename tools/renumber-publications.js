#!/usr/bin/env node
/*
 * Renumber data/Journal-Papers.json into a single "J.n" series.
 *
 * Background
 * ----------
 * The extraction pipeline carried the filing convention of the source PDFs
 * into the ids: "J.n" for papers where Dr. Wang is first or corresponding
 * author, "JC.n" for collaborative papers.  Two problems followed:
 *
 *   1. The prefix encoded the author role, so the numbering ran as two
 *      parallel series and the paper count was not readable off the ids.
 *   2. Every sort in publications.js keys on the numeric part alone, so
 *      "J.5" and "JC.5" collided and ordered arbitrarily.
 *
 * This script assigns one continuous series, J.1 (oldest) through J.n
 * (newest), ordered by publication date.  The author role is preserved in the
 * existing `role` field ("lead" = first or corresponding author, "co-author"),
 * which is what the site now renders as a badge.  The original id is kept in
 * `legacy-id` so the mapping back to earlier CV versions is not lost.
 *
 * Usage
 * -----
 *   node tools/renumber-publications.js [--dry-run]
 *
 * Re-run after adding papers, then rebuild the offline bundle:
 *   node tools/build-offline-bundle.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'data', 'Journal-Papers.json');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Sort key placing the oldest paper first.  `publication-date` is an
 * ISO-ish "YYYY-MM" string; `year` is the fallback when it is missing, and the
 * title breaks any remaining tie so the numbering is stable across runs.
 *
 * @param {object} paper
 * @returns {Array} Comparable key
 */
function chronologicalKey(paper) {
  return [
    paper['publication-date'] || paper.year || '',
    paper.year || '',
    paper.title || ''
  ];
}

function compare(a, b) {
  const ka = chronologicalKey(a);
  const kb = chronologicalKey(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] < kb[i]) return -1;
    if (ka[i] > kb[i]) return 1;
  }
  return 0;
}

/**
 * Drop entries that repeat a DOI.  The source PDFs are filed by hand, so the
 * same article can appear twice under different filenames; without this the
 * paper count and the numbering are both inflated.  Entries with no DOI are
 * always kept — there is nothing reliable to compare them on.
 *
 * @param {Array<object>} papers
 * @returns {Array<object>} Papers with later duplicates removed
 */
function dedupeByDOI(papers) {
  const seen = new Map();
  const kept = [];
  papers.forEach(paper => {
    const doi = (paper.doi || '').trim().toLowerCase();
    if (!doi) {
      kept.push(paper);
      return;
    }
    const first = seen.get(doi);
    if (first) {
      console.log(
        `  duplicate DOI ${doi}\n` +
        `    keeping ${first.id} (${first['source-file']})\n` +
        `    dropping ${paper.id} (${paper['source-file']})`
      );
      return;
    }
    seen.set(doi, paper);
    kept.push(paper);
  });
  return kept;
}

function main() {
  const original = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const papers = dedupeByDOI(original);
  if (papers.length !== original.length) {
    console.log(`  removed ${original.length - papers.length} duplicate entr(ies)\n`);
  }

  // Rank chronologically without disturbing the file's own order, which stays
  // newest-first for readability.
  const ranked = papers.slice().sort(compare);
  const newIds = new Map();
  ranked.forEach((paper, index) => {
    newIds.set(paper, `J.${index + 1}`);
  });

  let changed = 0;
  papers.forEach(paper => {
    const next = newIds.get(paper);
    if (paper.id === next) return;
    changed += 1;
    console.log(
      `  ${String(paper.id).padEnd(7)} -> ${next.padEnd(6)} ` +
      `${paper['publication-date']}  ${String(paper.role).padEnd(9)} ` +
      `${(paper.title || '').slice(0, 54)}`
    );
    if (!paper['legacy-id']) paper['legacy-id'] = paper.id;
    paper.id = next;
  });

  const leads = papers.filter(p => p.role === 'lead').length;
  console.log(
    `\n${papers.length} papers — ${leads} first/corresponding author, ` +
    `${papers.length - leads} co-author. ${changed} id(s) changed.`
  );

  if (DRY_RUN) {
    console.log('Dry run — nothing written.');
    return;
  }
  fs.writeFileSync(FILE, JSON.stringify(papers, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${path.relative(path.resolve(__dirname, '..'), FILE)}.`);
  console.log('Now run: node tools/build-offline-bundle.js');
}

main();
