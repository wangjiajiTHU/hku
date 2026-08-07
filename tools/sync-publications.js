#!/usr/bin/env node
/*
 * Reconcile data/Journal-Papers.json against the authoritative CV list.
 *
 * What it does
 * ------------
 *  1. Adds papers present in the CV list but missing from the site data,
 *     using metadata fetched from CrossRef by DOI.
 *  2. Corrects the `role` field ("lead" = first or corresponding author,
 *     "co-author") from the CV list, which is authoritative.  The extraction
 *     pipeline had inferred role from the source PDF filename prefix, which
 *     was wrong in at least one case.
 *  3. Renumbers every paper into one continuous "J.n" series matching the CV
 *     order: J.1-J.47 first/corresponding author, J.48-J.71 co-author, each
 *     block newest first.  The original id is preserved in `legacy-id`.
 *
 * The CV order is the numbering Dr. Wang uses, so the site and the CV agree.
 *
 * Usage
 * -----
 *   node tools/sync-publications.js <cv-list.txt> [--dry-run]
 *
 * The CV list is a plain text file, one paper per line, numbered "1." onwards,
 * with a line containing "===" separating the first/corresponding-author block
 * from the co-author block.
 *
 * Afterwards rebuild the offline bundle:
 *   node tools/build-offline-bundle.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'Journal-Papers.json');
const LIST = process.argv[2];
const DRY_RUN = process.argv.includes('--dry-run');

if (!LIST || !fs.existsSync(LIST)) {
  console.error('Usage: node tools/sync-publications.js <cv-list.txt> [--dry-run]');
  process.exit(1);
}

const normDOI = d =>
  (d || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/[.\s]+$/, '');

const normTitle = t =>
  (t || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).join(' ');

/** Dice coefficient over word bigrams — tolerant of the CV's abbreviations. */
function similarity(a, b) {
  const grams = s => {
    const w = s.split(' ');
    return new Set(w.length < 2 ? w : w.slice(0, -1).map((x, i) => `${x} ${w[i + 1]}`));
  };
  const ga = grams(a);
  const gb = grams(b);
  if (!ga.size || !gb.size) return 0;
  let hit = 0;
  ga.forEach(g => { if (gb.has(g)) hit += 1; });
  return (2 * hit) / (ga.size + gb.size);
}

/**
 * Parse the CV list into {num, role, doi, title} records.  The title is taken
 * as the longest sentence after the year, which beats the journal name and the
 * author list in every entry of this list.
 */
function parseCV(text) {
  const entries = [];
  let role = 'lead';
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('===')) { role = 'co-author'; return; }
    const m = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (!m) return;
    let rest = m[2];
    let doi = '';
    const dm = rest.match(/(https?:\/\/\S*doi\S+)/i);
    if (dm) {
      doi = normDOI(dm[1]);
      rest = rest.slice(0, dm.index).trim();
    }
    const afterYear = rest.replace(/\(\d{4}\)\.?/, '|');
    const tail = afterYear.includes('|') ? afterYear.split('|')[1] : afterYear;
    const sentences = tail.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 15);
    const title = sentences.length
      ? sentences.reduce((a, b) => (b.length > a.length ? b : a))
      : tail.trim();
    entries.push({ num: Number(m[1]), role, doi, title });
  });
  return entries;
}

/** Fetch a CrossRef record. */
async function crossref(doi) {
  const resp = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'SAIL-HKU-site/1.0 (mailto:cewang@hku.hk)' }
  });
  if (!resp.ok) throw new Error(`CrossRef ${resp.status} for ${doi}`);
  return (await resp.json()).message;
}

