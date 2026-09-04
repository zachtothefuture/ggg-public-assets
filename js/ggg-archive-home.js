/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v1.1

   COMPONENTS
   • Featured Investigation
   • Latest Records

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

  const LATEST_RECORD_LIMIT =
    3;


  let attempts =
    0;



  /* ========================================================
     HELPERS
  ======================================================== */

  function createElement(
    tagName,
    className,
    material
  ) {

    const element =
      document.createElement(
        tagName
      );


    if (className) {

      element.className =
        className;

    }


    if (material) {

      element.setAttribute(
        'data-ggg-material',
        material
      );

    }


    return element;

  }



  function getRecordId(record) {

    if (
      !record ||
      !window.GGG ||
      !window.GGG.archive
    ) {

      return '';

    }


    const records =
      window.GGG.archive.getAllRecords();


    const match =
      Object.entries(records)
        .find(function (entry) {

          return entry[1] === record;

        });


    return match
      ? match[0]
      : '';

  }



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
     LATEST RECORDS
  ======================================================== */

  function renderLatestRecords() {

    const section =
      document.querySelector(
        '[data-ggg-latest-records]'
      );


    if (!section) {

      return;

    }


    const grid =
      section.querySelector(
        '[data-ggg-latest-grid]'
      );


    if (!grid) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    /*
      Convert the record object into an array while preserving
      the canonical Record ID.
    */

    const latest =
      Object.entries(records)

        .map(function (entry) {

          return {
            id:
              entry[0],

            record:
              entry[1]
          };

        })

        /*
          Records without a valid dateAdded are intentionally
          excluded from Latest Records.
        */

        .filter(function (item) {

          return (
            item.record &&
            item.record.dateAdded &&
            /^\d{4}-\d{2}-\d{2}$/.test(
              item.record.dateAdded
            )
          );

        })

        /*
          ISO YYYY-MM-DD dates sort correctly as strings.
          Newest records appear first.
        */

        .sort(function (a, b) {

          return b.record.dateAdded
            .localeCompare(
              a.record.dateAdded
            );

        })

        .slice(
          0,
          LATEST_RECORD_LIMIT
        );


    grid.replaceChildren();


    latest.forEach(function (item) {

      const record =
        item.record;


      /* ====================================================
         CARD
      ==================================================== */

      const article =
        createElement(
          'article',
          'ggg-archive-home-record'
        );


      article.dataset.recordId =
        item.id;



      /* ====================================================
         TYPE
      ==================================================== */

      const type =
        createElement(
          'div',
          'ggg-archive-home-record__type',
          'print'
        );


      type.textContent =
        (
          record.type ||
          'Record'
        ).toUpperCase();



      /* ====================================================
         TITLE
      ==================================================== */

      const title =
        createElement(
          'h3',
          'ggg-archive-home-record__title',
          'print'
        );


      title.textContent =
        record.title ||
        item.id;



      /* ====================================================
         META
      ==================================================== */

      const meta =
        createElement(
          'div',
          'ggg-archive-home-record__meta',
          'ink'
        );


      meta.textContent =
        [
          record.collection,
          record.status
        ]
          .filter(Boolean)
          .join(' · ');



      /* ====================================================
         LINK
      ==================================================== */

      const link =
        createElement(
          'a',
          'ggg-archive-home-record__link',
          'glass'
        );


      link.textContent =
        'Open Record';


      if (record.url) {

        link.href =
          record.url;

      }



      /* ====================================================
         ASSEMBLE
      ==================================================== */

      article.append(
        type,
        title,
        meta,
        link
      );


      grid.appendChild(
        article
      );

    });


    console.log(
      'GGG Archive Home: Latest Records loaded',
      latest.map(function (item) {

        return item.id;

      })
    );

  }



  /* ========================================================
     RENDER ARCHIVE HOME
  ======================================================== */

  function renderArchiveHome() {

    renderFeaturedInvestigation();

    renderLatestRecords();

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


      if (
        attempts <
        MAX_ATTEMPTS
      ) {

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

      .then(function () {

        renderArchiveHome();

      })

      .catch(function (error) {

        console.error(
          'GGG Archive Home:',
          error
        );

      });

  }



  /* ========================================================
     START
  ======================================================== */

  initArchiveHome();


})();
