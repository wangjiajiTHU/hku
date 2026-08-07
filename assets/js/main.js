/*
 * Main JavaScript for the SAIL@HKU website (Prof. Jiaji Wang).
 *
 * Based on the MIT-licensed template by Siwei Liu
 * (https://github.com/zsulsw/zsulsw.github.io).
 *
 * This script dynamically loads header and footer templates,
 * implements the responsive navigation bar, controls the dark/light
 * theme switching, displays the list of publications from a JSON
 * source, and manages news content.
 */

// Fallback HTML fragments for header and footer.  If fetching the
// corresponding file fails (for example when viewing via the file://
// protocol), these strings will be used instead.  They contain a
// simplified version of the full header/footer defined in the
// elements folder.
// Updated fallback header to reflect new navigation without Teaching/Team links, include a home icon,
// search clear button and suggestions container.  This fallback markup is used when the
// site is viewed via the file protocol and external HTML fragments cannot be fetched.
const fallbackHeader = `
  <nav class="site-nav">
    <div class="nav-container">
      <a href="index.html" class="nav-brand">
        <img src="assets/images/logo-icon.svg" alt="SAIL@HKU logo" class="nav-logo">
        <span>SAIL@HKU</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
        <svg class="nav-toggle-icon hamburger-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
        <svg class="nav-toggle-icon close-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display: none;">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <ul class="nav-menu" id="navMenu">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">Biography</a></li>
        <li><a href="research.html">Research</a></li>
        <li><a href="publications.html">Publications</a></li>
        <li><a href="team.html">Team</a></li>
        <li><a href="positions.html">Positions</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
      <div class="nav-right">
        <div class="nav-search" id="navSearch">
          <input type="text" id="searchInput" placeholder="Search…" aria-label="Search site">
          <button id="searchClear" class="search-clear" aria-label="Clear search">&times;</button>
          <button id="searchButton" aria-label="Search">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
          </button>
        </div>
        <div class="suggestions-container" id="searchSuggestions">
          <div class="result-count" id="searchSuggestionsCount"></div>
          <ul id="searchSuggestionsList"></ul>
        </div>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light mode">
          <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>
            <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
          </svg>
          <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>
`;
// Fallback footer: used when elements/footer.html cannot be fetched (e.g. file protocol).
// This version only displays the useful links required by the user and the updated
// last‑updated date.  Links open in a new window for consistency with the online version.
const fallbackFooter = `
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-line">
        <p>© 2026 Jiaji Wang | Department of Civil Engineering, The University of Hong Kong</p>
      </div>
      <div class="footer-line">
        <p>
          Useful Links:
          <a href="https://www.civil.hku.hk/" target="_blank" rel="noopener">HKU Civil Engineering</a>
          <span>•</span>
          <a href="https://hub.hku.hk/cris/rp/rp03096" target="_blank" rel="noopener">HKU Scholars Hub</a>
          <span>•</span>
          <a href="https://gradsch.hku.hk/" target="_blank" rel="noopener">HKU Graduate School</a>
          <span>•</span>
          <a href="https://www.asce.org/" target="_blank" rel="noopener">ASCE</a>
        </p>
      </div>
      <div class="footer-line">
        <p>Last updated: August 2026</p>
      </div>
    </div>
  </footer>
  <style>
  /* Compact professional footer styling */
  .site-footer {
    background-color: var(--footer-bg);
    border-top: 1px solid var(--nav-border);
    margin-top: 4rem;
    padding: 1.5rem 0;
    color: var(--text-color);
    font-size: 0.9rem;
  }
  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    text-align: center;
  }
  .footer-line {
    margin: 0.25rem 0;
  }
  .footer-line p {
    margin: 0;
    color: var(--text-color);
    opacity: 0.85;
  }
  .footer-line a {
    color: var(--link-color);
    text-decoration: none;
    transition: var(--hover-transition);
  }
  .footer-line a:hover {
    text-decoration: underline;
  }
  .footer-line span {
    color: var(--text-color);
    opacity: 0.5;
    margin: 0 0.25rem;
  }
  @media (max-width: 768px) {
    .site-footer {
      padding: 1.25rem 0;
      font-size: 0.85rem;
    }
  }
  body.dark-mode .site-footer {
    background-color: var(--footer-bg);
    border-top-color: var(--nav-border);
  }
  </style>
`;

// Fallback markup for the left sidebar.  It mirrors the simplified sidebar used
// throughout the site: roles are listed with bullet points linking to external
// pages, location/university lines are removed, and only the email address is
// shown.  Social media icons are displayed horizontally using the downloaded
// PNG files for consistency with the desktop sidebar.  The citation metrics
// section has been removed to streamline the sidebar in offline mode.
const fallbackSidebar = `
  <div class="sidebar">
    <!-- Profile photo and name -->
    <div class="sidebar-logo">
      <img src="assets/images/jiaji_wang_photo.jpg" alt="Prof. Jiaji Wang">
    </div>
    <div class="sidebar-info">
      <h3>Dr. Jiaji&nbsp;WANG</h3>
      <p class="sidebar-cred">BEng, PhD</p>
    </div>
    <!-- Roles / positions -->
    <div class="sidebar-roles">
      <ul>
        <li><a href="https://www.civil.hku.hk/pp-wangjj.html" target="_blank" rel="noopener">Assistant Professor, Department of Civil Engineering, HKU</a></li>
        <li><a href="https://www.asce.org/" target="_blank" rel="noopener">Director and Treasurer of Greater China Section, ASCE</a></li>
      </ul>
    </div>
    <!-- Contact and academic profile links -->
    <div class="sidebar-contact">
      <p>
        <svg class="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
        </svg>
        <span class="contact-email">cewang[at]hku.hk</span>
      </p>
      <p>
        <img src="assets/images/icon-google-scholar.png" alt="Google Scholar" class="sidebar-icon-img">
        <a href="https://scholar.google.com/citations?user=ejxKwgkAAAAJ" target="_blank" rel="noopener">Google Scholar</a>
      </p>
      <p>
        <img src="assets/images/icon-researchgate.png" alt="ResearchGate" class="sidebar-icon-img">
        <a href="https://www.researchgate.net/profile/Wang-Jiaji" target="_blank" rel="noopener">ResearchGate</a>
      </p>
      <p>
        <img src="assets/images/icon-scopus.png" alt="HKU Scholars Hub" class="sidebar-icon-img">
        <a href="https://hub.hku.hk/cris/rp/rp03096" target="_blank" rel="noopener">HKU Scholars Hub</a>
      </p>
      <p>
        <img src="assets/images/icon-orcid.png" alt="GitHub" class="sidebar-icon-img">
        <a href="https://github.com/wangjiajiTHU" target="_blank" rel="noopener">GitHub</a>
      </p>
    </div>
    <!-- Research interests tags -->
    <div class="research-tags-widget">
      <h4 class="tags-title">RESEARCH INTERESTS</h4>
      <div class="tags-container" id="researchTagsContainer">
        <!-- Tags will be injected via JavaScript -->
      </div>
    </div>
  </div>
`;

