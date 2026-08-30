(function () {

  'use strict';


  /* ========================================================
     PAGE OPT-OUT
  ======================================================== */

  const PAGE =
    window.GGG_SITE_HEADER_PAGE;


  if (
    PAGE &&
    PAGE.enabled === false
  ) {
    return;
  }


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
            class="ggg-site-header__light-toggle"
            type="button"
            aria-label="Turn flashlight off"
            aria-pressed="true"
          >
            <span
              class="ggg-site-header__icon ggg-site-header__light-icon"
              aria-hidden="true"
            ></span>
          </button>


          <a
            class="ggg-site-header__cart"
            href="/cart"
            aria-label="Open cart"
          >
            <span
              class="ggg-site-header__icon ggg-site-header__cart-icon"
              aria-hidden="true"
            ></span>

            <span
              class="ggg-site-header__cart-count"
              aria-hidden="true"
              hidden
            ></span>
          </a>


          <button
            class="ggg-site-header__menu"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="ggg-mobile-menu"
          >
            <span
              class="ggg-site-header__icon ggg-site-header__menu-icon"
              aria-hidden="true"
            ></span>
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
     FLASHLIGHT TOGGLE
  ======================================================== */

  function setupLightingToggle(
    header
  ) {

    const button =
      header.querySelector(
        '.ggg-site-header__light-toggle'
      );

    if (!button) {
      return;
    }


    function updateState(
      enabled
    ) {

      button.setAttribute(
        'aria-pressed',
        enabled
          ? 'true'
          : 'false'
      );


      button.setAttribute(
        'aria-label',
        enabled
          ? 'Turn flashlight off'
          : 'Turn flashlight on'
      );


      button.classList.toggle(
        'is-active',
        enabled
      );

    }


    button.addEventListener(
      'click',
      function () {

        window.dispatchEvent(
          new CustomEvent(
            'ggg:lighting-toggle'
          )
        );

      }
    );


    window.addEventListener(
      'ggg:lighting-state',
      function (event) {

        if (
          !event.detail ||
          typeof event.detail.enabled !==
          'boolean'
        ) {
          return;
        }


        updateState(
          event.detail.enabled
        );

      }
    );


    if (
      window.GGG_LIGHTING_ENGINE &&
      typeof window.GGG_LIGHTING_ENGINE.enabled ===
      'boolean'
    ) {

      updateState(
        window.GGG_LIGHTING_ENGINE.enabled
      );

    } else {

      updateState(
        true
      );

    }

  }


  /* ========================================================
     CART QUANTITY SYNC
  ======================================================== */

  function setupCartQuantity(
    header
  ) {

    const customCart =
      header.querySelector(
        '.ggg-site-header__cart'
      );


    const countElement =
      header.querySelector(
        '.ggg-site-header__cart-count'
      );


    if (
      !customCart ||
      !countElement
    ) {
      return;
    }


    function parseCount(
      label
    ) {

      if (!label) {
        return 0;
      }


      const normalized =
        label
          .trim()
          .toLowerCase();


      if (
        normalized.includes(
          'no items'
        )
      ) {
        return 0;
      }


      if (
        normalized.includes(
          'one item'
        )
      ) {
        return 1;
      }


      const match =
        normalized.match(
          /(\d+)\s+items?/
        );


      if (
        match &&
        match[1]
      ) {

        return parseInt(
          match[1],
          10
        );

      }


      return 0;

    }


    function updateCart(
      nativeCart
    ) {

      if (!nativeCart) {
        return;
      }


      const label =
        nativeCart.getAttribute(
          'aria-label'
        ) ||
        '';


      const count =
        parseCount(
          label
        );


      const hasItems =
        count > 0;


      customCart.classList.toggle(
        'has-items',
        hasItems
      );


      customCart.classList.toggle(
        'has-multi-digit-count',
        count >= 10
      );


      if (
        hasItems
      ) {

        countElement.hidden =
          false;


        countElement.textContent =
          String(
            count
          );


        customCart.setAttribute(
          'aria-label',
          count === 1
            ? 'Open cart — 1 item'
            : 'Open cart — ' +
              count +
              ' items'
        );

      } else {

        countElement.hidden =
          true;


        countElement.textContent =
          '';


        customCart.setAttribute(
          'aria-label',
          'Open cart'
        );

      }

    }


    function connect(
      nativeCart
    ) {

      updateCart(
        nativeCart
      );


      const observer =
        new MutationObserver(
          function () {

            updateCart(
              nativeCart
            );

          }
        );


      observer.observe(
        nativeCart,
        {
          attributes:
            true,

          attributeFilter: [
            'aria-label',
            'class'
          ],

          childList:
            true,

          subtree:
            true
        }
      );

    }


    const existing =
      document.querySelector(
        '.sqs-custom-cart'
      );


    if (existing) {

      connect(
        existing
      );

      return;

    }


    const bodyObserver =
      new MutationObserver(
        function () {

          const nativeCart =
            document.querySelector(
              '.sqs-custom-cart'
            );


          if (!nativeCart) {
            return;
          }


          bodyObserver.disconnect();


          connect(
            nativeCart
          );

        }
      );


    bodyObserver.observe(
      document.body,
      {
        childList:
          true,

        subtree:
          true
      }
    );

  }


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


  let openedWithKeyboard =
    false;


  function getFocusableElements() {

    return Array.from(
      menu.querySelectorAll(
        [
          'a[href]',
          'button:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(',')
      )
    ).filter(function (element) {

      return !element.hasAttribute(
        'hidden'
      );

    });

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


    if (
      openedWithKeyboard
    ) {

      const focusable =
        getFocusableElements();


      if (
        focusable.length
      ) {

        requestAnimationFrame(
          function () {

            focusable[0].focus();

          }
        );

      }

    }

  }


  function closeMenu(
    restoreFocus
  ) {

    const wasOpen =
      button.getAttribute(
        'aria-expanded'
      ) === 'true';


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


    if (
      wasOpen &&
      restoreFocus
    ) {

      requestAnimationFrame(
        function () {

          button.focus();

        }
      );

    }


    openedWithKeyboard =
      false;

  }


  function toggleMenu() {

    const isOpen =
      button.getAttribute(
        'aria-expanded'
      ) === 'true';


    if (isOpen) {

      closeMenu(
        openedWithKeyboard
      );

    } else {

      openMenu();

    }

  }


  button.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key ===
        'Enter' ||
        event.key ===
        ' '
      ) {

        openedWithKeyboard =
          true;

      }

    }
  );


  button.addEventListener(
    'pointerdown',
    function () {

      openedWithKeyboard =
        false;

    }
  );


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

        closeMenu(
          false
        );

      }

    }
  );


  document.addEventListener(
    'keydown',
    function (event) {

      const isOpen =
        button.getAttribute(
          'aria-expanded'
        ) === 'true';


      if (
        !isOpen
      ) {
        return;
      }


      if (
        event.key ===
        'Escape'
      ) {

        event.preventDefault();

        closeMenu(
          true
        );

        return;
      }


      if (
        event.key !==
        'Tab'
      ) {
        return;
      }


      const focusable =
        getFocusableElements();


      if (
        !focusable.length
      ) {
        return;
      }


      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];


      if (
        event.shiftKey &&
        document.activeElement ===
        first
      ) {

        event.preventDefault();

        last.focus();

        return;
      }


      if (
        !event.shiftKey &&
        document.activeElement ===
        last
      ) {

        event.preventDefault();

        first.focus();

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


      if (
        !isOpen
      ) {
        return;
      }


      if (
        header.contains(
          event.target
        )
      ) {
        return;
      }


      closeMenu(
        false
      );

    }
  );


  window.addEventListener(
    'resize',
    function () {

      if (
        window.innerWidth >=
        768
      ) {

        closeMenu(
          false
        );

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


    setupLightingToggle(
      header
    );


    setupCartQuantity(
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
