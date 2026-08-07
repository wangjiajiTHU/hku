#!/usr/bin/env node
/*
 * Mark corresponding and co-first authors in data/Journal-Papers.json.
 *
 * The CV list is the only record of who was corresponding author on each
 * paper — CrossRef does not carry it.  In that list a corresponding author is
 * written with a trailing asterisk ("Jiaji Wang*") and a co-first author is
 * annotated in words ("Jiaji Wang (co-first author)").
 *
 * This script lifts both out of the CV list and writes them into the data as
 * `corresponding-authors` and `co-first-authors` — arrays of names exactly as
 * they appear in each paper's own `authors` array — then rewrites the stored
 * APA citation so the markers are baked in:
 *
 *     *  corresponding author
 *     #  co-first author
 *
 * Baking the markers at build time rather than matching names in the browser
 * keeps the rendering trivial and means a name that cannot be resolved fails
 * loudly here instead of silently going unmarked on the site.
 *
 * Usage
 * -----
 *   node tools/mark-authors.js <cv-list.txt> [--dry-run]
 *
 * Then rebuild the offline bundle:
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
  console.error('Usage: node tools/mark-authors.js <cv-list.txt> [--dry-run]');
  process.exit(1);
}

const CORRESPONDING = '*';
const CO_FIRST = '#';

// The group leader, whose position on each paper is what the site badges.
// Spelling varies across publishers ("Jiaji Wang", "Jia-Ji Wang", "Jia J.
// Wang", and one with a Unicode hyphen), so names are compared with all
// separators stripped.  Other Wangs appear as co-authors and must not match.
const PI_KEYS = new Set(['jiajiwang', 'wangjiaji', 'jiajwang']);

const isPI = name => PI_KEYS.has(
  name.normalize('NFKC').toLowerCase().replace(/[‐-―\-.\s]/g, '')
);

/** Matches one "Family, I. I." author inside an APA author segment. */
const APA_AUTHOR = /[^,]+,\s*(?:[A-Z]\.\s*)+/g;

const normDOI = d =>
  (d || '').trim().toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/%28/g, '(').replace(/%29/g, ')')
    .replace(/[.\s]+$/, '');

const words = s => s.toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);

/**
 * Parse the CV list, returning one record per numbered line with the DOI and
 * the raw names carrying each marker.
 */
function parseCV(text) {
  const entries = [];
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    const m = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (!m) return;
    let rest = m[2];

    const dm = rest.match(/(https?:\/\/\S*doi\S+)/i);
    const doi = dm ? normDOI(dm[1]) : '';
    if (dm) rest = rest.slice(0, dm.index);

    // Only the author segment can carry markers; it ends at the year or, when
    // the year is absent, at the first sentence break.  Scanning the whole line
    // would pick up asterisks that belong to the title or journal.
    const yearAt = rest.search(/\(?\b(19|20)\d{2}\b\)?/);
    const segment = yearAt > 0 ? rest.slice(0, yearAt) : rest.split(/\.\s+/)[0];

    // "Jiaji Wang*", "Mo YL*", "Xin Nie*" — the name immediately before a "*".
    const starred = [];
    const starRe = /([A-Z][A-Za-z.\-]*(?:\s+[A-Z][A-Za-z.\-]*)*)\s*\*/g;
    let hit;
    while ((hit = starRe.exec(segment)) !== null) starred.push(hit[1].trim());

    // "Jiaji Wang (co-first author)"
    const coFirst = [];
    const coRe = /([A-Z][A-Za-z.\-]*(?:\s+[A-Z][A-Za-z.\-]*)*)\s*\(co-first[^)]*\)/gi;
    while ((hit = coRe.exec(segment)) !== null) coFirst.push(hit[1].trim());

    // Some CV lines carry no DOI, so keep a title to fall back on: the longest
    // sentence after the year, which outruns both the journal name and the
    // author list.
    const afterYear = rest.replace(/\(\d{4}\)\.?/, '|');
    const tail = afterYear.includes('|') ? afterYear.split('|')[1] : afterYear;
    const sentences = tail.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 15);
    const title = sentences.length
      ? sentences.reduce((a, b) => (b.length > a.length ? b : a))
      : tail.trim();

    entries.push({ num: Number(m[1]), doi, title, starred, coFirst, raw: trimmed });
  });
  return entries;
}

