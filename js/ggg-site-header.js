(function () {

  'use strict';


  /* ========================================================
     GUARD
  ======================================================== */

  if (
    document.querySelector(
      '[data-ggg-header]'
    )
  ) {
    return;
  }


  /* ========================================================
     CREATE HEADER
  ======================================================== */

  function createHeader() {

    const header =
      document.createElement(
        'header'
      );

    header.className =
      'ggg-site-header';

    header.setAttribute(
      'data-ggg-header',
      ''
    );

    header.innerHTML = `
      <div class="ggg-site-header__inner">

        <a
          class="ggg-site-header__brand"
          href="/"
          aria-label="The Guild of Ghostly Grounds — Home"
        >
          <span
            class="ggg-site-header__brand-mark"
            aria-hidden="true"
          ></span>
        </a>


        <nav
          class="ggg-site-header__nav"
          aria-label="Primary navigation"
        >

          <a
            class="ggg-site-header__nav-link"
            href="/"
            data-ggg-nav="home"
          >
            Home
          </a>

          <a
            class="ggg-site-header__nav-link"
            href="/podcast"
            data-ggg-nav="podcast"
          >
            Podcast
          </a>

          <a
            class="ggg-site-header__nav-link"
            href="/archive"
            data-ggg-nav="archive"
          >
            Archive
          </a>

          <a
            class="ggg-site-header__nav-link"
            href="/emporium"
            data-ggg-nav="emporium"
          >
            Emporium
          </a>

        </nav>


        <div class="ggg-site-header__actions">

          <button
            class="ggg-site-header__cart"
            type="button"
            aria-label="Open cart"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4 5h2l2.1 9h9.8l2-6H7.2M10 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
          </button>

          <button
            class="ggg-site-header__menu"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <span></span>
            <span></span>
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      header
    );

    return header;

  }


  /* ========================================================
     ACTIVE NAVIGATION
  ======================================================== */

  function setActiveNavigation(
    header
  ) {

    const pathname =
      window.location.pathname
        .replace(/\/+$/, '') ||
      '/';

    const links =
      header.querySelectorAll(
        '.ggg-site-header__nav-link'
      );

    links.forEach(function (link) {

      const href =
        link.getAttribute(
          'href'
        );

      if (!href) {
        return;
      }


      let isActive =
        false;


      if (href === '/') {

        isActive =
          pathname === '/';

      } else {

        isActive =
          pathname === href ||
          pathname.startsWith(
            href + '/'
          );

      }


      if (isActive) {

        link.setAttribute(
          'aria-current',
          'page'
        );

      } else {

        link.removeAttribute(
          'aria-current'
        );

      }

    });

  }


  /* ========================================================
     BOOT
  ======================================================== */

  function boot() {

    if (!document.body) {
      return;
    }

    const header =
      createHeader();

    if (!header) {
      return;
    }

    setActiveNavigation(
      header
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }

})();
