/*
  Site configuration for the SAIL@HKU website (Prof. Jiaji Wang).

  Everything that is specific to the group lives in this one file: name,
  titles, contact details, navigation, sidebar profile links and research
  interest tags.  Edit here rather than hunting through the HTML.

  Sections
  --------
  - `Website`            site name, logo, copyright, last-updated stamp
  - `Research`           principal investigator details and profile IDs
  - `ResearchInterests`  keywords rendered as tags in the sidebar
  - `Navigation`         header menu items (`display: false` hides one)
  - `Sidebar`            profile card shown on every page
  - `Footer`             footer links
  - `Pages`              mapping of routes to Markdown sources in `pages/`
*/

window.siteConfig = {
  Website: {
    name: 'SAIL@HKU',
    logo: 'assets/images/logo.svg',
    logoName: 'Structural Artificial Intelligence Laboratory at HKU',
    logoIcon: 'assets/images/logo-icon.svg',
    favicon: 'assets/images/logo-icon.svg',
    copyright: '© 2026 Jiaji Wang | Department of Civil Engineering, The University of Hong Kong',
    lastUpdated: 'August 2026'
  },

  Research: {
    name: 'Prof. Jiaji WANG',
    chineseName: '汪家继',
    titles: 'BEng, PhD',
    photo: 'assets/images/jiaji_wang_photo.jpg',
    sublines: [
      {
        text: 'Assistant Professor, Department of Civil Engineering, The University of Hong Kong',
        url: 'https://www.civil.hku.hk/pp-wangjj.html'
      },
      {
        text: 'Director and Treasurer of Greater China Section, American Society of Civil Engineers',
        url: 'https://www.asce.org/'
      }
    ],
    // Written with "[at]" rather than "@" throughout the site so address
    // harvesters cannot lift it straight out of the markup.  No telephone
    // number is published.
    email: 'cewang[at]hku.hk',
    address: 'Room 6-04, Haking Wong Building, The University of Hong Kong, Pokfulam, Hong Kong SAR, China',
    googleScholar: 'https://scholar.google.com/citations?user=ejxKwgkAAAAJ',
    researchgate: 'https://www.researchgate.net/profile/Wang-Jiaji',
    github: 'https://github.com/wangjiajiTHU',
    linkedin: 'https://www.linkedin.com/in/jiaji-wang-a0a437256/',
    scholarsHub: 'https://hub.hku.hk/cris/rp/rp03096'
  },

  /**
   * Sidebar research-interest tags.  Keep these short — they render as
   * pills, not sentences.  The longer prose version lives in the Bio on
   * the home page and in `pages/about.md`.
   */
  ResearchInterests: [
    'Physics-informed Machine Learning',
    'Neural Operators',
    'Computational Mechanics',
    'Digital Twin',
    'Embodied AI & Robotics',
    'Structural Health Monitoring',
    'Steel-Concrete Composite',
    'Modular Construction',
    'Nonlinear FEM',
    'Constitutive Models',
    'Seismic Isolation'
  ],

  Navigation: [
    { label: 'Home', url: 'index.html', display: true },
    { label: 'Biography', url: 'about.html', display: true },
    { label: 'Research', url: 'research.html', display: true },
    { label: 'Publications', url: 'publications.html', display: true },
    { label: 'Team', url: 'team.html', display: true },
    { label: 'Positions', url: 'positions.html', display: true },
    { label: 'Contact', url: 'contact.html', display: true }
  ],

  Sidebar: {
    photo: 'assets/images/jiaji_wang_photo.jpg',
    photoAlt: 'Prof. Jiaji Wang',
    name: 'Prof. Jiaji WANG',
    credentials: 'BEng, PhD',
    roles: [
      {
        text: 'Assistant Professor, Department of Civil Engineering, HKU',
        url: 'https://www.civil.hku.hk/pp-wangjj.html'
      },
      {
        text: 'Director and Treasurer of Greater China Section, ASCE',
        url: 'https://www.asce.org/'
      }
    ],
    contact: {
      email: 'cewang[at]hku.hk'
    },
    profiles: [
      {
        name: 'Google Scholar',
        icon: 'assets/images/icon-google-scholar.png',
        url: 'https://scholar.google.com/citations?user=ejxKwgkAAAAJ',
        text: 'Google Scholar'
      },
      {
        name: 'ResearchGate',
        icon: 'assets/images/icon-researchgate.png',
        url: 'https://www.researchgate.net/profile/Wang-Jiaji',
        text: 'ResearchGate'
      },
      {
        name: 'HKU Scholars Hub',
        icon: 'assets/images/icon-scopus.png',
        url: 'https://hub.hku.hk/cris/rp/rp03096',
        text: 'HKU Scholars Hub'
      },
      {
        name: 'GitHub',
        icon: 'assets/images/icon-orcid.png',
        url: 'https://github.com/wangjiajiTHU',
        text: 'GitHub'
      }
    ]
  },

  Footer: {
    links: [
      { label: 'Home', url: 'index.html', external: false },
      { label: 'Biography', url: 'about.html', external: false },
      { label: 'Publications', url: 'publications.html', external: false },
      { label: 'Contact', url: 'contact.html', external: false },
      {
        label: 'Google Scholar',
        url: 'https://scholar.google.com/citations?user=ejxKwgkAAAAJ',
        external: true
      },
      {
        label: 'ResearchGate',
        url: 'https://www.researchgate.net/profile/Wang-Jiaji',
        external: true
      }
    ]
  },

  /**
   * Which Markdown file backs each page.  The mapping is documentation for
   * editors — the loading itself is wired up by body id in main.js, so
   * changing a path here also means changing the matching loadMarkdown()
   * call.  Contact and Publications are not listed: their content is markup
   * in contact.html and data in `data/*.json` respectively.
   */
  Pages: {
    Home: { display: 'yes', file: 'pages/welcome.md', bodyId: 'home-page' },
    About: { display: 'yes', file: 'pages/about.md', bodyId: 'about-page' },
    Research: { display: 'yes', file: 'pages/research.md', bodyId: 'research-page' },
    Team: { display: 'yes', file: 'pages/team.md', bodyId: 'team-page' },
    Positions: { display: 'yes', file: 'pages/job.md', bodyId: 'positions-page' }
  }
};
