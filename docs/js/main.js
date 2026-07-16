(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // a) Mobile nav toggle
  // ---------------------------------------------------------------------------
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when any nav link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when clicking outside the nav
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // b) Homepage search / filter
  // ---------------------------------------------------------------------------
  const searchInput = document.getElementById('search');

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const query = searchInput.value.trim().toLowerCase();

      document.querySelectorAll('.category-section').forEach(function (section) {
        const cards = section.querySelectorAll('.card');
        let visibleCount = 0;

        cards.forEach(function (card) {
          const title = (card.getAttribute('data-title') || '').toLowerCase();
          const matches = title.includes(query);
          card.style.display = matches ? '' : 'none';
          if (matches) visibleCount++;
        });

        // Hide the entire category section if no cards match
        section.style.display = visibleCount === 0 ? 'none' : '';
      });
    });
  }

  // ---------------------------------------------------------------------------
  // c) Table of Contents (note pages only)
  // ---------------------------------------------------------------------------
  const noteContent = document.querySelector('.note-content');

  if (noteContent) {
    const headings = noteContent.querySelectorAll('h2, h3');

    if (headings.length > 0) {
      // Assign IDs to headings that don't have one
      headings.forEach(function (heading) {
        if (!heading.id) {
          heading.id = slugify(heading.textContent);
        }
      });

      // Build ToC markup
      const toc = document.createElement('aside');
      toc.className = 'toc';

      const tocTitle = document.createElement('p');
      tocTitle.className = 'toc-title';
      tocTitle.textContent = 'On this page';
      toc.appendChild(tocTitle);

      const tocList = document.createElement('ul');
      tocList.className = 'toc-list';

      headings.forEach(function (heading) {
        const item = document.createElement('li');
        item.className = 'toc-item toc-item--' + heading.tagName.toLowerCase();

        const link = document.createElement('a');
        link.className = 'toc-link';
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;

        item.appendChild(link);
        tocList.appendChild(item);
      });

      toc.appendChild(tocList);

      // Insert ToC before .note-content
      noteContent.parentNode.insertBefore(toc, noteContent);

      // Highlight current section using IntersectionObserver
      const tocLinks = toc.querySelectorAll('.toc-link');

      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              tocLinks.forEach(function (link) {
                link.classList.remove('toc-link--active');
              });
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

      headings.forEach(function (heading) {
        observer.observe(heading);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // d) Smooth scroll for anchor links
  // ---------------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ---------------------------------------------------------------------------
  // e) Back to top button
  // ---------------------------------------------------------------------------
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '↑';
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', function () {
    if (window.scrollY > 300) {
      backToTop.classList.add('back-to-top--visible');
    } else {
      backToTop.classList.remove('back-to-top--visible');
    }
  }, { passive: true });

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------------------------------------------------------------------------
  // f) Notes menu toggle (note pages)
  // ---------------------------------------------------------------------------
  const notesMenuToggle = document.querySelector('.notes-menu-toggle');
  const notesMenu = document.querySelector('.notes-menu');
  const notesMenuOverlay = document.querySelector('.notes-menu-overlay');
  const notesMenuClose = document.querySelector('.notes-menu-close');

  if (notesMenuToggle && notesMenu && notesMenuOverlay) {
    function openNotesMenu() {
      notesMenu.classList.add('is-open');
      notesMenuOverlay.classList.add('is-open');
      notesMenuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeNotesMenu() {
      notesMenu.classList.remove('is-open');
      notesMenuOverlay.classList.remove('is-open');
      notesMenuToggle.setAttribute('aria-expanded', 'false');
    }

    notesMenuToggle.addEventListener('click', openNotesMenu);
    notesMenuOverlay.addEventListener('click', closeNotesMenu);

    if (notesMenuClose) {
      notesMenuClose.addEventListener('click', closeNotesMenu);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && notesMenu.classList.contains('is-open')) {
        closeNotesMenu();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------
  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
})();