// Simple Markdown parser and helper functions
//
// The website uses a lightweight Markdown dialect for pages (e.g. about.md)
// and news articles (news/<slug>/news.md).  Because external libraries
// cannot be loaded when browsing via the file:// protocol, we implement a
// minimal parser here.  It supports headings (levels 1–6), bold/italic
// emphasis, images, links and unordered lists.  Additional Markdown
// constructs can be added as needed.  The parser first converts
// inline elements using regular expressions, then processes block
// elements such as lists and paragraphs.

/**
 * Convert a Markdown string into HTML.  This function performs a series
 * of regex replacements to transform Markdown syntax into its HTML
 * equivalent.  It is intentionally simple and should be extended
 * cautiously to avoid unintended parsing of code blocks or advanced
 * notation.
 *
 * @param {string} md The raw Markdown content
 * @returns {string} Sanitised HTML
 */
function markdownToHTML(md) {
  // Normalise line endings
  let html = md.replace(/\r\n/g, '\n');
  // Escape angle brackets to prevent injection of unwanted HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Images: ![alt](src)
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1">');
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Headings: ###### through #
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Unordered list items: lines starting with - or *
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  // Now group consecutive <li> items into <ul>
  html = groupListItems(html);
  // Split on blank lines to create paragraphs
  html = html.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // If the block already starts with a block-level tag (<h, <ul, <img, <p>)
    if (/^<\s*(h[1-6]|ul|img|p|table|blockquote)/i.test(trimmed)) {
      return trimmed;
    }
    // Otherwise wrap in a paragraph and replace remaining single newlines with <br>
    return '<p>' + trimmed.replace(/\n+/g, '<br>') + '</p>';
  }).join('\n');
  return html;
}

/**
 * Helper to group consecutive list items into unordered lists.  It
 * scans the HTML string and wraps contiguous <li> elements with
 * <ul>..</ul>.  This is necessary because the simple Markdown
 * replacement above emits <li> tags without container lists.
 *
 * @param {string} html The HTML content containing <li> elements
 * @returns {string} The HTML with grouped lists
 */
function groupListItems(html) {
  const lines = html.split(/\n/);
  const out = [];
  let inList = false;
  lines.forEach(line => {
    if (line.trim().startsWith('<li>')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(line.trim());
    } else {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(line);
    }
  });
  if (inList) out.push('</ul>');
  return out.join('\n');
}

// -----------------------------------------------------------------------------
// Site file loading
//
// Every fragment, Markdown page and JSON data file is fetched at runtime.  That
// works over http(s), but Chrome rejects fetch() on file:// URLs outright, so a
// copy of the site opened straight from disk would show nothing at all.
//
// fetchSiteFile() therefore tries the network first and, when that fails, falls
// back to window.offlineBundle — the inlined copies produced by
// `node tools/build-offline-bundle.js`.  Network-first means edits to
// pages/*.md or data/*.json appear immediately when served over HTTP; the
// bundle only ever stands in when fetching is impossible.

/**
 * Resolve a site-relative path into a URL the current page can fetch.
 *
 * @param {string} path Path relative to the site root, e.g. "pages/about.md"
 * @returns {string} An absolute or page-relative URL
 */
function resolveSiteURL(path) {
  if (/^(https?:|file:|\/)/.test(path)) return path;
  const current = window.location.pathname;
  const base = current.substring(0, current.lastIndexOf('/') + 1);
  const url = base + path;
  // Under file:// the pathname alone is not a fetchable URL.
  if (window.location.protocol === 'file:' && !url.startsWith('file:')) {
    return 'file://' + url;
  }
  return url;
}

/**
 * Fetch a site file as text, falling back to the offline bundle.
 *
 * @param {string} path Path relative to the site root
 * @returns {Promise<string>} The file contents
 */
function fetchSiteFile(path) {
  const bundled = window.offlineBundle && window.offlineBundle[path];
  // Under file:// the fetch can never succeed, and each attempt logs a browser
  // error that looks like a real fault.  Go straight to the bundle instead.
  if (window.location.protocol === 'file:' && typeof bundled === 'string') {
    return Promise.resolve(bundled);
  }
  // 'no-cache' revalidates rather than re-downloads, so edited content shows up
  // on reload without paying for the full file every time.
  return fetch(resolveSiteURL(path), { cache: 'no-cache' })
    .then(resp => {
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      return resp.text();
    })
    .catch(err => {
      if (typeof bundled === 'string') return bundled;
      throw err;
    });
}

/**
 * Fetch a site file and parse it as JSON, falling back to the offline bundle.
 *
 * @param {string} path Path relative to the site root
 * @returns {Promise<*>} The parsed JSON
 */
function fetchSiteJSON(path) {
  return fetchSiteFile(path).then(text => JSON.parse(text));
}

/**
 * Load a Markdown file and insert its converted HTML into a target
 * container.  This helper is used by about.html to display its content and
 * can be reused for other pages.  If the file cannot be read at all, an
 * error message is displayed instead.
 *
 * @param {string} path Relative path to the Markdown file
 * @param {string} containerId ID of the element where the HTML will be injected
 */
