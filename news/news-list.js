/*
  News items for the SAIL@HKU website.

  Each entry drives both the "News" section on the home page (latest three)
  and the full listing on news.html.  Fields:

    slug    - folder name under news/, formatted YYYYMMDD-short-title.
              Sorting is done on this string, so the date prefix matters.
    date    - human-readable date shown under the headline
    title   - headline
    summary - one or two sentences shown in the list
    image   - thumbnail path, relative to the site root

  The article body lives in `news/<slug>/news.md` and is rendered by
  news-post.html.  Images referenced from inside that Markdown file are
  resolved relative to `news/<slug>/`.

  Example
  -------
    {
      slug: '20260315-ecs-grant',
      date: '15 March 2026',
      title: 'Group awarded RGC Early Career Scheme grant',
      summary: 'The project will combine full-scale testing with high-fidelity simulation of composite modular buildings.',
      image: 'assets/images/logo-icon.svg'
    }

  Add newest items anywhere in the array — they are sorted by slug on
  display.  An empty array simply hides the news sections.
*/

window.newsList = [];
