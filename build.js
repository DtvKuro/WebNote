'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

// ---------------------------------------------------------------------------
// Configure marked v15 with highlight.js via renderer override.
// marked v15 dropped the `highlight` option from setOptions; the correct
// approach is marked.use({ renderer: { code(token) { ... } } }).
// The renderer.code method receives a Tokens.Code object: { text, lang }.
// ---------------------------------------------------------------------------
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
      return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
    },
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function slugify(filename) {
  // e.g. "node-js.md" → "node-js", "EJS.md" → "EJS"
  return path.basename(filename, '.md');
}

function applyLayout(layout, { pageTitle, basePath, content }) {
  return layout
    .replace(/\{\{PAGE_TITLE\}\}/g, pageTitle)
    .replace(/\{\{BASE_PATH\}\}/g, basePath)
    .replace(/\{\{CONTENT\}\}/g, content);
}

// ---------------------------------------------------------------------------
// Tech logos — inline SVG per note title
// ---------------------------------------------------------------------------

const LOGOS = {
  'HTML': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <polygon points="4,2 36,2 33,35 20,39 7,35" fill="#e44d26"/>
    <polygon points="20,5 20,36.5 30.5,33.5 33,5" fill="#f16529"/>
    <polygon points="10,10 11.5,27 20,29.5 20,10" fill="#ebebeb"/>
    <polygon points="30,10 20,10 20,29.5 28.5,27" fill="#fff"/>
    <polygon points="13,14 13.5,20 20,20 20,14" fill="#ebebeb"/>
    <polygon points="27,14 20,14 20,20 26.5,20" fill="#fff"/>
    <polygon points="13.5,22 14.5,31 20,32.5 20,26" fill="#ebebeb"/>
    <polygon points="26.5,22 20,26 20,32.5 25.5,31" fill="#fff"/>
  </svg>`,

  'CSS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <polygon points="4,2 36,2 33,35 20,39 7,35" fill="#264de4"/>
    <polygon points="20,5 20,36.5 30.5,33.5 33,5" fill="#2965f1"/>
    <path d="M13,14h14l-0.5,5H20v4h6l-0.7,8L20,33.5V38l-5.3-1.5L14,27h5l0.3,3.5L20,31l0.7-0.5L21,27h-8.5L12,14z" fill="#ebebeb"/>
    <path d="M20,14v5h6l-0.5,4H20v4h5.3l-0.7,8L20,36.5V38l5.3-1.5L26,27h-6v-4h6.5L27,14z" fill="#fff"/>
  </svg>`,

  'JavaScript': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" fill="#f7df1e"/>
    <path d="M10,30 l3,-2 c0.6,1.5,1.2,2.2,2.4,2.2c1.1,0,1.8,-0.5,1.8,-2.5V16h4v12c0,4.1,-2.4,6,-5.9,6C12.6,34,11,32.5,10,30z" fill="#323330"/>
    <path d="M23,29.5 l3,-1.8 c0.8,1.3,1.8,2.2,3.6,2.2c1.5,0,2.5,-0.75,2.5,-1.8c0,-1.2,-1,-1.7,-2.7,-2.4l-0.9,-0.4c-2.7,-1.15,-4.5,-2.6,-4.5,-5.6c0,-2.8,2.1,-4.9,5.4,-4.9c2.3,0,4,0.8,5.2,2.9l-2.8,1.8c-0.6,-1.1,-1.3,-1.5,-2.4,-1.5c-1.1,0,-1.8,0.7,-1.8,1.5c0,1.1,0.7,1.5,2.3,2.2l0.9,0.4c3.2,1.4,5,2.8,5,5.9c0,3.4,-2.7,5.2,-6.3,5.2C26.6,34,24.4,32.4,23,29.5z" fill="#323330"/>
  </svg>`,

  'DOM': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="15" y="2" width="10" height="8" rx="2" fill="#6366f1"/>
    <rect x="2" y="16" width="10" height="8" rx="2" fill="#8b5cf6"/>
    <rect x="15" y="16" width="10" height="8" rx="2" fill="#8b5cf6"/>
    <rect x="28" y="16" width="10" height="8" rx="2" fill="#8b5cf6"/>
    <rect x="8" y="30" width="10" height="8" rx="2" fill="#a78bfa"/>
    <rect x="22" y="30" width="10" height="8" rx="2" fill="#a78bfa"/>
    <line x1="20" y1="10" x2="20" y2="16" stroke="#6366f1" stroke-width="2"/>
    <line x1="7" y1="10" x2="20" y2="16" stroke="#6366f1" stroke-width="2"/>
    <line x1="33" y1="10" x2="20" y2="16" stroke="#6366f1" stroke-width="2"/>
    <line x1="20" y1="10" x2="7" y2="16" stroke="#6366f1" stroke-width="2"/>
    <line x1="20" y1="10" x2="33" y2="16" stroke="#6366f1" stroke-width="2"/>
    <line x1="7" y1="24" x2="13" y2="30" stroke="#8b5cf6" stroke-width="2"/>
    <line x1="33" y1="24" x2="27" y2="30" stroke="#8b5cf6" stroke-width="2"/>
  </svg>`,

  'Web Design': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="2" y="4" width="36" height="26" rx="3" fill="#0ea5e9"/>
    <rect x="2" y="4" width="36" height="8" rx="3" fill="#0284c7"/>
    <rect x="5" y="7" width="12" height="2" rx="1" fill="#e0f2fe"/>
    <rect x="5" y="16" width="14" height="10" rx="2" fill="#e0f2fe"/>
    <rect x="21" y="16" width="14" height="4" rx="1" fill="#bae6fd"/>
    <rect x="21" y="22" width="14" height="4" rx="1" fill="#bae6fd"/>
    <rect x="12" y="30" width="16" height="6" rx="1" fill="#0284c7"/>
    <rect x="8" y="36" width="24" height="2" rx="1" fill="#0369a1"/>
  </svg>`,

  'Node.js': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#3c873a"/>
    <polygon points="20,2 36,11 36,29 20,38" fill="#3c873a"/>
    <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#388e3c" stroke-width="1"/>
    <text x="20" y="27" font-family="monospace" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle">JS</text>
  </svg>`,

  'Express': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#1a1a1a"/>
    <line x1="6" y1="14" x2="28" y2="14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="6" y1="20" x2="22" y2="20" stroke="#aaa" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="6" y1="26" x2="25" y2="26" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="14" r="3" fill="#fff"/>
    <circle cx="26" cy="20" r="3" fill="#aaa"/>
    <circle cx="29" cy="26" r="3" fill="#666"/>
  </svg>`,

  'EJS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="6" y="2" width="22" height="28" rx="3" fill="#e2e8f0"/>
    <rect x="6" y="2" width="22" height="7" rx="3" fill="#94a3b8"/>
    <rect x="28" y="2" width="6" height="6" fill="#e2e8f0"/>
    <polygon points="28,2 34,2 34,8" fill="#64748b"/>
    <rect x="10" y="14" width="14" height="2" rx="1" fill="#94a3b8"/>
    <rect x="10" y="18" width="10" height="2" rx="1" fill="#94a3b8"/>
    <rect x="10" y="22" width="12" height="2" rx="1" fill="#94a3b8"/>
    <rect x="16" y="26" width="22" height="14" rx="3" fill="#10b981"/>
    <text x="27" y="37" font-family="monospace" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">&lt;%=</text>
  </svg>`,

  'API': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <circle cx="20" cy="20" r="17" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
    <ellipse cx="20" cy="20" rx="7" ry="17" fill="none" stroke="#0ea5e9" stroke-width="2"/>
    <line x1="3" y1="20" x2="37" y2="20" stroke="#0ea5e9" stroke-width="2"/>
    <line x1="5" y1="13" x2="35" y2="13" stroke="#0ea5e9" stroke-width="1.5"/>
    <line x1="5" y1="27" x2="35" y2="27" stroke="#0ea5e9" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="3" fill="#0ea5e9"/>
  </svg>`,

  'Backend': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect x="4" y="4" width="32" height="10" rx="3" fill="#475569"/>
    <rect x="4" y="16" width="32" height="10" rx="3" fill="#334155"/>
    <rect x="4" y="28" width="32" height="10" rx="3" fill="#1e293b"/>
    <circle cx="31" cy="9" r="2" fill="#22c55e"/>
    <circle cx="26" cy="9" r="2" fill="#fbbf24"/>
    <rect x="8" y="7" width="12" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="19" width="12" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="31" width="12" height="2" rx="1" fill="#64748b"/>
    <circle cx="31" cy="21" r="2" fill="#22c55e"/>
    <circle cx="31" cy="33" r="2" fill="#ef4444"/>
  </svg>`,

  'Git & Bash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#f05133"/>
    <circle cx="12" cy="28" r="4" fill="none" stroke="#fff" stroke-width="2.5"/>
    <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2.5"/>
    <circle cx="28" cy="20" r="4" fill="none" stroke="#fff" stroke-width="2.5"/>
    <line x1="12" y1="16" x2="12" y2="24" stroke="#fff" stroke-width="2.5"/>
    <line x1="15.5" y1="13.5" x2="24.5" y2="18" stroke="#fff" stroke-width="2.5"/>
    <line x1="15.5" y1="26.5" x2="24.5" y2="22" stroke="#fff" stroke-width="2.5"/>
  </svg>`,

  'GitHub': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#24292e"/>
    <path d="M20,5 C12.3,5 6,11.3 6,19 c0,6.2 4,11.4 9.6,13.3 c0.7,0.1 1,-0.3 1,-0.7 v-2.6 c-3.9,0.8-4.7,-1.9-4.7,-1.9 c-0.6,-1.6-1.6,-2-1.6,-2 c-1.3,-0.9 0.1,-0.9 0.1,-0.9 c1.4,0.1 2.2,1.5 2.2,1.5 c1.3,2.2 3.3,1.6 4.1,1.2 c0.1,-0.9 0.5,-1.6 0.9,-1.9 c-3.1,-0.4-6.4,-1.6-6.4,-7 c0,-1.5 0.5,-2.8 1.4,-3.8 c-0.1,-0.4-0.6,-1.8 0.1,-3.7 c0,0 1.2,-0.4 3.8,1.4 c1.1,-0.3 2.3,-0.5 3.4,-0.5 c1.2,0 2.3,0.2 3.4,0.5 c2.7,-1.8 3.8,-1.4 3.8,-1.4 c0.7,1.9 0.3,3.3 0.1,3.7 c0.9,1 1.4,2.2 1.4,3.8 c0,5.4-3.3,6.6-6.4,7 c0.5,0.4 0.9,1.3 0.9,2.6 v3.8 c0,0.4 0.3,0.8 1,0.7 C30,30.4 34,25.2 34,19 C34,11.3 27.7,5 20,5z" fill="#fff"/>
  </svg>`,

  'Bash Shortcuts': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <rect width="40" height="40" rx="6" fill="#1e1e1e"/>
    <rect x="4" y="4" width="32" height="22" rx="3" fill="#2d2d2d"/>
    <text x="8" y="16" font-family="monospace" font-size="8" fill="#22c55e">$_</text>
    <rect x="8" y="19" width="10" height="1.5" rx="0.75" fill="#64748b"/>
    <rect x="8" y="22" width="16" height="1.5" rx="0.75" fill="#64748b"/>
    <rect x="5" y="30" width="8" height="6" rx="1.5" fill="#374151"/>
    <rect x="15" y="30" width="10" height="6" rx="1.5" fill="#374151"/>
    <rect x="27" y="30" width="8" height="6" rx="1.5" fill="#374151"/>
    <text x="9" y="35" font-family="monospace" font-size="6" fill="#9ca3af">⌃</text>
    <text x="18" y="35" font-family="monospace" font-size="5" fill="#9ca3af">alt</text>
    <text x="30" y="35" font-family="monospace" font-size="6" fill="#9ca3af">⇧</text>
  </svg>`,
};

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

const PROJECT_ROOT = __dirname;
const DIST_DIR = path.join(PROJECT_ROOT, 'docs');
const DIST_NOTES_DIR = path.join(DIST_DIR, 'notes');

// 1. Clean dist/
rmrf(DIST_DIR);
mkdirp(DIST_DIR);
mkdirp(DIST_NOTES_DIR);

// 2. Read config
const config = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'notes.config.json'), 'utf8'));
const { notes, site } = config;

// Sort by order
notes.sort((a, b) => a.order - b.order);

// 3. Read templates
const layoutTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'layout.html'), 'utf8');
const homeTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'home.html'), 'utf8');
const noteTpl = fs.readFileSync(path.join(PROJECT_ROOT, 'templates', 'note.html'), 'utf8');

// ---------------------------------------------------------------------------
// 5. Build each note page
// ---------------------------------------------------------------------------

const builtNotes = [];

for (let i = 0; i < notes.length; i++) {
  const note = notes[i];
  const mdPath = path.join(site.sourceDir, note.file);

  if (!fs.existsSync(mdPath)) {
    console.warn(`  WARN: missing source file ${mdPath} — skipping`);
    continue;
  }

  const mdSource = fs.readFileSync(mdPath, 'utf8');

  // Convert markdown → HTML
  let noteHtml = marked(mdSource);

  // Rewrite image paths: Images/ → ../images/
  noteHtml = noteHtml.replace(/Images\//g, '../images/');

  const slug = slugify(note.file);
  const prev = notes[i - 1] || null;
  const next = notes[i + 1] || null;

  const prevLink = prev
    ? `<a href="${slugify(prev.file)}.html" class="note-nav-prev">← ${prev.title}</a>`
    : '';
  const nextLink = next
    ? `<a href="${slugify(next.file)}.html" class="note-nav-next">${next.title} →</a>`
    : '';

  // Build the notes menu HTML grouped by category
  const menuCategoryMap = new Map();
  for (const n of notes) {
    if (!menuCategoryMap.has(n.category)) {
      menuCategoryMap.set(n.category, []);
    }
    menuCategoryMap.get(n.category).push(n);
  }

  let notesMenuHtml = '';
  for (const [cat, catNotes] of menuCategoryMap) {
    const items = catNotes
      .map((n) => {
        const nSlug = slugify(n.file);
        const activeClass = nSlug === slug ? ' active' : '';
        return `<li><a href="${nSlug}.html" class="notes-menu-link${activeClass}">${n.title}</a></li>`;
      })
      .join('\n        ');
    notesMenuHtml += `<div class="notes-menu-category">
  <h4 class="notes-menu-category-title">${cat}</h4>
  <ul class="notes-menu-list">
        ${items}
  </ul>
</div>\n`;
  }

  const noteBody = noteTpl
    .replace(/\{\{CATEGORY\}\}/g, note.category)
    .replace(/\{\{TITLE\}\}/g, note.title)
    .replace(/\{\{NOTE_CONTENT\}\}/g, noteHtml)
    .replace(/\{\{PREV_LINK\}\}/g, prevLink)
    .replace(/\{\{NEXT_LINK\}\}/g, nextLink)
    .replace(/\{\{NOTES_MENU\}\}/g, notesMenuHtml);

  const fullPage = applyLayout(layoutTpl, {
    pageTitle: note.title,
    basePath: '../',
    content: noteBody,
  });

  const outPath = path.join(DIST_NOTES_DIR, `${slug}.html`);
  fs.writeFileSync(outPath, fullPage, 'utf8');

  builtNotes.push({ ...note, slug });
}

// ---------------------------------------------------------------------------
// 6. Generate homepage
// ---------------------------------------------------------------------------

// Group by category preserving insertion order
const categoryMap = new Map();
for (const note of builtNotes) {
  if (!categoryMap.has(note.category)) {
    categoryMap.set(note.category, []);
  }
  categoryMap.get(note.category).push(note);
}

let categoriesHtml = '';
for (const [category, categoryNotes] of categoryMap) {
  const cards = categoryNotes
    .map((n) => {
      const svgIcon = LOGOS[n.title] || '';
      return `<a href="notes/${n.slug}.html" class="card" data-title="${n.title}"><div class="card-logo">${svgIcon}</div><h3>${n.title}</h3><span class="card-category">${n.category}</span></a>`;
    })
    .join('\n        ');

  categoriesHtml += `
<section class="category-section">
  <h2 class="category-heading">${category}</h2>
  <div class="card-grid">
        ${cards}
  </div>
</section>`;
}

const homeBody = homeTpl.replace(/\{\{CATEGORIES\}\}/g, categoriesHtml);

const homePage = applyLayout(layoutTpl, {
  pageTitle: site.title,
  basePath: './',
  content: homeBody,
});

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homePage, 'utf8');

// ---------------------------------------------------------------------------
// 7. Copy static assets
// ---------------------------------------------------------------------------

copyDir(path.join(PROJECT_ROOT, 'src', 'css'), path.join(DIST_DIR, 'css'));
copyDir(path.join(PROJECT_ROOT, 'src', 'js'), path.join(DIST_DIR, 'js'));

const imagesSource = path.join(site.sourceDir, 'Images');
if (fs.existsSync(imagesSource)) {
  copyDir(imagesSource, path.join(DIST_DIR, 'images'));
  console.log('  Copied images directory.');
}

// ---------------------------------------------------------------------------
// 8. Summary
// ---------------------------------------------------------------------------

console.log(`Built ${builtNotes.length} notes, output at docs/`);