function loadMarkdown(path, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return Promise.resolve(null);
  return fetchSiteFile(path)
    .then(md => {
      container.innerHTML = markdownToHTML(md);
      // Add class to Research Interests list for styling
      const headings = container.querySelectorAll('h2');
      headings.forEach(h2 => {
        if (h2.textContent.trim() === 'Research Interests') {
          const nextUl = h2.nextElementSibling;
          if (nextUl && nextUl.tagName === 'UL') {
            nextUl.classList.add('research-interests-list');
          }
        }
      });
      
      // Handle Publications section - convert escaped HTML divs back to real HTML
      // First try to find paragraphs containing the escaped div
      const paragraphs = container.querySelectorAll('p');
      paragraphs.forEach(p => {
        const text = p.innerHTML;
        // Check if this paragraph contains an escaped div with id="publicationsList"
        // Handle both regular quotes and HTML entity quotes
        if (text.includes('publicationsList')) {
          // Check various escape patterns
          const patterns = [
            /&lt;div\s+id="publicationsList"&gt;&lt;\/div&gt;/gi,
            /&lt;div\s+id=&quot;publicationsList&quot;&gt;&lt;\/div&gt;/gi,
            /&lt;div\s+id='publicationsList'&gt;&lt;\/div&gt;/gi
          ];
          
          let found = false;
          patterns.forEach(pattern => {
            if (pattern.test(text)) {
              found = true;
            }
          });
          
          if (found) {
            // Replace the paragraph with the actual div
            const div = document.createElement('div');
            div.id = 'publicationsList';
            p.parentNode.replaceChild(div, p);
          }
        }
      });
      
      // Also check if div is already there (in case markdown parser preserved it somehow)
      let pubContainer = container.querySelector('#publicationsList');
      if (!pubContainer) {
        // If still not found, look for the Publications heading and insert div after it
        // Also remove the Publications heading since we'll generate it dynamically
        const headings = container.querySelectorAll('h2');
        headings.forEach(h2 => {
          if (h2.textContent.trim() === 'Publications') {
            const div = document.createElement('div');
            div.id = 'publicationsList';
            // Remove the heading and insert div in its place
            h2.parentNode.replaceChild(div, h2);
          }
        });
      }
      
      return container;
    })
    .catch(err => {
      console.error('Failed to load Markdown', err);
      container.innerHTML = '<p>Unable to load content. Please make sure the Markdown file exists.</p>';
      return container;
    });
}

// -----------------------------------------------------------------------------
// Search index loading
//
// The navigation search bar can display live suggestions based on a
// precomputed search index.  This index is stored either in the global
// variable `window.searchIndex` or in the file `data/search-index.json`.  To
// avoid repeatedly fetching the same file, the index is cached in the
// `searchData` array once loaded.  Calling `loadSearchIndex()` returns a
// promise that resolves with the array of entries.  Each entry should have
// `title`, `url` and `desc` fields as defined in data/search-index.json.

let searchData = [];

function loadSearchIndex() {
  // If we already loaded the data, return it immediately
  if (searchData.length > 0) {
    return Promise.resolve(searchData);
  }
  // If a global searchIndex array has been defined, use it
  if (Array.isArray(window.searchIndex)) {
    searchData = window.searchIndex;
    return Promise.resolve(searchData);
  }
  // Otherwise read the JSON file from the data directory, falling back to the
  // offline bundle when fetching is unavailable.
  return fetchSiteJSON('data/search-index.json')
    .then(data => {
      if (Array.isArray(data)) {
        searchData = data;
      }
      return searchData;
    })
    .catch(err => {
      console.error('Failed to load search index', err);
      return [];
    });
}

// -----------------------------------------------------------------------------
// News list page
//
// The news list page (news.html) displays all news items and provides search
// and sorting controls.  The list is built from the global `window.newsList`
// defined in news/news-list.js.  Users can filter the list by typing into
// the search box (matching titles and summaries) and sort by newest or
// oldest.  The filtered/sorted results are rendered in the element with
// id="allNews".

function initNewsPage() {
  const container = document.getElementById('allNews');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('newsSort');
  if (!container || !searchInput || !sortSelect || !Array.isArray(window.newsList)) return;
  let data = window.newsList.slice();
  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const sortOrder = sortSelect.value;
    let filtered = data;
    if (q) {
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q))
      );
    }
    filtered = filtered.slice();
    // Sort by slug (YYYYMMDD), descending for newest first, ascending for oldest
    filtered.sort((a, b) => {
      return sortOrder === 'newest' ? b.slug.localeCompare(a.slug) : a.slug.localeCompare(b.slug);
    });
    // Clear existing
    container.innerHTML = '';
    if (filtered.length === 0) {
      container.textContent = 'No news found.';
      return;
    }
    // Render each news item
    filtered.forEach(item => {
      const article = document.createElement('article');
      article.className = 'news-item';
      const thumb = document.createElement('img');
      thumb.src = item.image;
      thumb.alt = item.title;
      thumb.className = 'news-thumb';
      article.appendChild(thumb);
      const info = document.createElement('div');
      info.className = 'news-info';
      const titleEl = document.createElement('h3');
      const link = document.createElement('a');
      link.href = `news-post.html?slug=${encodeURIComponent(item.slug)}`;
      link.textContent = item.title;
      titleEl.appendChild(link);
      info.appendChild(titleEl);
      const dateEl = document.createElement('p');
      dateEl.className = 'news-date';
      dateEl.textContent = item.date;
      info.appendChild(dateEl);
      const summaryEl = document.createElement('p');
      summaryEl.className = 'news-summary';
      summaryEl.textContent = item.summary;
      info.appendChild(summaryEl);
      article.appendChild(info);
      container.appendChild(article);
    });
  }
  // Bind events
  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);
  // Initial render
  render();
}

