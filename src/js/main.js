(() => {
  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const pageType = document.body.dataset.pageType;

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Hide skeleton
  const skeleton = document.getElementById('skeletonLoader');
  if (skeleton) skeleton.classList.add('skeleton-loader--hidden');

  // Sidebar menu
  const menuBtn = document.querySelector('.notes-menu-toggle');
  const menu = document.querySelector('.notes-menu');
  const overlay = document.querySelector('.notes-menu-overlay');
  const closeBtn = document.querySelector('.notes-menu-close');

  function openMenu() {
    if (!menu || !overlay) return;
    menu.classList.add('is-open');
    overlay.classList.add('is-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!menu || !overlay) return;
    menu.classList.remove('is-open');
    overlay.classList.remove('is-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn && menu && overlay) {
    menuBtn.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  }

  // Sidebar hover preview
  let previewTooltip = null;

  document.querySelectorAll('.notes-menu-link[data-preview]').forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      const text = link.getAttribute('data-preview');
      if (!text) return;

      if (!previewTooltip) {
        previewTooltip = document.createElement('div');
        previewTooltip.className = 'sidebar-preview-tooltip';
        document.body.appendChild(previewTooltip);
      }
      previewTooltip.textContent = text;

      let top = e.clientY + 12;
      if (top + 120 > window.innerHeight) top = e.clientY - 120;

      const rect = link.getBoundingClientRect();
      previewTooltip.style.left = (rect.right + 8) + 'px';
      previewTooltip.style.top = Math.max(8, top) + 'px';
      previewTooltip.classList.add('show');
    });

    link.addEventListener('mouseleave', () => {
      if (previewTooltip) previewTooltip.classList.remove('show');
    });
  });

  // Back to top
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '\u2191';
  document.body.appendChild(backToTop);
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Smooth anchor scrolling
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + (target.offsetHeight / 2);
    window.scrollTo({ top: y, behavior: 'smooth' });
  });

  // Keyboard shortcuts
  const searchInput = document.getElementById('searchInput');

  document.addEventListener('keydown', (e) => {
    const inInput = document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
       document.activeElement.tagName === 'TEXTAREA' ||
       document.activeElement.isContentEditable);

    if (e.key === 'Escape') {
      closeMenu();
      if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
      }
      return;
    }

    if (e.key === '/' && !inInput) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }

    if (pageType === 'note' && !inInput) {
      if (e.key === 'ArrowLeft') {
        const prev = document.querySelector('.note-nav-prev');
        if (prev) prev.click();
      } else if (e.key === 'ArrowRight') {
        const next = document.querySelector('.note-nav-next');
        if (next) next.click();
      }
    }

    if (menu && menu.classList.contains('is-open') && e.key === 'Escape') {
      closeMenu();
    }
  });

  // Scroll handler
  const progressBar = document.getElementById('progressBar');
  const navContainer = document.querySelector('.nav-container');

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('back-to-top--visible', window.scrollY > 300);

    if (pageType === 'note' && progressBar) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH > 0) progressBar.style.width = (window.scrollY / docH) * 100 + '%';
    }
  }, { passive: true });

  // ---- HOME PAGE ----

  if (pageType === 'home') {
    const tabs = document.querySelectorAll('.category-tab');
    const sections = document.querySelectorAll('.category-section');
    let searchIndex = null;
    let activeFilter = 'ALL';

    if (tabs.length) {
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          activeFilter = tab.getAttribute('data-filter');
          applyFilters();
        });
      });
    }

    function applyFilters() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

      sections.forEach(section => {
        const cat = section.getAttribute('data-category');
        if (activeFilter !== 'ALL' && cat !== activeFilter) {
          section.classList.add('category-section--hidden');
          return;
        }

        const cards = section.querySelectorAll('.card');
        let visible = 0;

        cards.forEach(card => {
          if (!query) {
            card.style.display = '';
            visible++;
          } else {
            const title = (card.getAttribute('data-title') || '').toLowerCase();
            const extra = searchIndex
              ? (searchIndex[card.getAttribute('data-title')] || '').toLowerCase()
              : '';
            const match = title.includes(query) || extra.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) visible++;
          }
        });

        section.classList.toggle('category-section--hidden', visible === 0 && !!query);
      });
    }

    if (searchInput) {
      // lazy load search index
      searchInput.addEventListener('focus', () => {
        if (searchIndex !== null) return;
        fetch('./search-index.json')
          .then(r => r.json())
          .then(data => { searchIndex = data; })
          .catch(() => { searchIndex = {}; });
      }, { once: true });

      searchInput.addEventListener('input', applyFilters);
    }
  }

  // ---- NOTE PAGE ----

  if (pageType === 'note') {
    const noteContent = document.querySelector('.note-content');
    const slug = window.location.pathname;

    // Scroll position memory
    const fromNav = sessionStorage.getItem('fromPrevNext');
    if (fromNav === 'true') {
      sessionStorage.removeItem('fromPrevNext');
    } else {
      const saved = localStorage.getItem('scroll:' + slug);
      if (saved !== null) {
        requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
      }
    }

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('scroll:' + slug, String(window.scrollY));
    });

    document.querySelectorAll('.note-nav-prev, .note-nav-next').forEach(link => {
      link.addEventListener('click', () => sessionStorage.setItem('fromPrevNext', 'true'));
    });

    // Share
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          let tip = shareBtn.querySelector('.tooltip');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'tooltip';
            shareBtn.appendChild(tip);
          }
          tip.textContent = 'Link copied!';
          tip.classList.add('show');
          setTimeout(() => tip.classList.remove('show'), 2000);
        });
      });
    }

    // Print / export
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => window.print());

    // Code copy
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-copy-btn');
      if (!btn) return;
      const wrapper = btn.closest('.code-block-wrapper');
      const code = wrapper && wrapper.querySelector('code');
      if (!code) return;

      const origSvg = btn.innerHTML;
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = origSvg;
        }, 2000);
      });
    });

    // TOC generation
    if (noteContent) {
      const headings = noteContent.querySelectorAll('h2, h3');

      if (headings.length > 0) {
        headings.forEach(h => { if (!h.id) h.id = slugify(h.textContent); });

        const toc = document.createElement('aside');
        toc.className = 'toc';

        const tocTitle = document.createElement('p');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'On this page';
        toc.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        let curH2 = null;
        let curSub = null;

        headings.forEach(heading => {
          const li = document.createElement('li');
          li.className = 'toc-item toc-item--' + heading.tagName.toLowerCase();

          const a = document.createElement('a');
          a.className = 'toc-link';
          a.href = '#' + heading.id;
          a.textContent = heading.textContent;

          if (heading.tagName === 'H2') {
            li.appendChild(a);
            tocList.appendChild(li);
            curH2 = li;
            curSub = null;
          } else if (heading.tagName === 'H3' && curH2) {
            if (!curSub) {
              curSub = document.createElement('ul');
              curSub.className = 'toc-sublist';

              const toggle = document.createElement('span');
              toggle.className = 'toc-toggle';
              curH2.classList.add('toc-item--has-children');
              curH2.appendChild(toggle);
              curH2.appendChild(curSub);

              toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                curH2.classList.toggle('toc-item--expanded');
              });
            }
            li.appendChild(a);
            curSub.appendChild(li);
          } else {
            li.appendChild(a);
            tocList.appendChild(li);
          }
        });

        toc.appendChild(tocList);
        noteContent.parentNode.insertBefore(toc, noteContent);

        tocTitle.addEventListener('click', () => toc.classList.toggle('toc--expanded'));

        const tocLinks = toc.querySelectorAll('.toc-link');
        let clickedId = null;

        // scroll to heading + glow on TOC click
        tocLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;

            clickedId = id;
            tocLinks.forEach(l => l.classList.remove('toc-link--active'));
            link.classList.add('toc-link--active');

            const y = target.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + (target.offsetHeight / 2);
            window.scrollTo({ top: y, behavior: 'smooth' });
            history.pushState(null, '', '#' + id);

            target.classList.remove('toc-heading-glow');
            void target.offsetWidth; // force reflow
            target.classList.add('toc-heading-glow');

            const clearGlow = () => {
              setTimeout(() => target.classList.remove('toc-heading-glow'), 700);
              clickedId = null;
            };

            if (Math.abs(Math.round(window.scrollY) - Math.round(y)) < 2) {
              clearGlow();
            } else {
              window.addEventListener('scrollend', clearGlow, { once: true });
            }
          });
        });

        // highlight closest heading in TOC
        const updateActive = () => {
          if (clickedId) return;

          const center = window.innerHeight / 2;
          let closest = null;
          let minDist = Infinity;

          const firstRect = headings[0].getBoundingClientRect();
          if (firstRect.top >= 0) {
            closest = headings[0];
          } else {
            headings.forEach(h => {
              const d = Math.abs(h.getBoundingClientRect().top - center);
              if (d < minDist) { minDist = d; closest = h; }
            });
          }

          if (closest) {
            tocLinks.forEach(l => l.classList.remove('toc-link--active'));
            const active = toc.querySelector('.toc-link[href="#' + closest.id + '"]');
            if (active) active.classList.add('toc-link--active');
          }
        };

        window.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
      }
    }

    // Sticky title in nav
    const noteTitle = document.querySelector('.note-title');
    if (noteTitle && navContainer) {
      let stickyTitle = navContainer.querySelector('.nav-sticky-title');
      if (!stickyTitle) {
        stickyTitle = document.createElement('span');
        stickyTitle.className = 'nav-sticky-title';
        stickyTitle.textContent = noteTitle.textContent;
        const logo = navContainer.querySelector('.nav-logo');
        if (logo && logo.nextSibling) {
          navContainer.insertBefore(stickyTitle, logo.nextSibling);
        } else {
          navContainer.appendChild(stickyTitle);
        }
      }

      new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          navContainer.classList.toggle('nav--show-title', !entry.isIntersecting);
        });
      }, { threshold: 0 }).observe(noteTitle);
    }

    // In-page keyword search
    if (searchInput && noteContent) {
      const navPanel = document.getElementById('searchNavPanel');
      const matchInfo = document.getElementById('searchMatchInfo');
      const prevBtn = document.getElementById('searchPrevBtn');
      const nextBtn = document.getElementById('searchNextBtn');

      let original = noteContent.innerHTML;
      let matches = [];
      let curMatch = -1;

      function clearHighlights() {
        noteContent.innerHTML = original;
        matches = [];
        curMatch = -1;
      }

      function highlightText(query) {
        noteContent.innerHTML = original;
        matches = [];
        curMatch = -1;
        if (!query) return;

        const lower = query.toLowerCase();
        const walker = document.createTreeWalker(noteContent, NodeFilter.SHOW_TEXT, null);

        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.toLowerCase().includes(lower)) nodes.push(node);
        }

        // replace in reverse to preserve positions
        nodes.reverse().forEach(textNode => {
          const parent = textNode.parentNode;
          if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

          const text = textNode.textContent;
          const lowerText = text.toLowerCase();
          const frag = document.createDocumentFragment();
          let last = 0;
          let idx = lowerText.indexOf(lower);

          while (idx !== -1) {
            if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = text.slice(idx, idx + query.length);
            frag.appendChild(mark);
            last = idx + query.length;
            idx = lowerText.indexOf(lower, last);
          }

          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          parent.replaceChild(frag, textNode);
        });

        matches = Array.from(noteContent.querySelectorAll('.search-highlight'));
      }

      function goToMatch(index) {
        if (!matches.length) return;
        if (curMatch >= 0 && curMatch < matches.length) {
          matches[curMatch].classList.remove('search-highlight--current');
        }
        curMatch = (index + matches.length) % matches.length;
        matches[curMatch].classList.add('search-highlight--current');
        matches[curMatch].scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (matchInfo) matchInfo.textContent = (curMatch + 1) + ' / ' + matches.length;
      }

      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (!q) {
          clearHighlights();
          if (navPanel) navPanel.style.display = 'none';
          return;
        }

        highlightText(q);
        if (matches.length > 0) {
          goToMatch(0);
          if (navPanel) navPanel.style.display = 'flex';
        } else {
          if (navPanel) navPanel.style.display = 'none';
          if (matchInfo) matchInfo.textContent = '0 results';
        }
      });

      if (prevBtn) prevBtn.addEventListener('click', () => goToMatch(curMatch - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => goToMatch(curMatch + 1));
    }
  }
})();
