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
            aria-controls="ggg-mobile-menu"
          >
            <span></span>
            <span></span>
          </button>

        </div>

      </div>


      <div
        class="ggg-site-header__mobile-menu"
        id="ggg-mobile-menu"
        hidden
      >

        <nav
          class="ggg-site-header__mobile-nav"
          aria-label="Mobile navigation"
        >

          <a
            class="ggg-site-header__mobile-link"
            href="/"
            data-ggg-nav="home"
          >
            Home
          </a>

          <a
            class="ggg-site-header__mobile-link"
            href="/podcast"
            data-ggg-nav="podcast"
          >
            Podcast
          </a>

          <a
            class="ggg-site-header__mobile-link"
            href="/archive"
            data-ggg-nav="archive"
          >
            Archive
          </a>

          <a
            class="ggg-site-header__mobile-link"
            href="/emporium"
            data-ggg-nav="emporium"
          >
            Emporium
          </a>

        </nav>

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
        [
          '.ggg-site-header__nav-link',
          '.ggg-site-header__mobile-link'
        ].join(',')
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
     MOBILE MENU
  ======================================================== */

  function setupMobileMenu(
    header
  ) {

    const button =
      header.querySelector(
        '.ggg-site-header__menu'
      );

    const menu =
      header.querySelector(
        '.ggg-site-header__mobile-menu'
      );

    if (
      !button ||
      !menu
    ) {
      return;
    }


    function openMenu() {

      menu.hidden =
        false;

      header.classList.add(
        'is-menu-open'
      );

      button.setAttribute(
        'aria-expanded',
        'true'
      );

      button.setAttribute(
        'aria-label',
        'Close menu'
      );

      document.body.classList.add(
        'ggg-mobile-menu-open'
      );

    }


    function closeMenu() {

      menu.hidden =
        true;

      header.classList.remove(
        'is-menu-open'
      );

      button.setAttribute(
        'aria-expanded',
        'false'
      );

      button.setAttribute(
        'aria-label',
        'Open menu'
      );

      document.body.classList.remove(
        'ggg-mobile-menu-open'
      );

    }


    function toggleMenu() {

      const isOpen =
        button.getAttribute(
          'aria-expanded'
        ) === 'true';

      if (isOpen) {

        closeMenu();

      } else {

        openMenu();

      }

    }


    button.addEventListener(
      'click',
      toggleMenu
    );


    menu.addEventListener(
      'click',
      function (event) {

        if (
          event.target.closest(
            'a'
          )
        ) {

          closeMenu();

        }

      }
    );


    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key ===
          'Escape'
        ) {

          closeMenu();

        }

      }
    );


    document.addEventListener(
      'click',
      function (event) {

        const isOpen =
          button.getAttribute(
            'aria-expanded'
          ) === 'true';

        if (!isOpen) {
          return;
        }

        if (
          header.contains(
            event.target
          )
        ) {
          return;
        }

        closeMenu();

      }
    );


    window.addEventListener(
      'resize',
      function () {

        if (
          window.innerWidth >=
          768
        ) {

          closeMenu();

        }

      }
    );

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

    setupMobileMenu(
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