// Load an external HTML fragment into a target element and run a callback after
// insertion.  Falls back to the offline bundle, then to the hardcoded fallback
// markup below for the three fragments that have one.
function loadElement(targetId, path, callback) {
  fetchSiteFile(path)
    .then(html => {
      const target = document.getElementById(targetId);
      if (target) {
        target.innerHTML = html;
        if (typeof callback === 'function') callback();
      }
    })
    .catch(err => {
      console.error(`Error loading ${path}:`, err);
      // Use fallback markup if available
      const target = document.getElementById(targetId);
      if (target) {
        if (targetId === 'header') {
          target.innerHTML = fallbackHeader;
          // After injecting fallback, initialise theme and nav
          if (typeof callback === 'function') callback();
        } else if (targetId === 'footer') {
          target.innerHTML = fallbackFooter;
        } else if (targetId === 'sidebar') {
          target.innerHTML = fallbackSidebar;
          // Ensure any provided callback executes even when using fallback sidebar
          if (typeof callback === 'function') callback();
        }
      }
    });
}

// Initialise dark/light theme behaviour
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  // Apply saved preference on load
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
  }
  // Helper to update which icon is visible
  function updateIcons() {
    const sun = toggle.querySelector('.sun-icon');
    const moon = toggle.querySelector('.moon-icon');
    const isDark = document.body.classList.contains('dark-mode');
    if (sun && moon) {
      sun.style.display = isDark ? 'inline' : 'none';
      moon.style.display = isDark ? 'none' : 'inline';
    }
  }
  // Set initial icons
  updateIcons();
  // Toggle theme on button click
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateIcons();
  });
}

// Generate navigation menu from configuration
function generateNavigation() {
  const navMenu = document.getElementById('navMenu');
  if (!navMenu) return;
  
  // Clear existing content
  navMenu.innerHTML = '';
  
  // Check if siteConfig exists
  if (typeof window.siteConfig !== 'undefined' && window.siteConfig.Navigation) {
    window.siteConfig.Navigation.forEach(item => {
      if (item.display) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.label;
        li.appendChild(a);
        navMenu.appendChild(li);
      }
    });
  } else {
    // Fallback navigation if config not loaded
    const fallbackNav = [
      { label: 'Home', url: 'index.html' },
      { label: 'Biography', url: 'about.html' },
      { label: 'Research', url: 'research.html' },
      { label: 'Team', url: 'team.html' },
      { label: 'Positions', url: 'positions.html' },
      { label: 'Publications', url: 'publications.html' },
      { label: 'Contact', url: 'contact.html' }
    ];
    fallbackNav.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.label;
      li.appendChild(a);
      navMenu.appendChild(li);
    });
  }
}

// Initialise responsive navigation toggle
function initNav() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (!navToggle || !navMenu) return;
  
  // Generate navigation from config
  generateNavigation();
  
  // Get hamburger and close icons
  const hamburgerIcon = navToggle.querySelector('.hamburger-icon');
  const closeIcon = navToggle.querySelector('.close-icon');
  
  // Function to update icon based on menu state
  function updateToggleIcon() {
    const isOpen = navMenu.classList.contains('open');
    if (hamburgerIcon && closeIcon) {
      if (isOpen) {
        hamburgerIcon.style.display = 'none';
        closeIcon.style.display = 'block';
      } else {
        hamburgerIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    }
  }
  
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    updateToggleIcon();
  });
  
  // Close menu when clicking a link (useful on mobile)
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      updateToggleIcon();
    });
  });
  
  // Close menu when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        navMenu.classList.contains('open') && 
        !navMenu.contains(e.target) && 
        !navToggle.contains(e.target)) {
      navMenu.classList.remove('open');
      updateToggleIcon();
    }
  });
  
  // Highlight active page
  highlightActivePage();
}

// Highlight the current page in navigation
function highlightActivePage() {
  const navLinks = document.querySelectorAll('.nav-menu a');
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop() || 'index.html';
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPath = link.getAttribute('href');
    
    // Handle special cases and direct matches
    if (linkPath === currentFile || 
        (currentFile === '' && linkPath === 'index.html') ||
        (currentFile === 'index.html' && linkPath === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Page transition effects - ultra fast and smooth
function initPageTransitions() {
  // Add fade-in effect to content on page load
  const content = document.querySelector('.content');
  if (content) {
    content.classList.add('page-transition');
    // Use requestAnimationFrame for smooth, immediate transition
    requestAnimationFrame(() => {
      content.classList.add('loaded');
    });
  }
  
  // Handle navigation link clicks with instant fade transitions
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey) {
      const href = link.getAttribute('href');
      // Only apply to internal navigation links (not external, mailto, etc.)
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
        e.preventDefault();
        
        // Add instant fade-out effect
        const content = document.querySelector('.content');
        if (content) {
          content.style.transition = 'opacity 0.05s ease-out, transform 0.05s ease-out';
          content.style.opacity = '0';
          content.style.transform = 'translateY(-4px)';
        }
        
        // Navigate immediately for ultra-fast feel
        setTimeout(() => {
          window.location.href = href;
        }, 30);
      }
    }
  });
}

