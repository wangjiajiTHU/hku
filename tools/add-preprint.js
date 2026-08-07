#!/usr/bin/env node
/*
 * Add a preprint to data/Preprints.json from its arXiv identifier or DOI.
 *
 * arXiv DOIs (10.48550/arXiv.NNNN.NNNNN) are frequently absent from CrossRef,
 * so metadata comes from the arXiv API instead, which always has it.  A
 * non-arXiv DOI falls back to CrossRef.
 *
 * Usage
 * -----
 *   node tools/add-preprint.js 2605.19533
 *   node tools/add-preprint.js https://doi.org/10.48550/arXiv.2605.19533
 *   node tools/add-preprint.js 10.1016/j.example.2026.12345
 *
 * Ids are assigned as "P.n" in date order, oldest first, matching how the
 * journal papers are numbered.  Re-running with an id already present updates
 * that entry rather than duplicating it.
 *
 * Afterwards rebuild the offline bundle:
 *   node tools/build-offline-bundle.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'Preprints.json');
const INPUT = process.argv[2];

if (!INPUT) {
  console.error('Usage: node tools/add-preprint.js <arxiv-id | doi | url>');
  process.exit(1);
}

/** Pull a bare arXiv id out of an id, DOI or URL; null if it is not an arXiv ref. */
function arxivId(input) {
  const cleaned = input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const m = cleaned.match(/(?:arxiv[.:/])?(\d{4}\.\d{4,5})(v\d+)?$/i);
  return m ? m[1] : null;
}

/** APA-style initials, matching the format used in Journal-Papers.json. */
function apaName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const family = parts.pop();
  const initials = parts.map(p => `${p[0]}.`).join(' ');
  return initials ? `${family}, ${initials}` : family;
}

function apaAuthors(names) {
  const formatted = names.map(apaName);
  if (formatted.length === 0) return '';
  if (formatted.length === 1) return formatted[0];
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

/** Fetch and parse an arXiv record. */
async function fromArxiv(id) {
  const resp = await fetch(`http://export.arxiv.org/api/query?id_list=${id}`);
  if (!resp.ok) throw new Error(`arXiv API ${resp.status}`);
  const xml = await resp.text();

  const pick = tag => {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  };
  const entry = xml.slice(xml.indexOf('<entry>'));
  if (!entry) throw new Error(`arXiv has no record for ${id}`);

  const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]
    .replace(/\s+/g, ' ').trim();
  const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [, ''])[1]
    .replace(/\s+/g, ' ').trim();
  const published = (entry.match(/<published>([\s\S]*?)<\/published>/) || [, ''])[1].trim();
  const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]
    .map(m => m[1].replace(/\s+/g, ' ').trim());
  const version = (entry.match(/<id>[\s\S]*?abs\/([\d.]+v\d+)<\/id>/) || [, id])[1];

  const year = published.slice(0, 4);
  const month = published.slice(5, 7);
  const doi = `10.48550/arXiv.${id}`;

  return {
    id: '',
    year,
    title,
    authors,
    repository: 'arXiv',
    'arxiv-id': version,
    abstract: summary,
    doi,
    link: `https://arxiv.org/abs/${id}`,
    APA: `${apaAuthors(authors)} (${year}). ${title}. arXiv:${id}.`,
    'publication-date': `${year}-${month}`,
    // Author role is not recorded on arXiv; set it by hand to "lead" or
    // "co-author" if the badge should appear.
    role: ''
  };
}

/** Fetch and parse a CrossRef record for a non-arXiv DOI. */
async function fromCrossRef(doi) {
  const resp = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'SAIL-HKU-site/1.0 (mailto:cewang@hku.hk)' }
  });
  if (!resp.ok) throw new Error(`CrossRef ${resp.status} for ${doi}`);
  const m = (await resp.json()).message;
  const authors = (m.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim());
  const parts = ((m.posted || m.published || {})['date-parts'] || [[]])[0];
  const [year, month] = parts;
  const repository = m['group-title'] || m.publisher || '';

  return {
    id: '',
    year: String(year || ''),
    title: (m.title || [''])[0],
    authors,
    repository,
    abstract: (m.abstract || '').replace(/<[^>]+>/g, '').trim(),
    doi: doi.toLowerCase(),
    link: `https://doi.org/${doi}`,
    APA: `${apaAuthors(authors)} (${year}). ${(m.title || [''])[0]}. ${repository}.`,
    'publication-date': month ? `${year}-${String(month).padStart(2, '0')}` : String(year || ''),
    role: ''
  };
}

async function main() {
  const arxiv = arxivId(INPUT);
  const record = arxiv
    ? await fromArxiv(arxiv)
    : await fromCrossRef(INPUT.replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''));

  const existing = fs.existsSync(DATA)
    ? JSON.parse(fs.readFileSync(DATA, 'utf8'))
    : [];

  const sameDOI = existing.findIndex(p => (p.doi || '').toLowerCase() === record.doi.toLowerCase());
  if (sameDOI >= 0) {
    console.log(`Updating existing entry ${existing[sameDOI].id}`);
    record.role = existing[sameDOI].role || record.role;
    existing[sameDOI] = record;
  } else {
    existing.push(record);
  }

  // Renumber P.1 upwards, oldest first.
  existing.sort((a, b) =>
    String(a['publication-date']).localeCompare(String(b['publication-date'])));
  existing.forEach((p, i) => { p.id = `P.${i + 1}`; });

  console.log(`\n  ${record.id || 'new'}  ${record.title}`);
  console.log(`  ${record.authors.join(', ')}`);
  console.log(`  ${record.repository} ${record['arxiv-id'] || ''} (${record['publication-date']})`);
  console.log(`  ${record.link}`);
  if (!record.role) {
    console.log('\n  NOTE: `role` is empty, so no author badge will show. Set it to');
    console.log('        "lead" or "co-author" in data/Preprints.json if you want one.');
  }

  fs.writeFileSync(DATA, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, DATA)} — ${existing.length} preprint(s).`);
  console.log('Now run: node tools/build-offline-bundle.js');
}

main().catch(err => { console.error(err.message); process.exit(1); });