/** APA-style author initials, matching the format already in the data file. */
function apaAuthors(authors) {
  const formatted = authors.map(a => {
    const given = (a.given || '').split(/[\s-]+/).filter(Boolean)
      .map(part => `${part[0]}.`).join(' ');
    return `${a.family || ''}, ${given}`.trim();
  });
  if (formatted.length === 1) return formatted[0];
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

/** Build a data record in the shape the site already uses. */
function recordFromCrossRef(message, role) {
  const authors = (message.author || []).map(a =>
    `${a.given || ''} ${a.family || ''}`.trim());
  const parts = (message.published || message['published-online'] ||
                 message['published-print'] || {})['date-parts'] || [[]];
  const [year, month] = parts[0];
  const journal = (message['container-title'] || [''])[0];
  const volume = message.volume || '';
  const pages = message.page || message['article-number'] || '';
  const title = (message.title || [''])[0];
  const doi = normDOI(message.DOI);

  const bits = [`${apaAuthors(message.author || [])} (${year}).`, `${title}.`, journal];
  let citation = `${bits[0]} ${bits[1]} ${journal}`;
  if (volume) citation += `, ${volume}`;
  if (pages) citation += `, ${pages}`;
  citation += '.';

  return {
    id: '',
    role,
    year: String(year || ''),
    title,
    publisher: message.publisher || '',
    volume: String(volume),
    issue: String(message.issue || ''),
    pages: String(pages),
    authors,
    'corresponding author': '',
    journal,
    abstract: (message.abstract || '').replace(/<[^>]+>/g, '').trim(),
    keywords: [],
    doi,
    link: `https://doi.org/${doi}`,
    APA: citation,
    'publication-date': month ? `${year}-${String(month).padStart(2, '0')}` : String(year || ''),
    'source-file': ''
  };
}

async function main() {
  const cv = parseCV(fs.readFileSync(LIST, 'utf8'));
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  console.log(`CV list: ${cv.length} entries. Site data: ${data.length} papers.\n`);

  // Match each CV entry to a site record.  DOI first; a DOI already claimed by
  // an earlier entry falls through to title matching, which is what rescues
  // the two CV lines that share a copy-pasted DOI.
  const byDOI = new Map();
  data.forEach(p => { if (normDOI(p.doi)) byDOI.set(normDOI(p.doi), p); });
  const claimed = new Set();
  const missing = [];

  cv.forEach(entry => {
    let hit = null;
    const viaDOI = entry.doi ? byDOI.get(entry.doi) : null;
    if (viaDOI && !claimed.has(viaDOI)) {
      hit = viaDOI;
    } else {
      const target = normTitle(entry.title);
      let best = null;
      let bestScore = 0;
      data.forEach(p => {
        if (claimed.has(p)) return;
        const score = similarity(target, normTitle(p.title));
        if (score > bestScore) { bestScore = score; best = p; }
      });
      if (bestScore >= 0.55) hit = best;
    }
    if (hit) {
      claimed.add(hit);
      entry.paper = hit;
    } else {
      missing.push(entry);
    }
  });

  // Pull the missing papers from CrossRef.
  for (const entry of missing) {
    const doi = entry.doi || entry.lookupDOI;
    if (!doi) {
      console.error(`  #${entry.num}: no DOI available, skipping\n      ${entry.title}`);
      continue;
    }
    console.log(`  fetching #${entry.num} ${doi}`);
    const record = recordFromCrossRef(await crossref(doi), entry.role);
    console.log(`    + ${record.title.slice(0, 72)}`);
    console.log(`      ${record.journal} ${record.volume}, ${record.pages} (${record['publication-date']})`);
    data.push(record);
    entry.paper = record;
  }

  // The CV list is authoritative on author role.
  let roleFixes = 0;
  cv.forEach(entry => {
    if (entry.paper && entry.paper.role !== entry.role) {
      console.log(`  role: ${entry.paper.id || '(new)'} ${entry.paper.role} -> ${entry.role}` +
                  `  ${entry.paper.title.slice(0, 56)}`);
      entry.paper.role = entry.role;
      roleFixes += 1;
    }
  });

  // Renumber into the CV's own order.
  cv.forEach(entry => {
    if (!entry.paper) return;
    const next = `J.${entry.num}`;
    if (entry.paper.id === next) return;
    if (entry.paper.id && !entry.paper['legacy-id']) {
      entry.paper['legacy-id'] = entry.paper.id;
    }
    entry.paper.id = next;
  });

  const orphans = data.filter(p => !claimed.has(p) && !cv.some(e => e.paper === p));
  if (orphans.length) {
    console.log(`\n  ${orphans.length} site paper(s) not in the CV list:`);
    orphans.forEach(p => console.log(`    ${p.id} ${p.title.slice(0, 70)}`));
  }

  // Write out in CV order so the file reads like the CV.
  const ordered = cv.filter(e => e.paper).map(e => e.paper).concat(orphans);
  const leads = ordered.filter(p => p.role === 'lead').length;
  console.log(`\n${ordered.length} papers — ${leads} first/corresponding author, ` +
              `${ordered.length - leads} co-author. ${missing.length} added, ${roleFixes} role fix(es).`);

  if (DRY_RUN) { console.log('Dry run — nothing written.'); return; }
  fs.writeFileSync(DATA, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${path.relative(ROOT, DATA)}.`);
  console.log('Now run: node tools/build-offline-bundle.js');
}

main().catch(err => { console.error(err); process.exit(1); });