// Initialise search bar interactions in the navigation bar.
function initSearchBar() {
  // Grab elements needed for the search bar
  const container = document.getElementById('navSearch');
  const input = document.getElementById('searchInput');
  const button = document.getElementById('searchButton');
  const clearBtn = document.getElementById('searchClear');
  const suggestionsBox = document.getElementById('searchSuggestions');
  const suggestionsCount = document.getElementById('searchSuggestionsCount');
  const suggestionsList = document.getElementById('searchSuggestionsList');
  if (!container || !input || !button || !clearBtn || !suggestionsBox || !suggestionsCount || !suggestionsList) return;

  // Navigate to publications.html with the search query
  function performSearch() {
    const q = input.value.trim();
    if (q) {
      window.location.href = `publications.html?search=${encodeURIComponent(q)}`;
    }
  }

  // Show or hide the clear button depending on input content
  function updateClearButton() {
    if (input.value.trim()) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }
  }

  // Hide suggestions dropdown
  function hideSuggestions() {
    suggestionsBox.style.display = 'none';
    suggestionsList.innerHTML = '';
    suggestionsCount.textContent = '';
  }

  // Generate suggestions based on current input
  function updateSuggestions() {
    const term = input.value.trim().toLowerCase();
    updateClearButton();
    if (!term) {
      hideSuggestions();
      return;
    }
    // Load search index once and then filter
    loadSearchIndex().then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        hideSuggestions();
        return;
      }
      const matches = data.filter(item => {
        return (item.title && item.title.toLowerCase().includes(term)) ||
               (item.desc && item.desc.toLowerCase().includes(term));
      }).slice(0, 6);
      if (matches.length === 0) {
        hideSuggestions();
        return;
      }
      // Populate suggestions list
      suggestionsList.innerHTML = '';
      matches.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        suggestionsList.appendChild(li);
      });
      suggestionsCount.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
      suggestionsBox.style.display = 'block';
    });
  }

  // Expand the search bar and focus input
  function expandSearch() {
    if (!container.classList.contains('active')) {
      container.classList.add('active');
      input.focus();
      // Hide logo on mobile when search is active
      if (window.innerWidth <= 768) {
        const navBrand = document.querySelector('.nav-brand');
        if (navBrand) {
          navBrand.style.display = 'none';
        }
      }
    }
  }
  
  // Collapse search and show logo again
  function collapseSearch() {
    if (container.classList.contains('active')) {
      container.classList.remove('active');
      // Show logo again on mobile when search is collapsed
      if (window.innerWidth <= 768) {
        const navBrand = document.querySelector('.nav-brand');
        if (navBrand) {
          navBrand.style.display = '';
        }
      }
    }
  }

  // Click on container or input expands search
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    expandSearch();
  });
  input.addEventListener('click', (e) => {
    e.stopPropagation();
    expandSearch();
  });

  // Update suggestions on input
  input.addEventListener('input', updateSuggestions);

  // Hide suggestions on blur
  input.addEventListener('blur', () => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      hideSuggestions();
    }, 150);
  });

  // Clear search when pressing the clear button
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    updateClearButton();
    hideSuggestions();
    input.focus();
    // Don't collapse, just clear the input
  });

  // Button click performs search if expanded and has query, otherwise expands
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (container.classList.contains('active')) {
      const q = input.value.trim();
      if (q) {
        performSearch();
      }
    } else {
      expandSearch();
    }
  });

  // Pressing Enter triggers search
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Clicking anywhere outside collapses the search if empty
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && container.classList.contains('active') && input.value.trim() === '') {
      collapseSearch();
    }
  });
  
  // Handle window resize to show/hide logo appropriately
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // On desktop, always show logo
      const navBrand = document.querySelector('.nav-brand');
      if (navBrand) {
        navBrand.style.display = '';
      }
    } else {
      // On mobile, hide logo if search is active
      if (container.classList.contains('active')) {
        const navBrand = document.querySelector('.nav-brand');
        if (navBrand) {
          navBrand.style.display = 'none';
        }
      }
    }
  });

  // Initialise clear button visibility
  updateClearButton();
  // Hide suggestions initially
  hideSuggestions();
}

