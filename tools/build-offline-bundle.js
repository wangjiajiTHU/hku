#!/usr/bin/env node
/*
 * Build the offline bundle: assets/js/offline-bundle.js
 *
 * Why this exists
 * ---------------
 * The site loads its HTML fragments, Markdown pages and publication data with
 * fetch().  That works over http(s), but Chrome refuses fetch() on file://
 * URLs outright ("URL scheme \"file\" is not supported"), so opening
 * index.html by double-clicking it leaves every page empty.
 *
 * This script inlines those same files into one JavaScript file that assigns
 * window.offlineBundle.  The loaders in main.js and publications.js still try
 * the network first — so editing a Markdown file and reloading from a server
 * shows the change immediately — and only fall back to the bundle when the
 * fetch fails.  The bundle is therefore a safety net, never the source of
 * truth.
 *
 * Usage
 * -----
 *   node tools/build-offline-bundle.js
 *
 * Re-run it after editing anything under pages/, elements/ or data/.  If you
 * only ever serve the site over HTTP (GitHub Pages included), the bundle is
 * harmless but unnecessary.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'assets', 'js', 'offline-bundle.js');

// Directories whose files are fetched at runtime, with the extensions that
// matter.  Anything else in these folders is ignored.
const SOURCES = [
  { dir: 'elements', extensions: ['.html'] },
  { dir: 'pages', extensions: ['.md'] },
  { dir: 'data', extensions: ['.json'] }
];

/**
 * Collect the files to inline, keyed by the site-relative path the runtime
 * asks for (e.g. "pages/about.md").  Always uses forward slashes so the keys
 * match the fetch paths on Windows too.
 *
 * @returns {Map<string, string>} path → file contents
 */
function collectFiles() {
  const files = new Map();
  SOURCES.forEach(({ dir, extensions }) => {
    const absolute = path.join(ROOT, dir);
    if (!fs.existsSync(absolute)) {
      console.warn(`  skipped ${dir}/ (not found)`);
      return;
    }
    fs.readdirSync(absolute)
      .filter(name => extensions.includes(path.extname(name).toLowerCase()))
      .sort()
      .forEach(name => {
        const key = `${dir}/${name}`;
        files.set(key, fs.readFileSync(path.join(absolute, name), 'utf8'));
      });
  });
  return files;
}

/**
 * Serialise the collected files.  JSON.stringify escapes quotes, backslashes
 * and newlines for us; the extra replacements guard against a literal
 * "</script>" or a U+2028/U+2029 line separator breaking the enclosing
 * <script> tag or the JavaScript parser.
 *
 * @param {Map<string, string>} files
 * @returns {string} The contents of offline-bundle.js
 */
function render(files) {
  const encode = value =>
    JSON.stringify(value)
      .replace(/<\/script/gi, '<\\/script')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

  const entries = [...files.entries()]
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${encode(value)}`)
    .join(',\n');

  return `/*
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Rebuild with: node tools/build-offline-bundle.js
 *
 * Inlined copies of the HTML fragments, Markdown pages and JSON data that the
 * site normally fetches.  Used only when fetch() is unavailable, which is what
 * happens when the site is opened directly from disk over the file:// protocol.
 * See tools/build-offline-bundle.js for the full explanation.
 *
 * Files inlined: ${files.size}
 */

window.offlineBundle = {
${entries}
};
`;
}

function main() {
  console.log('Building offline bundle...');
  const files = collectFiles();
  if (files.size === 0) {
    console.error('No files found to inline — is the working directory correct?');
    process.exitCode = 1;
    return;
  }
  const output = render(files);
  fs.writeFileSync(OUTPUT, output, 'utf8');
  files.forEach((value, key) => {
    console.log(`  ${key} (${(value.length / 1024).toFixed(1)} kB)`);
  });
  console.log(
    `\nWrote ${path.relative(ROOT, OUTPUT)} — ${files.size} files, ` +
    `${(output.length / 1024).toFixed(1)} kB total.`
  );
}

main();
