/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v1.0 — Featured Investigation

   PURPOSE
   Renders Archive Home components from the shared Archive
   data API.

   DEPENDS ON
   • ggg-archive.js
========================================================== */


(function () {

  'use strict';


  /* ========================================================
     CONFIG
  ======================================================== */

  const MAX_ATTEMPTS =
    50;

  const RETRY_DELAY =
    100;


  let attempts =
    0;



  /* ========================================================
     FEATURED INVESTIGATION
  ======================================================== */

  function renderFeaturedInvestigation() {

    const section =
      document.querySelector(
        '[data-ggg-featured-investigation]'
      );


    if (!section) {

      return;

    }


    const home =
      window.GGG.archive.getHomeConfig();


    const featured =
      home &&
      home.featuredInvestigation;


    if (
      !featured ||
      !featured.record
    ) {

      console.warn(
        'GGG Archive Home: No Featured Investigation configured.'
      );

      return;

    }


    const recordId =
      featured.record;


    const record =
      window.GGG.archive.getRecord(
        recordId
      );


    if (!record) {

      console.warn(
        'GGG Archive Home: Featured record not found:',
        recordId
      );

      return;

    }


    const recordElement =
      section.querySelector(
        '[data-ggg-featured-record]'
      );


    const meta =
      section.querySelector(
        '[data-ggg-featured-meta]'
      );


    const title =
      section.querySelector(
        '[data-ggg-featured-title]'
      );


    const summary =
      section.querySelector(
        '[data-ggg-featured-summary]'
      );


    const link =
      section.querySelector(
        '[data-ggg-featured-link]'
      );


    if (recordElement) {

      recordElement.dataset.recordId =
        recordId;

    }


    if (meta) {

      meta.textContent =
        [
          record.type,
          record.status
        ]
          .filter(Boolean)
          .join(' · ')
          .toUpperCase();

    }


    if (
      title &&
      record.title
    ) {

      title.textContent =
        record.title;

    }


    if (
      summary &&
      record.summary
    ) {

      summary.textContent =
        record.summary;

    }


    if (
      link &&
      record.url
    ) {

      link.href =
        record.url;

    }


    console.log(
      'GGG Archive Home: Featured Investigation loaded',
      recordId,
      record
    );

  }



  /* ========================================================
     RENDER
  ======================================================== */

  function renderArchiveHome() {

    renderFeaturedInvestigation();

  }



  /* ========================================================
     INITIALIZE

     Waits for the shared Archive API, initializes its data,
     then renders Archive Home.
  ======================================================== */

  function initArchiveHome() {

    if (
      !window.GGG ||
      !window.GGG.archive ||
      typeof window.GGG.archive.init !== 'function'
    ) {

      attempts += 1;


      if (attempts < MAX_ATTEMPTS) {

        window.setTimeout(
          initArchiveHome,
          RETRY_DELAY
        );

        return;

      }


      console.warn(
        'GGG Archive Home: Archive API did not become available.'
      );

      return;

    }


    window.GGG.archive
      .init()
      .then(
        function () {

          renderArchiveHome();

        }
      )
      .catch(
        function (error) {

          console.error(
            'GGG Archive Home:',
            error
          );

        }
      );

  }



  /* ========================================================
     START
  ======================================================== */

  initArchiveHome();


})();