// Initialize scroll-to-top button functionality
function initScrollToTop() {
  // Create the scroll-to-top button
  const scrollButton = document.createElement('button');
  scrollButton.className = 'scroll-to-top';
  scrollButton.setAttribute('aria-label', 'Scroll to top');
  scrollButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>
    </svg>
  `;
  
  // Add button to the page
  document.body.appendChild(scrollButton);
  
  // Get the navigation bar
  const navbar = document.querySelector('.site-nav');
  
  // Show/hide button based on scroll position and enhance navbar
  function handleScroll() {
    const scrollY = window.scrollY;
    
    // Handle scroll-to-top button visibility
    if (scrollY > 300) {
      scrollButton.classList.add('visible');
    } else {
      scrollButton.classList.remove('visible');
    }
    
    // Add visual feedback to navbar when scrolling
    if (navbar) {
      if (scrollY > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        navbar.style.backdropFilter = 'blur(15px)';
      } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        navbar.style.backdropFilter = 'blur(10px)';
      }
    }
  }
  
  // Smooth scroll to top
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  // Event listeners
  window.addEventListener('scroll', handleScroll);
  scrollButton.addEventListener('click', scrollToTop);
  
  // Initial check
  handleScroll();
}

// Initialise search results page: parse query and display results
function initSearchPage() {
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;
  const queryDisplay = document.getElementById('searchQueryDisplay');
  // Parse query string
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  if (queryDisplay) {
    queryDisplay.textContent = q;
  }
  const resultsCountEl = document.getElementById('searchResultsCount');
  if (!q) {
    if (resultsCountEl) resultsCountEl.textContent = '';
    resultsContainer.textContent = ' Please enter a search term.';
    return;
  }
  // Obtain the search index the same way the navigation bar does, so both
  // read from a single source (data/search-index.json).  A page may still
  // override it by defining window.searchIndex or by embedding the JSON in
  // a <script id="searchData" type="application/json"> tag, which is what
  // keeps the page working under the file:// protocol.
  const embedded = document.getElementById('searchData');
  if (!Array.isArray(window.searchIndex) && embedded) {
    try {
      window.searchIndex = JSON.parse(embedded.textContent);
    } catch (e) {
      console.error('Failed to parse search data', e);
    }
  }
  loadSearchIndex().then(data => renderSearchResults(data, q, resultsContainer, resultsCountEl));
}

/**
 * Render the matching entries of the search index into the results
 * container.  Split out of initSearchPage() so the index can be loaded
 * asynchronously.
 *
 * @param {Array} data Search index entries ({title, url, desc})
 * @param {string} q The raw query string
 * @param {HTMLElement} resultsContainer Element receiving the result list
 * @param {HTMLElement|null} resultsCountEl Element receiving the result count
 */
function renderSearchResults(data, q, resultsContainer, resultsCountEl) {
  const qlower = q.toLowerCase();
  const matched = data.filter(item => {
    return (item.title && item.title.toLowerCase().includes(qlower)) ||
           (item.desc && item.desc.toLowerCase().includes(qlower));
  });
  if (resultsCountEl) {
    resultsCountEl.textContent = ` – ${matched.length} result${matched.length === 1 ? '' : 's'} found`;
  }
  if (matched.length === 0) {
    resultsContainer.textContent = 'No results found.';
    return;
  }
  const list = document.createElement('ul');
  list.className = 'search-results-list';
  matched.forEach(item => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.url;
    link.textContent = item.title;
    li.appendChild(link);
    list.appendChild(li);
  });
  resultsContainer.appendChild(list);
}

// Fetch and display publications from JSON file (publications.html)
function loadPublications() {
  const listEl = document.getElementById('publicationsList');
  if (!listEl) return;
  // If publication data is available globally (decoded from base64), use it
  if (Array.isArray(window.publicationData)) {
    try {
      const data = window.publicationData.slice();
      data.sort((a, b) => {
        const numA = parseInt(String(a.id).match(/\d+/));
        const numB = parseInt(String(b.id).match(/\d+/));
        return numB - numA;
      });
      const fragment = document.createDocumentFragment();
      data.forEach(pub => {
        const li = document.createElement('li');
        li.textContent = pub.citation;
        fragment.appendChild(li);
      });
      listEl.appendChild(fragment);
      return;
    } catch (e) {
      console.error('Failed to process global publicationData', e);
    }
  }
  // Try to read publications from embedded JSON script first (offline friendly)
  const script = document.getElementById('pubData');
  if (script) {
    try {
      const data = JSON.parse(script.textContent);
      data.sort((a, b) => {
        const numA = parseInt(String(a.id).match(/\d+/));
        const numB = parseInt(String(b.id).match(/\d+/));
        return numB - numA;
      });
      const fragment = document.createDocumentFragment();
      data.forEach(pub => {
        const li = document.createElement('li');
        li.textContent = pub.citation;
        fragment.appendChild(li);
      });
      listEl.appendChild(fragment);
      return;
    } catch (e) {
      console.error('Failed to parse embedded publications data', e);
    }
  }
  // Fallback to fetch the JSON file (may not work offline but okay when served)
  let url;
  const rel = 'data/publications.json';
  if (/^(https?:|file:|\/)/.test(rel)) {
    url = rel;
  } else {
    const current = window.location.pathname;
    const base = current.substring(0, current.lastIndexOf('/') + 1);
    url = base + rel;
  }
  fetch(url)
    .then(resp => resp.json())
    .then(data => {
      data.sort((a, b) => {
        const numA = parseInt(String(a.id).match(/\d+/));
        const numB = parseInt(String(b.id).match(/\d+/));
        return numB - numA;
      });
      const fragment = document.createDocumentFragment();
      data.forEach(pub => {
        const li = document.createElement('li');
        li.textContent = pub.citation;
        fragment.appendChild(li);
      });
      listEl.appendChild(fragment);
    })
    .catch(err => {
      console.error('Error loading publications:', err);
      const msg = document.createElement('li');
      msg.textContent = 'Publications cannot be loaded offline due to browser restrictions. Please host the site via a web server to view the full list.';
      listEl.appendChild(msg);
    });
}

// -----------------------------------------------------------------------------
// News system
//
// The news system uses a global array `window.newsList` defined in
// news/news-list.js.  Each item contains: slug, date, title, summary and
// image path.  The functions below populate the latest news on the home
// page and load individual news posts.  A dedicated news post page
// (news-post.html) parses the slug from the query string and fetches the
// corresponding HTML file under the `news/<slug>/news.html` path.

/**
 * Render the most recent journal papers into the element with
 * id="recentPublications" on the home page.  The data comes from the same
 * `data/Journal-Papers.json` file that drives publications.html, so the home
 * page never has to be edited when a new paper is added.
 *
 * Entries carry an `id` of the form "JC.24"; the numeric part increases with
 * recency, so it breaks ties between papers published in the same year.
 *
 * @param {number} [count] How many papers to show
 */
function initRecentPublications(count = 5) {
  const container = document.getElementById('recentPublicationsList');
  if (!container) return;
  fetchSiteJSON('data/Journal-Papers.json')
    .then(papers => {
      if (!Array.isArray(papers) || papers.length === 0) throw new Error('no papers');
      const idNumber = p => {
        const m = String(p.id || '').match(/(\d+)\s*$/);
        return m ? parseInt(m[1], 10) : 0;
      };
      const recent = papers
        .slice()
        .sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0) ||
                        idNumber(b) - idNumber(a))
        .slice(0, count);
      const fragment = document.createDocumentFragment();
      recent.forEach(paper => {
        const li = document.createElement('li');
        const apa = document.createElement('div');
        apa.className = 'compact-paper-apa';
        // Emphasise the journal name inside the APA string, matching the
        // compact view on publications.html.
        let text = paper.APA || paper.title || '';
        if (paper.journal && text.includes(paper.journal)) {
          const parts = text.split(paper.journal);
          apa.appendChild(document.createTextNode(parts.shift()));
          const em = document.createElement('em');
          const strong = document.createElement('strong');
          strong.textContent = paper.journal;
          em.appendChild(strong);
          apa.appendChild(em);
          apa.appendChild(document.createTextNode(parts.join(paper.journal)));
        } else {
          apa.textContent = text;
        }
        if (paper.doi) {
          const link = document.createElement('a');
          link.href = paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`;
          link.target = '_blank';
          link.rel = 'noopener';
          link.className = 'compact-doi-link';
          link.textContent = '(DOI)';
          apa.appendChild(document.createTextNode(' '));
          apa.appendChild(link);
        }
        li.appendChild(apa);
        fragment.appendChild(li);
      });
      container.innerHTML = '';
      container.appendChild(fragment);
    })
    .catch(err => {
      console.error('Failed to load recent publications', err);
      container.innerHTML =
        '<li>Unable to load recent publications. See the ' +
        '<a href="publications.html">Publications</a> page.</li>';
    });
}

