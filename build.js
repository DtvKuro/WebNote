'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      const langClass = language ? ` class="hljs language-${language}"` : ' class="hljs"';
      const displayLang = language ? language.toUpperCase() : '';
      const labelHtml = displayLang ? `<span class="code-lang-label">${displayLang}</span>` : '';
      const copyBtn = `<button class="code-copy-btn" aria-label="Copy code" title="Copy"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>`;
      return `<div class="code-block-wrapper">${labelHtml}${copyBtn}<pre><code${langClass}>${highlighted}</code></pre></div>\n`;
    },
  },
});

// --- fs helpers ---

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function slugify(filename) {
  return path.basename(filename, '.md');
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const MENU_BTN =
  '<button class="notes-menu-toggle" aria-label="Browse notes" aria-expanded="false">' +
  '<span></span><span></span><span></span>' +
  '</button>';

function applyLayout(layout, vars) {
  return layout
    .replace(/\{\{PAGE_TITLE\}\}/g, vars.pageTitle)
    .replace(/\{\{BASE_PATH\}\}/g, vars.basePath)
    .replace(/\{\{PAGE_TYPE\}\}/g, vars.pageType || '')
    .replace(/\{\{NOTES_MENU_TOGGLE\}\}/g, vars.notesMenuToggle || '')
    .replace(/\{\{NOTES_MENU\}\}/g, vars.notesMenu || '')
    .replace(/\{\{COPYRIGHT\}\}/g, vars.copyright || '')
    .replace(/\{\{SOCIAL_INSTAGRAM\}\}/g, vars.socialInstagram || '')
    .replace(/\{\{SOCIAL_GITHUB\}\}/g, vars.socialGithub || '')
    .replace(/\{\{SOCIAL_FACEBOOK\}\}/g, vars.socialFacebook || '')
    .replace(/\{\{CONTENT\}\}/g, vars.content);
}

function buildNotesMenu(notes, activeSlug, linkPrefix, previewMap) {
  linkPrefix = linkPrefix || '';
  previewMap = previewMap || {};

  const cats = new Map();
  for (const n of notes) {
    if (!cats.has(n.category)) cats.set(n.category, []);
    cats.get(n.category).push(n);
  }

  let html = '';
  for (const [cat, items] of cats) {
    const lis = items
      .map((n) => {
        const s = slugify(n.file);
        const active = s === activeSlug ? ' active' : '';
        const preview = previewMap[s] ? ` data-preview="${escapeAttr(previewMap[s])}"` : '';
        return `<li><a href="${linkPrefix}${s}.html" class="notes-menu-link${active}"${preview}>${n.title}</a></li>`;
      })
      .join('\n        ');

    html += `<div class="notes-menu-category">
  <h4 class="notes-menu-category-title">${cat}</h4>
  <ul class="notes-menu-list">
        ${lis}
  </ul>
</div>\n`;
  }
  return html;
}

// --- SVG logos per note title ---

const LOGOS = {
  'HTML': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><path fill="#E44D26" d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"/><path fill="#F16529" d="M64 116.8l36.378-10.086 8.559-95.878H64z"/><path fill="#EBEBEB" d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z"/><path fill="#fff" d="M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z"/></svg>`,

  'CSS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><path fill="#1572B6" d="M18.814 114.123L8.76 1.352h110.48l-10.064 112.754-45.243 12.543z"/><path fill="#33A9DC" d="M64.001 117.062l36.559-10.136 8.601-96.354h-45.16z"/><path fill="#fff" d="M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114H64.001z"/><path fill="#EBEBEB" d="M64.083 87.349l-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018z"/><path fill="#fff" d="M81.127 64.675l-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881z"/><path fill="#EBEBEB" d="M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711zm-.047 27.994v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711z"/></svg>`,

  'JavaScript': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#F7DF1E"/><text x="100" y="110" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="75" fill="#323330" text-anchor="end">JS</text></svg>`,

  'DOM': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#1e1b4b"/>
    <circle cx="20" cy="7" r="5" fill="#6366f1"/>
    <circle cx="8" cy="26" r="5" fill="#8b5cf6"/>
    <circle cx="20" cy="26" r="5" fill="#8b5cf6"/>
    <circle cx="32" cy="26" r="5" fill="#8b5cf6"/>
    <line x1="20" y1="12" x2="8" y2="21" stroke="#a78bfa" stroke-width="2"/>
    <line x1="20" y1="12" x2="20" y2="21" stroke="#a78bfa" stroke-width="2"/>
    <line x1="20" y1="12" x2="32" y2="21" stroke="#a78bfa" stroke-width="2"/>
    <circle cx="20" cy="7" r="2.5" fill="#fff" opacity="0.4"/>
  </svg>`,

  'Web Design': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="2" y="5" width="36" height="30" rx="3" fill="#0284c7"/>
    <rect x="2" y="5" width="36" height="8" rx="3" fill="#0369a1"/>
    <rect x="5" y="7" width="4" height="4" rx="2" fill="#f87171"/>
    <rect x="11" y="7" width="4" height="4" rx="2" fill="#fbbf24"/>
    <rect x="17" y="7" width="4" height="4" rx="2" fill="#4ade80"/>
    <rect x="5" y="17" width="12" height="14" rx="2" fill="#e0f2fe"/>
    <rect x="19" y="17" width="15" height="6" rx="2" fill="#bae6fd"/>
    <rect x="19" y="25" width="15" height="6" rx="2" fill="#bae6fd"/>
  </svg>`,

  'Node.js': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#333"/><path fill="#689f63" d="M64 95.4c-1.1 0-2.1-.3-3-.8L51.6 89c-1.4-.8-.7-1.1-.3-1.2 1.9-.7 2.3-.8 4.3-2 .2-.1.5-.1.7 0l7.1 4.2c.3.1.6.1.8 0l27.7-16c.3-.1.4-.4.4-.7V41.3c0-.3-.2-.6-.4-.7L64.2 24.6c-.3-.1-.6-.1-.8 0L35.7 40.6c-.3.1-.4.4-.4.7v32c0 .3.2.5.4.7l7.6 4.4c4.1 2.1 6.6-.4 6.6-2.8V44.1c0-.4.3-.7.7-.7h3c.4 0 .7.3.7.7v31.5c0 5.5-3 8.7-8.2 8.7-1.6 0-2.9 0-6.4-1.7l-7.3-4.2c-1.9-1.1-3-3.1-3-5.3v-32c0-2.2 1.1-4.2 3-5.3l27.7-16c1.8-1 4.2-1 6 0l27.7 16c1.9 1.1 3 3.1 3 5.3v32c0 2.2-1.1 4.2-3 5.3L67 94.6c-.9.5-1.9.8-3 .8z"/><path fill="#689f63" d="M72.4 73.1c-12.1 0-14.6-5.6-14.6-10.2 0-.4.3-.7.7-.7h3.1c.3 0 .6.2.7.6.5 3.2 1.8 4.8 8.1 4.8 5 0 7.1-1.1 7.1-3.8 0-1.5-.6-2.7-8.4-3.4-6.5-.7-10.5-2.1-10.5-7.2 0-4.7 4-7.6 10.7-7.6 7.5 0 11.2 2.6 11.7 8.2 0 .2-.1.4-.2.5-.1.1-.3.2-.5.2h-3.1c-.3 0-.6-.2-.7-.5-.7-3.3-2.6-4.4-7.2-4.4-5.3 0-5.9 1.8-5.9 3.2 0 1.7.7 2.1 8.1 3.1 7.3 1 10.8 2.4 10.8 7.5 0 5.1-4.3 8.1-11.7 8.1z"/></svg>`,

  'Express': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#f0f0f0"/><path d="M126.67 98.44c-4.56 1.16-7.38.05-9.91-3.75-5.68-8.51-11.95-16.63-18-24.9-.78-1.07-1.59-2.12-2.6-3.45C89 76 81.85 85.2 75.14 94.77c-2.4 3.42-4.92 4.91-9.22 3.71l26.5-33.63-25.34-32.05c4.45-1.03 7.26-.16 9.81 3.61 5.67 8.39 11.85 16.43 17.93 24.52.56.74 1.13 1.48 1.9 2.48 6.49-8.78 12.74-17.2 19.28-25.88 2.34-3.11 5-4.46 9.08-3.22L100.3 62.1l26.37 36.34z"/><path d="M1.33 61.74c.72-3.61 1.2-7.29 2.2-10.83 6-21.43 30.6-30.34 47.5-17.06C60.93 42.08 64 54.83 63.33 69H5.6c-.91 28.68 17.5 44.59 43.35 32.85 7.55-3.42 11.5-10.2 13.22-18.14.55-2.57 1.66-3.11 4.07-2.35-.63 5.72-1.81 11.25-4.86 16.2-5.97 9.68-14.78 14.38-25.88 14.84-14.63.6-26.27-6.4-31.42-19.27-2.72-6.77-3.43-13.88-3.12-21.15.03-.69.36-1.39.37-2.24zM5.68 64.66h53.22c-.35-18.34-10.69-31.27-24.81-31.4C18.39 33.12 6.62 46.32 5.68 64.66z"/></svg>`,

  'EJS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#B4CA65"/><text x="64" y="78" font-family="Arial,sans-serif" font-weight="bold" font-size="48" fill="#fff" text-anchor="middle">EJS</text></svg>`,

  'API': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <circle cx="20" cy="20" r="16" fill="#0c4a6e" stroke="#0ea5e9" stroke-width="2"/>
    <ellipse cx="20" cy="20" rx="6" ry="16" fill="none" stroke="#0ea5e9" stroke-width="1.5"/>
    <line x1="4" y1="20" x2="36" y2="20" stroke="#0ea5e9" stroke-width="1.5"/>
    <path d="M6,13 Q20,9 34,13" fill="none" stroke="#0ea5e9" stroke-width="1.2"/>
    <path d="M6,27 Q20,31 34,27" fill="none" stroke="#0ea5e9" stroke-width="1.2"/>
  </svg>`,

  'Backend': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="4" y="4" width="32" height="9" rx="2.5" fill="#475569"/>
    <rect x="4" y="15" width="32" height="9" rx="2.5" fill="#334155"/>
    <rect x="4" y="26" width="32" height="9" rx="2.5" fill="#1e293b"/>
    <rect x="8" y="7" width="10" height="3" rx="1" fill="#64748b"/>
    <circle cx="30" cy="8.5" r="2" fill="#22c55e"/>
    <circle cx="25" cy="8.5" r="2" fill="#fbbf24"/>
    <rect x="8" y="18" width="10" height="3" rx="1" fill="#475569"/>
    <circle cx="30" cy="19.5" r="2" fill="#22c55e"/>
    <circle cx="25" cy="19.5" r="2" fill="#22c55e"/>
    <rect x="8" y="29" width="10" height="3" rx="1" fill="#334155"/>
    <circle cx="30" cy="30.5" r="2" fill="#ef4444"/>
    <circle cx="25" cy="30.5" r="2" fill="#fbbf24"/>
  </svg>`,

  'Git & Bash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#f05133"/><path fill="#fff" d="M113.8 57.7L70.3 14.2c-2.5-2.5-6.6-2.5-9.1 0l-9 9 11.5 11.5c2.7-.9 5.7-.3 7.9 1.8 2.1 2.1 2.7 5.2 1.8 7.9l11.1 11.1c2.7-.9 5.8-.3 7.9 1.8 3 3 3 7.8 0 10.8-3 3-7.8 3-10.8 0-2.3-2.3-2.8-5.6-1.7-8.3L69.5 49l0 27.2c.7.4 1.4.8 2 1.4 3 3 3 7.8 0 10.8-3 3-7.8 3-10.8 0-3-3-3-7.8 0-10.8.8-.8 1.7-1.3 2.5-1.7V48.7c-.8-.3-1.7-.8-2.5-1.7-2.3-2.3-2.8-5.6-1.6-8.4L47.8 27.5 14.2 61.1c-2.5 2.5-2.5 6.6 0 9.1l43.5 43.5c2.5 2.5 6.6 2.5 9.1 0l43.4-43.4c2.5-2.5 2.5-6.6 0-9.1z"/></svg>`,

  'GitHub': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="10" fill="#24292e"/><path fill="#fff" d="M64 16C37.5 16 16 37.5 16 64c0 21.2 13.8 39.2 32.9 45.6 2.4.4 3.3-1 3.3-2.3 0-1.1 0-4.8-.1-8.7-13.4 2.9-16.2-5.7-16.2-5.7-2.2-5.6-5.3-7-5.3-7-4.4-3 .3-2.9.3-2.9 4.8.3 7.4 5 7.4 5 4.3 7.4 11.3 5.2 14 4 .4-3.1 1.7-5.2 3.1-6.4-10.7-1.2-21.9-5.3-21.9-23.8 0-5.3 1.9-9.5 5-12.9-.5-1.2-2.2-6.1.5-12.7 0 0 4-1.3 13.2 4.9 3.8-1.1 7.9-1.6 12-1.6 4.1 0 8.2.5 12 1.6 9.2-6.2 13.2-4.9 13.2-4.9 2.6 6.6 1 11.5.5 12.7 3.1 3.4 5 7.6 5 12.9 0 18.5-11.3 22.6-22 23.8 1.7 1.5 3.3 4.4 3.3 8.9 0 6.4-.1 11.6-.1 13.2 0 1.3.9 2.8 3.3 2.3C98.2 103.2 112 85.2 112 64c0-26.5-21.5-48-48-48z"/></svg>`,

  'Bash Shortcuts': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#1e1e1e"/>
    <rect x="4" y="5" width="32" height="20" rx="3" fill="#2d2d2d"/>
    <circle cx="8" cy="9" r="1.5" fill="#f87171"/>
    <circle cx="13" cy="9" r="1.5" fill="#fbbf24"/>
    <circle cx="18" cy="9" r="1.5" fill="#4ade80"/>
    <path d="M7,16 l3.5,3 l-3.5,3" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="14" y="18.5" width="8" height="2" rx="1" fill="#4a5568"/>
    <rect x="4" y="29" width="8" height="7" rx="2" fill="#374151"/>
    <rect x="14" y="29" width="12" height="7" rx="2" fill="#374151"/>
    <rect x="28" y="29" width="8" height="7" rx="2" fill="#374151"/>
    <rect x="6" y="31.5" width="4" height="2" rx="1" fill="#6b7280"/>
    <rect x="16" y="31.5" width="8" height="2" rx="1" fill="#6b7280"/>
    <rect x="30" y="31.5" width="4" height="2" rx="1" fill="#6b7280"/>
  </svg>`,
};

// -------------------------------------------------------
// Build
// -------------------------------------------------------

const PROJECT_ROOT = __dirname;
const DIST = path.join(PROJECT_ROOT, 'docs');
const DIST_NOTES = path.join(DIST, 'notes');

rmrf(DIST);
mkdirp(DIST);
mkdirp(DIST_NOTES);

const config = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'notes.config.json'), 'utf8'));
const { notes, site } = config;
const categoryColors = config.categoryColors || {};

