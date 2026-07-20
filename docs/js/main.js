(() => {
  // ============================================================
  // Utilities
  // ============================================================

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const pageType = document.body.dataset.pageType;

  // ============================================================
  // Theme toggle
  // ============================================================

  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ============================================================
  // Skeleton loader — hide on DOMContentLoaded
  // ============================================================

  const skeletonLoader = document.getElementById('skeletonLoader');
  if (skeletonLoader) {
    skeletonLoader.classList.add('skeleton-loader--hidden');
  }

  // ============================================================
  // Notes menu sidebar open / close
  // ============================================================

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
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }
  }

  // ============================================================
  // Sidebar hover preview tooltip
  // ============================================================

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

      const viewportH = window.innerHeight;
      let top = e.clientY + 12;
      if (top + 120 > viewportH) {
        top = e.clientY - 120;
      }

      const rect = link.getBoundingClientRect();
      previewTooltip.style.left = (rect.right + 8) + 'px';
      previewTooltip.style.top = Math.max(8, top) + 'px';
      previewTooltip.classList.add('show');
    });

    link.addEventListener('mouseleave', () => {
      if (previewTooltip) {
        previewTooltip.classList.remove('show');
      }
    });
  });

  // ============================================================
  // Back to top button
  // ============================================================

  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '\u2191';
  document.body.appendChild(backToTop);

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  // Smooth anchor scrolling (TOC links)
  // ============================================================

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ============================================================
  // Keyboard shortcuts
  // ============================================================

  const searchInput = document.getElementById('searchInput');

  document.addEventListener('keydown', (e) => {
    const isInInput = document.activeElement &&
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

    if (e.key === '/' && !isInInput) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }

    if (pageType === 'note' && !isInInput) {
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

  // ============================================================
  // Scroll listeners (shared)
  // ============================================================

  const progressBar = document.getElementById('progressBar');
  const navContainer = document.querySelector('.nav-container');

  window.addEventListener('scroll', () => {
    // Back to top visibility
    if (window.scrollY > 300) {
      backToTop.classList.add('back-to-top--visible');
    } else {
      backToTop.classList.remove('back-to-top--visible');
    }

    // Progress bar (note pages only)
    if (pageType === 'note' && progressBar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = (window.scrollY / docHeight) * 100;
        progressBar.style.width = pct + '%';
      }
    }
  }, { passive: true });

  // ============================================================
  // HOME PAGE features
  // ============================================================

  if (pageType === 'home') {
    const tabs = document.querySelectorAll('.category-tab');
    const sections = document.querySelectorAll('.category-section');
    let searchIndex = null;
    let activeFilter = 'ALL';

    // --- Category tab filtering with animation ---
    if (tabs.length > 0) {
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
        const category = section.getAttribute('data-category');
        const categoryMatch = activeFilter === 'ALL' || category === activeFilter;

        if (!categoryMatch) {
          section.classList.add('category-section--hidden');
          return;
        }

        const cards = section.querySelectorAll('.card');
        let visibleCards = 0;

        cards.forEach(card => {
          if (!query) {
            card.style.display = '';
            visibleCards++;
          } else {
            const title = (card.getAttribute('data-title') || '').toLowerCase();
            const indexContent = searchIndex
              ? (searchIndex[card.getAttribute('data-title')] || '').toLowerCase()
              : '';
            const match = title.includes(query) || indexContent.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) visibleCards++;
          }
        });

        if (visibleCards === 0 && query) {
          section.classList.add('category-section--hidden');
        } else {
          section.classList.remove('category-section--hidden');
        }
      });
    }

    // --- Global search (home page) ---
    if (searchInput) {
      // Lazy-load search index on first focus
      searchInput.addEventListener('focus', () => {
        if (searchIndex !== null) return;
        fetch('./search-index.json')
          .then(r => r.json())
          .then(data => { searchIndex = data; })
          .catch(() => { searchIndex = {}; });
      }, { once: true });

      searchInput.addEventListener('input', () => {
        applyFilters();
      });
    }
  }

  // ============================================================
  // NOTE PAGE features
  // ============================================================

  if (pageType === 'note') {
    const noteContent = document.querySelector('.note-content');
    const slug = window.location.pathname;

    // --- Scroll position memory ---
    const fromPrevNext = sessionStorage.getItem('fromPrevNext');
    if (fromPrevNext === 'true') {
      sessionStorage.removeItem('fromPrevNext');
    } else {
      const saved = localStorage.getItem('scroll:' + slug);
      if (saved !== null) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
        });
      }
    }

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('scroll:' + slug, String(window.scrollY));
    });

    // --- Prev/Next note scroll flag ---
    document.querySelectorAll('.note-nav-prev, .note-nav-next').forEach(link => {
      link.addEventListener('click', () => {
        sessionStorage.setItem('fromPrevNext', 'true');
      });
    });

    // --- Share button ---
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          let tooltip = shareBtn.querySelector('.tooltip');
          if (!tooltip) {
            tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            shareBtn.appendChild(tooltip);
          }
          tooltip.textContent = 'Link copied!';
          tooltip.classList.add('show');
          setTimeout(() => tooltip.classList.remove('show'), 2000);
        });
      });
    }

    // --- Export PDF button ---
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // --- Code copy buttons (build.js already generates wrappers, labels, and buttons) ---
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.code-copy-btn');
      if (!copyBtn) return;
      const wrapper = copyBtn.closest('.code-block-wrapper');
      if (!wrapper) return;
      const code = wrapper.querySelector('code');
      if (!code) return;
      const originalSvg = copyBtn.innerHTML;
      navigator.clipboard.writeText(code.textContent).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = originalSvg;
        }, 2000);
      });
    });

    // --- TOC generation with IntersectionObserver (starts collapsed) ---
    if (noteContent) {
      const headings = noteContent.querySelectorAll('h2, h3');

      if (headings.length > 0) {
        headings.forEach(heading => {
          if (!heading.id) {
            heading.id = slugify(heading.textContent);
          }
        });

        const toc = document.createElement('aside');
        toc.className = 'toc';

        const tocTitle = document.createElement('p');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'On this page';
        toc.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        let currentH2Item = null;
        let currentSubList = null;

        headings.forEach(heading => {
          const item = document.createElement('li');
          item.className = 'toc-item toc-item--' + heading.tagName.toLowerCase();

          const link = document.createElement('a');
          link.className = 'toc-link';
          link.href = '#' + heading.id;
          link.textContent = heading.textContent;

          if (heading.tagName === 'H2') {
            item.appendChild(link);
            tocList.appendChild(item);
            currentH2Item = item;
            currentSubList = null;
          } else if (heading.tagName === 'H3' && currentH2Item) {
            if (!currentSubList) {
              currentSubList = document.createElement('ul');
              currentSubList.className = 'toc-sublist';

              const toggle = document.createElement('span');
              toggle.className = 'toc-toggle';

              const parentItem = currentH2Item;
              parentItem.classList.add('toc-item--has-children');
              parentItem.appendChild(toggle);
              parentItem.appendChild(currentSubList);

              toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                parentItem.classList.toggle('toc-item--expanded');
              });
            }
            item.appendChild(link);
            currentSubList.appendChild(item);
          } else {
            item.appendChild(link);
            tocList.appendChild(item);
          }
        });

        toc.appendChild(tocList);
        noteContent.parentNode.insertBefore(toc, noteContent);

        // Toggle collapsed/expanded on title click
        tocTitle.addEventListener('click', () => {
          toc.classList.toggle('toc--expanded');
        });

        const tocLinks = toc.querySelectorAll('.toc-link');

        // Scroll heading below the sticky nav with padding
        tocLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
              const navHeight = 56;
              const padding = 24;
              const y = target.getBoundingClientRect().top + window.scrollY - navHeight - padding;
              window.scrollTo({ top: y, behavior: 'smooth' });
              history.pushState(null, '', '#' + targetId);
            }
          });
        });

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                tocLinks.forEach(l => l.classList.remove('toc-link--active'));
                const activeLink = toc.querySelector(
                  '.toc-link[href="#' + entry.target.id + '"]'
                );
                if (activeLink) {
                  activeLink.classList.add('toc-link--active');
                }
              }
            });
          },
          { rootMargin: '0px 0px -70% 0px', threshold: 0 }
        );

        headings.forEach(heading => observer.observe(heading));
      }
    }

    // --- Sticky note title in nav ---
    const noteTitle = document.querySelector('.note-title');
    if (noteTitle && navContainer) {
      let stickyTitleSpan = navContainer.querySelector('.nav-sticky-title');
      if (!stickyTitleSpan) {
        stickyTitleSpan = document.createElement('span');
        stickyTitleSpan.className = 'nav-sticky-title';
        stickyTitleSpan.textContent = noteTitle.textContent;
        // Insert after the logo
        const logo = navContainer.querySelector('.nav-logo');
        if (logo && logo.nextSibling) {
          navContainer.insertBefore(stickyTitleSpan, logo.nextSibling);
        } else {
          navContainer.appendChild(stickyTitleSpan);
        }
      }

      const titleObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              navContainer.classList.remove('nav--show-title');
            } else {
              navContainer.classList.add('nav--show-title');
            }
          });
        },
        { threshold: 0 }
      );

      titleObserver.observe(noteTitle);
    }

    // --- In-page keyword search ---
    if (searchInput && noteContent) {
      const searchNavPanel = document.getElementById('searchNavPanel');
      const searchMatchInfo = document.getElementById('searchMatchInfo');
      const searchPrevBtn = document.getElementById('searchPrevBtn');
      const searchNextBtn = document.getElementById('searchNextBtn');

      let originalContent = noteContent.innerHTML;
      let matches = [];
      let currentMatchIndex = -1;

      function clearHighlights() {
        noteContent.innerHTML = originalContent;
        matches = [];
        currentMatchIndex = -1;
      }

      function highlightText(query) {
        // Restore from original to avoid accumulation
        noteContent.innerHTML = originalContent;
        matches = [];
        currentMatchIndex = -1;

        if (!query) return;

        const lowerQuery = query.toLowerCase();

        // Use TreeWalker to find text nodes
        const walker = document.createTreeWalker(
          noteContent,
          NodeFilter.SHOW_TEXT,
          null
        );

        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.toLowerCase().includes(lowerQuery)) {
            textNodes.push(node);
          }
        }

        // Replace text nodes with highlighted spans (reverse to preserve positions)
        textNodes.reverse().forEach(textNode => {
          const parent = textNode.parentNode;
          if (!parent) return;
          // Skip if inside a script/style
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

          const text = textNode.textContent;
          const lowerText = text.toLowerCase();
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let idx = lowerText.indexOf(lowerQuery);

          while (idx !== -1) {
            if (idx > lastIndex) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
            }
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = text.slice(idx, idx + query.length);
            fragment.appendChild(mark);
            lastIndex = idx + query.length;
            idx = lowerText.indexOf(lowerQuery, lastIndex);
          }

          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
          }

          parent.replaceChild(fragment, textNode);
        });

        matches = Array.from(noteContent.querySelectorAll('.search-highlight'));
      }

      function goToMatch(index) {
        if (matches.length === 0) return;
        if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
          matches[currentMatchIndex].classList.remove('search-highlight--current');
        }
        currentMatchIndex = (index + matches.length) % matches.length;
        const current = matches[currentMatchIndex];
        current.classList.add('search-highlight--current');
        current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (searchMatchInfo) {
          searchMatchInfo.textContent = (currentMatchIndex + 1) + ' / ' + matches.length;
        }
      }

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();

        if (!query) {
          clearHighlights();
          if (searchNavPanel) searchNavPanel.style.display = 'none';
          return;
        }

        highlightText(query);

        if (matches.length > 0) {
          goToMatch(0);
          if (searchNavPanel) searchNavPanel.style.display = 'flex';
        } else {
          if (searchNavPanel) searchNavPanel.style.display = 'none';
          if (searchMatchInfo) searchMatchInfo.textContent = '0 results';
        }
      });

      if (searchPrevBtn) {
        searchPrevBtn.addEventListener('click', () => {
          goToMatch(currentMatchIndex - 1);
        });
      }

      if (searchNextBtn) {
        searchNextBtn.addEventListener('click', () => {
          goToMatch(currentMatchIndex + 1);
        });
      }
    }
  }
})();