// Load latest news items into an element with id="latestNews".  This
// function should be called on the home page.
function initNewsList() {
  const container = document.getElementById('latestNews');
  if (!container || !Array.isArray(window.newsList)) return;
  // Sort news by slug (assuming YYYYMMDD) descending
  const sorted = window.newsList.slice().sort((a, b) => b.slug.localeCompare(a.slug));
  // Hide the whole section rather than leave an empty heading behind when
  // news/news-list.js has no entries yet.
  const section = container.closest('.home-section');
  if (sorted.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  const latest = sorted.slice(0, 3);
  latest.forEach(item => {
    const article = document.createElement('article');
    article.className = 'news-item';
    // image thumbnail
    const thumb = document.createElement('img');
    thumb.src = item.image;
    thumb.alt = item.title;
    thumb.className = 'news-thumb';
    article.appendChild(thumb);
    // content container
    const info = document.createElement('div');
    info.className = 'news-info';
    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = `news-post.html?slug=${encodeURIComponent(item.slug)}`;
    link.textContent = item.title;
    title.appendChild(link);
    info.appendChild(title);
    const date = document.createElement('p');
    date.className = 'news-date';
    date.textContent = item.date;
    info.appendChild(date);
    const summary = document.createElement('p');
    summary.className = 'news-summary';
    summary.textContent = item.summary;
    info.appendChild(summary);
    article.appendChild(info);
    container.appendChild(article);
  });
}

// Load a single news post into the element with id="newsContent".  The
// `slug` parameter is parsed from the query string of news-post.html.  This
// function fetches the HTML fragment located at `news/<slug>/news.html` and
// injects it into the page.  If the fetch fails (e.g., when opened via
// file://), a message is displayed instead.
function initNewsPost() {
  const container = document.getElementById('newsContent');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    container.innerHTML = '<p>No news specified.</p>';
    return;
  }
  // Build relative path to the news file.  We use Markdown (news.md)
  // instead of HTML so that the same content can be displayed via
  // file:// and HTTP protocols.  The Markdown will be parsed to
  // HTML using markdownToHTML() below.
  fetchSiteFile(`news/${slug}/news.md`)
    .then(md => {
      // Convert markdown to HTML
      let html = markdownToHTML(md);
      container.innerHTML = html;
      // Fix image paths: prefix relative sources with the slug directory
      const imgs = container.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src');
        if (!/^(https?:|file:|\/)/.test(src)) {
          img.setAttribute('src', `news/${slug}/` + src);
        }
      });
    })
    .catch(err => {
      console.error('Failed to load news', err);
      container.innerHTML = '<p>Unable to load this news article offline. Please host the site on a web server.</p>';
    });
}

// -----------------------------------------------------------------------------
// Publications page
//
// The publications page allows filtering and searching the list of
// publications.  Data is loaded from window.publications (defined in
// assets/js/publications.js).  The user can filter by type and search by
// keywords.  Results are sorted in descending order by year.
function initPublicationsPage() {
  const listEl = document.getElementById('publicationsList');
  const filterSelect = document.getElementById('pubTypeFilter');
  const searchInput = document.getElementById('pubSearch');
  const countEl = document.getElementById('pubCount');
  if (!listEl || !filterSelect || !searchInput || !countEl || !Array.isArray(window.publications)) return;
  const data = window.publications.slice();
  function render() {
    const type = filterSelect.value;
    const query = searchInput.value.trim().toLowerCase();
    let filtered = data;
    if (type !== 'All') {
      filtered = filtered.filter(p => p.type === type);
    }
    if (query) {
      filtered = filtered.filter(p => p.citation.toLowerCase().includes(query));
    }
    // Sort by year descending, fallback to id
    filtered.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return String(b.id).localeCompare(String(a.id));
    });
    countEl.textContent = `${filtered.length} publication${filtered.length === 1 ? '' : 's'} found`;
    // Clear existing list
    listEl.innerHTML = '';
    filtered.forEach(p => {
      const li = document.createElement('li');
      li.className = 'publication-item';
      let html = '';
      html += `<span class="pub-year">${p.year}</span> `;
      html += p.citation;
      if (p.doi) {
        html += ` DOI: <a href="https://doi.org/${p.doi}" target="_blank">${p.doi}</a>.`;
      }
      if (p.link) {
        html += ` <a href="${p.link}" target="_blank">Journal page</a>`;
      }
      li.innerHTML = html;
      listEl.appendChild(li);
    });
  }
  filterSelect.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  render();
}

// Handle mobile sidebar visibility
// Hide sidebar on mobile devices for all pages except home page
let mobileSidebarHandlerInitialized = false;
let resizeTimer = null;

function handleMobileSidebarVisibility() {
  const sidebar = document.getElementById('sidebar');
  const bodyId = document.body.getAttribute('id');
  
  if (!sidebar) return;
  
  // Check if device is mobile (typically <= 768px)
  function isMobileDevice() {
    return window.innerWidth <= 768;
  }
  
  // Function to show/hide sidebar based on device and page
  function updateSidebarVisibility() {
    const isMobile = isMobileDevice();
    const isHomePage = bodyId === 'home-page';
    
    if (isMobile && !isHomePage) {
      // Hide sidebar on mobile for non-home pages
      sidebar.style.display = 'none';
    } else {
      // Show sidebar on desktop or on home page (even mobile)
      sidebar.style.display = '';
    }
  }
  
  // Initial check
  updateSidebarVisibility();
  
  // Only add resize listener once to avoid duplicates
  if (!mobileSidebarHandlerInitialized) {
    mobileSidebarHandlerInitialized = true;
    // Update on window resize (handles orientation changes and window resizing)
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const sidebarEl = document.getElementById('sidebar');
        if (sidebarEl) {
          const currentBodyId = document.body.getAttribute('id');
          const isMobile = window.innerWidth <= 768;
          const isHomePage = currentBodyId === 'home-page';
          
          if (isMobile && !isHomePage) {
            sidebarEl.style.display = 'none';
          } else {
            sidebarEl.style.display = '';
          }
        }
      }, 100); // Debounce resize events
    });
  }
}

