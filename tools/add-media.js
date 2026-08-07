#!/usr/bin/env node
/*
 * Attach a media link (video, talk, code, dataset) to a publication.
 *
 * Publications carry an optional `media` array:
 *
 *   "media": [
 *     { "type": "video", "label": "Video explanation",
 *       "url": "https://www.bilibili.com/video/BV1FP411v7Yo" }
 *   ]
 *
 * `type` drives the icon shown next to the link; anything unrecognised falls
 * back to a generic link icon.  The field survives the other tools in this
 * folder, which only touch ids, roles and citations.
 *
 * Usage
 * -----
 *   node tools/add-media.js <paper-id|doi|title-fragment> <url> [options]
 *
 *     --type   video | talk | code | data | link   (default: video)
 *     --label  "Text shown for the link"          (default: from type)
 *     --remove Remove media entries matching the url instead of adding
 *
 * Examples
 * --------
 *   node tools/add-media.js J.43 https://www.bilibili.com/video/BV1FP411v7Yo
 *   node tools/add-media.js 10.1016/j.cma.2023.116184 https://youtu.be/x --type talk
 *   node tools/add-media.js EPINN https://github.com/user/repo --type code
 *
 * Afterwards rebuild the offline bundle:
 *   node tools/build-offline-bundle.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = [
  path.join(ROOT, 'data', 'Journal-Papers.json'),
  path.join(ROOT, 'data', 'Preprints.json'),
  path.join(ROOT, 'data', 'Book-Chapters.json')
];

const DEFAULT_LABELS = {
  video: 'Video',
  talk: 'Talk',
  code: 'Code',
  data: 'Data',
  link: 'Link'
};

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const [, , selector, url] = process.argv;
const type = flag('type', 'video');
const label = flag('label', DEFAULT_LABELS[type] || DEFAULT_LABELS.link);
const REMOVE = process.argv.includes('--remove');

if (!selector || !url) {
  console.error('Usage: node tools/add-media.js <paper-id|doi|title-fragment> <url> [--type video] [--label "..."] [--remove]');
  process.exit(1);
}

const normDOI = d =>
  (d || '').trim().toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/[.\s]+$/, '');

/** Find the paper a selector refers to: exact id, then DOI, then title text. */
function findPaper(papers, key) {
  const needle = key.trim().toLowerCase();
  return papers.find(p => (p.id || '').toLowerCase() === needle)
      || papers.find(p => normDOI(p.doi) === normDOI(needle))
      || papers.find(p => (p.title || '').toLowerCase().includes(needle));
}

function main() {
  let done = false;

  for (const file of SOURCES) {
    if (!fs.existsSync(file)) continue;
    const papers = JSON.parse(fs.readFileSync(file, 'utf8'));
    const paper = findPaper(papers, selector);
    if (!paper) continue;

    paper.media = (paper.media || []).filter(m => m.url !== url);
    if (!REMOVE) paper.media.push({ type, label, url });
    if (paper.media.length === 0) delete paper.media;

    fs.writeFileSync(file, JSON.stringify(papers, null, 2) + '\n', 'utf8');
    console.log(`${REMOVE ? 'Removed from' : 'Added to'} ${paper.id} in ${path.relative(ROOT, file)}:`);
    console.log(`  ${paper.title}`);
    (paper.media || []).forEach(m => console.log(`  [${m.type}] ${m.label} -> ${m.url}`));
    console.log('\nNow run: node tools/build-offline-bundle.js');
    done = true;
    break;
  }

  if (!done) {
    console.error(`No publication matched "${selector}".`);
    process.exit(1);
  }
}

main();