/** Dice coefficient over word bigrams, for matching CV titles to data titles. */
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
 * Resolve a name as written in the CV to an index in a paper's author list.
 *
 * The CV mixes conventions — "Jiaji Wang", "Y.L. Mo", "Mo YL", "Nakshatrala KB"
 * — so the surname may be the first or the last token.  Candidates are found by
 * surname, then narrowed by comparing initials.
 *
 * @param {string} rawName Name as it appears in the CV
 * @param {Array<string>} authors The paper's author list
 * @returns {number} Index into authors, or -1 when unresolved
 */
function resolveAuthor(rawName, authors) {
  const nameTokens = words(rawName);
  if (nameTokens.length === 0) return -1;

  const candidates = [];
  authors.forEach((author, index) => {
    const authorTokens = words(author);
    if (authorTokens.length === 0) return;
    const surname = authorTokens[authorTokens.length - 1];
    // Single letters are initials, not surnames; two-letter surnames such as
    // "Mo" and "Xu" are real and must still match.
    if (surname.length >= 2 && nameTokens.includes(surname)) candidates.push(index);
  });

  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) return -1;

  // Several authors share the surname: compare given-name initials.  The CV may
  // write them as separate tokens ("Y L Mo") or fused ("Mo YL"), so compare the
  // sets of letters rather than the sequence.
  const initialsOf = tokens => new Set(tokens.flatMap(t => t.split('')).slice(0, 0)
    .concat(tokens.map(t => t[0])));
  const surnameOf = tokens => tokens[tokens.length - 1];
  const cvSurname = candidates.length
    ? words(authors[candidates[0]])[words(authors[candidates[0]]).length - 1]
    : '';
  const cvInitials = new Set(
    nameTokens.filter(t => t !== cvSurname)
      .flatMap(t => (t.length <= 3 ? t.split('') : [t[0]]))
  );

  let best = -1;
  let bestScore = -1;
  candidates.forEach(index => {
    const tokens = words(authors[index]);
    const given = tokens.slice(0, -1);
    const authorInitials = initialsOf(given);
    let score = 0;
    authorInitials.forEach(i => { if (cvInitials.has(i)) score += 1; });
    if (score > bestScore) { bestScore = score; best = index; }
  });
  return best;
}

/**
 * Append a marker to the nth author of an APA citation.  Author order in the
 * citation follows the `authors` array, so the position is enough — no name
 * matching, and initials-only forms like "Mo, Y. L." cannot be mismatched.
 *
 * @param {string} apa The citation
 * @param {Map<number, string>} markers Author index -> marker characters
 * @returns {string} The citation with markers inserted
 */
function markCitation(apa, markers) {
  const yearAt = apa.search(/\s\(\d{4}\)\./);
  if (yearAt < 0) return apa;
  const segment = apa.slice(0, yearAt);
  const tail = apa.slice(yearAt);

  let index = 0;
  const marked = segment.replace(APA_AUTHOR, match => {
    const marker = markers.get(index);
    index += 1;
    if (!marker) return match;
    // Keep any trailing space outside the marker so spacing stays intact.
    const trailing = match.match(/\s*$/)[0];
    return match.trimEnd() + marker + trailing;
  });
  return marked + tail;
}