// Initialize research interest tags in sidebar
function initResearchTags() {
  // Research interest tags come from configuration.js so that the sidebar and
  // the Research page never drift apart.  The fallback keeps the sidebar
  // populated if configuration.js failed to load.
  const researchTags = (window.siteConfig && Array.isArray(window.siteConfig.ResearchInterests)
      && window.siteConfig.ResearchInterests.length)
    ? window.siteConfig.ResearchInterests
    : [
      'Physics-informed Machine Learning',
      'Neural Operators',
      'Computational Mechanics',
      'Digital Twin',
      'Structural Health Monitoring',
      'Steel-Concrete Composite'
    ];

  // Color palette for tags (professional academic colors)
  const tagColors = [
    '#1976d2', // Blue
    '#388e3c', // Green
    '#d32f2f', // Red
    '#7b1fa2', // Purple
    '#f57c00', // Orange
    '#0097a7', // Cyan
    '#5d4037', // Brown
    '#455a64', // Blue Grey
    '#c2185b', // Pink
    '#303f9f'  // Indigo
  ];

  // Create pairs of tags and colors, then shuffle them together
  const tagColorPairs = researchTags.map((tag, index) => ({
    tag: tag,
    color: tagColors[index % tagColors.length]
  }));

  // Randomize the order using Fisher-Yates shuffle algorithm
  for (let i = tagColorPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagColorPairs[i], tagColorPairs[j]] = [tagColorPairs[j], tagColorPairs[i]];
  }

  const container = document.getElementById('researchTagsContainer');
  if (!container) {
    console.log('Research tags container not found');
    return;
  }

  // Clear any existing content
  container.innerHTML = '';

    tagColorPairs.forEach((pair, index) => {
    const tagElement = document.createElement('span');
    tagElement.className = 'research-tag';
    tagElement.textContent = pair.tag;
    tagElement.style.setProperty('--tag-color', pair.color);
    tagElement.style.setProperty('--animation-delay', (index * 0.05) + 's');
    
    // Add click handler
    tagElement.addEventListener('click', function() {
      // Navigate to publications page with the tag as search query
      const searchUrl = 'publications.html?search=' + encodeURIComponent(pair.tag);
      window.location.href = searchUrl;
    });

    container.appendChild(tagElement);
  });
  
  console.log('Research tags initialized: ' + researchTags.length + ' tags');
}

// -----------------------------------------------------------------------------
// Google Scholar citation metrics
//
// This function fetches the citation statistics from Google Scholar and populates
// the table displayed in the sidebar.  The HTML structure is defined in
// elements/left-sidebar.html and fallbackSidebar above.  We attempt to fetch
// the user's Google Scholar profile via a CORS proxy.  If the fetch fails
// (for example due to network or CORS restrictions) we fall back to static
// numbers.  See README for details.
async function loadCitationMetrics() {
  const ids = {
    citationsAll: document.getElementById('citations-all'),
    citationsSince: document.getElementById('citations-since'),
    hindexAll: document.getElementById('hindex-all'),
    hindexSince: document.getElementById('hindex-since'),
    i10All: document.getElementById('i10-all'),
    i10Since: document.getElementById('i10-since'),
  };
  // Only proceed if the citation table exists on this page
  if (!ids.citationsAll) return;
  function setFallback() {
    // Shown when the live fetch fails.  Replace the dashes with the current
    // figures from the Google Scholar profile if you want static numbers.
    Object.values(ids).forEach(el => {
      if (el) el.textContent = '—';
    });
  }
  try {
    // Use a simple CORS proxy to bypass Google Scholar's origin restrictions
    const url = 'https://cors.isomorphic-git.org/https://scholar.google.com/citations?user=ejxKwgkAAAAJ&hl=EN';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Network response was not ok');
    const text = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const cells = doc.querySelectorAll('td.gsc_rsb_std');
    if (cells && cells.length >= 6) {
      ids.citationsAll.textContent = cells[0].textContent.trim();
      ids.hindexAll.textContent = cells[1].textContent.trim();
      ids.i10All.textContent = cells[2].textContent.trim();
      ids.citationsSince.textContent = cells[3].textContent.trim();
      ids.hindexSince.textContent = cells[4].textContent.trim();
      ids.i10Since.textContent = cells[5].textContent.trim();
    } else {
      setFallback();
    }
  } catch (err) {
    console.error('Failed to load Google Scholar metrics:', err);
    setFallback();
  }
}

// When DOM content is loaded, load header/footer and run page-specific functions
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page transitions first
  initPageTransitions();
  
  // Initialize scroll-to-top button
  initScrollToTop();
  
  // Load header and initialise theme, navigation and search after insertion
  loadElement('header', 'elements/header.html', () => {
    initTheme();
    initNav();
    initSearchBar();
  });
  // Load sidebar (left panel) if present in the DOM
  loadElement('sidebar', 'elements/left-sidebar.html', () => {
    // Once the sidebar has loaded (either via fetch or fallback), initialise research tags
    setTimeout(() => {
      initResearchTags();
      // Handle mobile sidebar visibility after sidebar is loaded
      handleMobileSidebarVisibility();
    }, 100);
  });
  // Load footer
  loadElement('footer', 'elements/footer.html');
  // Determine current page by checking body ID
  const bodyId = document.body.getAttribute('id');
  if (bodyId === 'home-page') {
    loadMarkdown('pages/welcome.md', 'welcomeContent');
    initRecentPublications();
    initNewsList();
  }
  if (bodyId === 'about-page') {
    loadMarkdown('pages/about.md', 'aboutContent');
  }
  if (bodyId === 'research-page') {
    loadMarkdown('pages/research.md', 'researchContent');
  }
  if (bodyId === 'team-page') {
    loadMarkdown('pages/team.md', 'teamContent');
  }
  if (bodyId === 'positions-page') {
    loadMarkdown('pages/job.md', 'jobContent');
  }
  if (bodyId === 'publications-page') {
    initPublicationsPage();
  }
  if (bodyId === 'news-post-page') {
    initNewsPost();
  }
  if (bodyId === 'search-page') {
    initSearchPage();
  }
  if (bodyId === 'news-page') {
    initNewsPage();
  }

  // When using the fallback sidebar there is no citation table to populate, so
  // we no longer schedule a call to loadCitationMetrics here.
  
  // Ensure mobile sidebar visibility is handled even if sidebar loads later
  // This is a fallback in case the sidebar callback doesn't fire
  setTimeout(() => {
    handleMobileSidebarVisibility();
  }, 500);
});