notes.sort((a, b) => a.order - b.order);

const layoutTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'layout.html'), 'utf8');
const homeTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'home.html'), 'utf8');
const noteTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'note.html'), 'utf8');
const notFoundTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', '404.html'), 'utf8');

const builtNotes = [];
const previewMap = {};

for (let i = 0; i < notes.length; i++) {
  const note = notes[i];
  const mdPath = path.join(site.sourceDir, note.file);

  if (!fs.existsSync(mdPath)) {
    console.warn(`  WARN: missing source file ${mdPath} — skipping`);
    continue;
  }

  const raw = fs.readFileSync(mdPath, 'utf8');
  let noteHtml = marked(raw);
  noteHtml = noteHtml.replace(/Images\//g, '../images/');

  const plainText = noteHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const slug = slugify(note.file);
  previewMap[slug] = plainText.slice(0, 100);

  const prev = notes[i - 1] || null;
  const next = notes[i + 1] || null;
  const prevLink = prev
    ? `<a href="${slugify(prev.file)}.html" class="note-nav-prev">← ${prev.title}</a>`
    : '';
  const nextLink = next
    ? `<a href="${slugify(next.file)}.html" class="note-nav-next">${next.title} →</a>`
    : '';

  const mtime = fs.statSync(mdPath).mtime;
  const versionMarkup = note.version
    ? ` &middot; <span class="note-version-badge">${note.version}</span>`
    : '';

  const noteBody = noteTpl
    .replace(/\{\{CATEGORY\}\}/g, note.category)
    .replace(/\{\{TITLE\}\}/g, note.title)
    .replace(/\{\{LAST_UPDATED\}\}/g, formatDate(mtime))
    .replace(/\{\{VERSION_MARKUP\}\}/g, versionMarkup)
    .replace(/\{\{NOTE_CONTENT\}\}/g, noteHtml)
    .replace(/\{\{PREV_LINK\}\}/g, prevLink)
    .replace(/\{\{NEXT_LINK\}\}/g, nextLink);

  const fullPage = applyLayout(layoutTpl, {
    pageTitle: `Pronote | ${note.title}`,
    basePath: '../',
    pageType: 'note',
    content: noteBody,
    notesMenuToggle: MENU_BTN,
    notesMenu: buildNotesMenu(notes, slug, '', previewMap),
    copyright: site.copyright,
    socialInstagram: site.social.instagram,
    socialGithub: site.social.github,
    socialFacebook: site.social.facebook,
  });

  fs.writeFileSync(path.join(DIST_NOTES, `${slug}.html`), fullPage, 'utf8');
  builtNotes.push({ ...note, slug, plainText });
}

// group by category for home page
const categoryMap = new Map();
for (const note of builtNotes) {
  if (!categoryMap.has(note.category)) categoryMap.set(note.category, []);
  categoryMap.get(note.category).push(note);
}

// skills banner
let skillsBannerHtml = '<div class="skills-banner">';
for (const note of builtNotes) {
  const svg = LOGOS[note.title] || '';
  skillsBannerHtml += `<div class="skill-badge"><span class="skill-badge-icon">${svg}</span><span class="skill-badge-label">${note.title}</span></div>`;
}
skillsBannerHtml += '</div>';

// category tabs
let categoryTabsHtml = '<div class="category-tabs">';
for (let i = 0; i < config.categoryTabs.length; i++) {
  const tab = config.categoryTabs[i];
  const label = tab.charAt(0) + tab.slice(1).toLowerCase();
  const active = i === 0 ? ' active' : '';
  categoryTabsHtml += `<button class="category-tab${active}" data-filter="${tab}">${label}</button>`;
}
categoryTabsHtml += '</div>';

// category sections
let categoriesHtml = '';
for (const [category, categoryNotes] of categoryMap) {
  const accent = categoryColors[category] || '';
  const sectionStyle = accent ? ` style="--category-accent: ${accent}"` : '';

  const cards = categoryNotes
    .map((n) => {
      const svg = LOGOS[n.title] || '';
      const cardAccent = categoryColors[n.category] || '';
      const cardStyle = cardAccent ? ` style="--category-accent: ${cardAccent}"` : '';
      return `<a href="notes/${n.slug}.html" class="card" data-title="${n.title}"${cardStyle}><div class="card-logo">${svg}</div><h3>${n.title}</h3><p class="card-description">${n.description || ''}</p><div class="card-badges"><span class="card-category">${n.category}</span><span class="card-difficulty card-difficulty--${(n.difficulty || 'beginner').toLowerCase()}">${n.difficulty || ''}</span></div></a>`;
    })
    .join('\n        ');

  categoriesHtml += `
<section class="category-section" data-category="${category.toUpperCase()}"${sectionStyle}>
  <h2 class="category-heading"${sectionStyle}>${category}</h2>
  <div class="card-grid">
        ${cards}
  </div>
</section>`;
}

// home page
const homeBody = homeTpl
  .replace(/\{\{SKILLS_BANNER\}\}/g, skillsBannerHtml)
  .replace(/\{\{CATEGORY_TABS\}\}/g, categoryTabsHtml)
  .replace(/\{\{CATEGORIES\}\}/g, categoriesHtml);

const homePage = applyLayout(layoutTpl, {
  pageTitle: site.title,
  basePath: './',
  pageType: 'home',
  content: homeBody,
  notesMenuToggle: MENU_BTN,
  notesMenu: buildNotesMenu(notes, null, 'notes/', previewMap),
  copyright: site.copyright,
  socialInstagram: site.social.instagram,
  socialGithub: site.social.github,
  socialFacebook: site.social.facebook,
});
fs.writeFileSync(path.join(DIST, 'index.html'), homePage, 'utf8');

// search index
const searchIndex = builtNotes.map(n => ({
  slug: n.slug,
  title: n.title,
  category: n.category,
  content: n.plainText.slice(0, 500),
}));
fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(searchIndex));

// 404
const notFoundBody = notFoundTpl.replace(/\{\{BASE_PATH\}\}/g, './');
const notFoundPage = applyLayout(layoutTpl, {
  pageTitle: '404 — Pronote',
  basePath: './',
  pageType: 'error',
  content: notFoundBody,
  notesMenuToggle: MENU_BTN,
  notesMenu: buildNotesMenu(notes, null, 'notes/', previewMap),
  copyright: site.copyright,
  socialInstagram: site.social.instagram,
  socialGithub: site.social.github,
  socialFacebook: site.social.facebook,
});
fs.writeFileSync(path.join(DIST, '404.html'), notFoundPage, 'utf8');

// static assets
copyDir(path.join(PROJECT_ROOT, 'src', 'css'), path.join(DIST, 'css'));
copyDir(path.join(PROJECT_ROOT, 'src', 'js'), path.join(DIST, 'js'));

const imagesSource = path.join(site.sourceDir, 'Images');
if (fs.existsSync(imagesSource)) {
  copyDir(imagesSource, path.join(DIST, 'images'));
  console.log('  Copied images directory.');
}

console.log(`Built ${builtNotes.length} notes, output at docs/`);