function main() {
  const cv = parseCV(fs.readFileSync(LIST, 'utf8'));
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

  const byDOI = new Map();
  data.forEach(p => { if (normDOI(p.doi)) byDOI.set(normDOI(p.doi), p); });

  let corrCount = 0;
  let coFirstCount = 0;
  const unresolved = [];

  // Clear any previous run so re-running is idempotent.
  data.forEach(p => {
    delete p['corresponding-authors'];
    delete p['co-first-authors'];
    p.APA = p.APA.replace(/\*/g, '').replace(/#/g, '');
  });

  cv.forEach(entry => {
    if (!entry.starred.length && !entry.coFirst.length) return;
    let paper = entry.doi ? byDOI.get(entry.doi) : null;
    if (!paper) {
      // No DOI in the CV line — fall back to matching on the title.
      const target = words(entry.title).join(' ');
      let bestScore = 0;
      data.forEach(candidate => {
        const score = similarity(target, words(candidate.title).join(' '));
        if (score > bestScore) { bestScore = score; paper = candidate; }
      });
      if (bestScore < 0.55) paper = null;
    }
    if (!paper) {
      unresolved.push(`#${entry.num}: no paper matched (doi ${entry.doi || 'none'})`);
      return;
    }

    const markers = new Map();
    const record = (rawNames, marker, field) => {
      const resolved = [];
      rawNames.forEach(rawName => {
        const index = resolveAuthor(rawName, paper.authors || []);
        if (index < 0) {
          unresolved.push(`#${entry.num} ${paper.id}: cannot place "${rawName}" ` +
                          `in [${(paper.authors || []).join(', ')}]`);
          return;
        }
        resolved.push(paper.authors[index]);
        markers.set(index, (markers.get(index) || '') + marker);
      });
      if (resolved.length) paper[field] = resolved;
      return resolved.length;
    };

    corrCount += record(entry.starred, CORRESPONDING, 'corresponding-authors');
    coFirstCount += record(entry.coFirst, CO_FIRST, 'co-first-authors');

    if (markers.size) paper.APA = markCitation(paper.APA, markers);
  });

  // Derive the PI's own position on each paper so the site can say exactly
  // "First Author" or "Corresponding Author" rather than lumping the two
  // together.  Both can be true at once.
  const positionCounts = {};
  const unpositioned = [];
  data.forEach(paper => {
    const authors = paper.authors || [];
    const first = authors.length > 0 && isPI(authors[0]);
    const coFirst = (paper['co-first-authors'] || []).some(isPI);
    const corresponding = (paper['corresponding-authors'] || []).some(isPI);

    const parts = [];
    if (first) parts.push('first');
    else if (coFirst) parts.push('co-first');
    if (corresponding) parts.push('corresponding');

    const position = parts.join('-');
    if (position) paper['author-position'] = position;
    else delete paper['author-position'];

    positionCounts[position || '(none)'] = (positionCounts[position || '(none)'] || 0) + 1;
    if (!position && paper.role === 'lead') unpositioned.push(paper);
  });

  console.log(`${corrCount} corresponding-author marking(s), ` +
              `${coFirstCount} co-first-author marking(s) across ${data.length} papers.`);
  console.log('\nAuthor position:');
  Object.entries(positionCounts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  if (unpositioned.length) {
    console.log(`\n${unpositioned.length} paper(s) marked "lead" in the CV but neither first`);
    console.log('nor starred as corresponding — the CV may be missing an asterisk:');
    unpositioned.forEach(p => {
      const at = (p.authors || []).findIndex(isPI);
      console.log(`  ${p.id}  position ${at + 1} of ${(p.authors || []).length}` +
                  `  ${p.title.slice(0, 58)}`);
    });
  }
  if (unresolved.length) {
    console.log(`\n${unresolved.length} unresolved:`);
    unresolved.forEach(u => console.log(`  ${u}`));
  }

  console.log('\nSample:');
  data.filter(p => p['corresponding-authors'] || p['co-first-authors'])
    .slice(0, 4)
    .forEach(p => {
      console.log(`  ${p.id}  corr=${JSON.stringify(p['corresponding-authors'] || [])}` +
                  ` cofirst=${JSON.stringify(p['co-first-authors'] || [])}`);
      console.log(`        ${p.APA.slice(0, 108)}`);
    });

  if (DRY_RUN) { console.log('\nDry run — nothing written.'); return; }
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, DATA)}.`);
  console.log('Now run: node tools/build-offline-bundle.js');
}

main();
