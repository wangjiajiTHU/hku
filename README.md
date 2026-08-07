# SAIL@HKU — Structural Artificial Intelligence Laboratory

Website of **Prof. Jiaji Wang**, Assistant Professor, Department of Civil
Engineering, The University of Hong Kong.

Haking Wong 6-04, Pokfulam, Hong Kong SAR, China
Email: cewang[at]hku.hk · [HKU Scholars Hub](https://hub.hku.hk/cris/rp/rp03096)

---

## Editing the site

Almost everything is data or Markdown — you rarely need to touch the HTML.

| To change | Edit |
| --- | --- |
| Name, titles, contact, nav menu, sidebar links, research tags | `configuration.js` |
| Home page text | `pages/welcome.md` |
| Biography | `pages/about.md` |
| Research directions and grants | `pages/research.md` |
| Group members | `pages/team.md` |
| Open positions, scholarships and how to apply | `pages/job.md` |
| Contact details and map | `contact.html` |
| Journal papers | `data/Journal-Papers.json` |
| Preprints | `data/Preprints.json` |
| Book chapters | `data/Book-Chapters.json` |
| Grants | `data/Grants.json` |
| Search suggestions in the header | `data/search-index.json` |
| News items | `news/news-list.js` plus `news/<slug>/news.md` |
| Shared header, footer, sidebar, publication views | `elements/*.html` |

### After editing, rebuild the offline bundle

```sh
node tools/build-offline-bundle.js
```

The site fetches its fragments, Markdown and JSON at runtime. Chrome blocks
`fetch()` on `file://` URLs, so a copy opened by double-clicking `index.html`
would otherwise show *"Unable to load content"* on every page. The command above
regenerates `assets/js/offline-bundle.js`, which inlines those same files as a
fallback.

The loaders always try the network first, so when the site is served over HTTP
your edits appear on reload whether or not you rebuilt. The rebuild only matters
for opening the files directly from disk — but running it before you commit
keeps the two in step.

## Previewing locally

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. Serving over HTTP is the closest match to
GitHub Pages; opening the files directly also works thanks to the bundle above.

## Layout

```
index.html, about.html, ...   page shells — mostly empty containers
configuration.js              all group-specific settings
elements/                     header, footer, sidebar, publication views
pages/                        Markdown content
data/                         publications, grants, search index
news/                         news-list.js and one folder per article
assets/js/main.js             loading, nav, theme, search, news
assets/js/publications.js     publications page: search, filter, sort, paginate
assets/js/offline-bundle.js   generated — do not edit by hand
assets/css/style.css          all styling
tools/build-offline-bundle.js regenerates the offline bundle
tools/sync-publications.js    reconciles publications against the CV list
tools/renumber-publications.js renumbers the J series chronologically
```

## Credits

Built on the MIT-licensed template by
[Siwei Liu](https://github.com/zsulsw/zsulsw.github.io). See `LICENSE`.
