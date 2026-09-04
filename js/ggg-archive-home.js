/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v1.2

   COMPONENTS
   • Featured Investigation
   • Browse the Archive
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
     RECORD TYPE LABELS

     Canonical record types live in archive-records.json.

     These labels control only how those types are presented
     in Browse the Archive.
  ======================================================== */

  const TYPE_LABELS = {

    'Artifact':
      'Artifacts',

    'Person':
      'People',

    'Place':
      'Places',

    'Case':
      'Cases',

    'Collection':
      'Collections',

    'Event':
      'Events',

    'Broadcast':
      'Broadcasts',

    'Document':
      'Documents',

    'Photograph':
      'Photographs',

    'Audio Recording':
      'Audio',

    'Film/Video':
      'Film & Video',

    'Organization':
      'Organizations',

    'Publication':
      'Publications'

  };



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
     BROWSE THE ARCHIVE
  ======================================================== */

  function renderBrowse() {

    const section =
      document.querySelector(
        '[data-ggg-browse]'
      );


    if (!section) {

      return;

    }


    const navigation =
      section.querySelector(
        '[data-ggg-browse-types]'
      );


    if (!navigation) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    /*
      Count records by canonical type.
    */

    const typeCounts =
      Object.values(records)
        .reduce(function (
          counts,
          record
        ) {

          if (
            !record ||
            !record.type
          ) {

            return counts;

          }


          if (!counts[record.type]) {

            counts[record.type] =
              0;

          }


          counts[record.type] +=
            1;


          return counts;

        }, {});


    /*
      Preserve canonical type order by using TYPE_LABELS
      rather than alphabetizing whatever happens to exist.
    */

    const availableTypes =
      Object.keys(TYPE_LABELS)
        .filter(function (type) {

          return Boolean(
            typeCounts[type]
          );

        });


    navigation.replaceChildren();



    /* ======================================================
       ALL RECORDS
    ====================================================== */

    const allRecords =
      createElement(
        'a'
      );


    allRecords.href =
      '#';


    allRecords.textContent =
      'All Records';


    allRecords.dataset.gggBrowseType =
      'all';


    allRecords.dataset.recordCount =
      String(
        Object.keys(records).length
      );


    allRecords.setAttribute(
      'aria-label',
      'All Records, ' +
      Object.keys(records).length +
      ' records'
    );


    navigation.appendChild(
      allRecords
    );



    /* ======================================================
       RECORD TYPES
    ====================================================== */

    availableTypes.forEach(
      function (type) {

        const link =
          createElement(
            'a'
          );


        const count =
          typeCounts[type];


        link.href =
          '#';


        link.textContent =
          TYPE_LABELS[type];


        link.dataset.gggBrowseType =
          type;


        link.dataset.recordCount =
          String(count);


        link.setAttribute(
          'aria-label',
          TYPE_LABELS[type] +
          ', ' +
          count +
          (
            count === 1
              ? ' record'
              : ' records'
          )
        );


        navigation.appendChild(
          link
        );

      }
    );


    console.log(
      'GGG Archive Home: Browse loaded',
      typeCounts
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

        .filter(function (item) {

          return (
            item.record &&
            item.record.dateAdded &&
            /^\d{4}-\d{2}-\d{2}$/.test(
              item.record.dateAdded
            )
          );

        })

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

    renderBrowse();

    renderLatestRecords();

  }



  /* ========================================================
     INITIALIZE
  ======================================================== */

  function initArchiveHome() {

    if (
      !window.GGG ||
      !window.GGG.archive ||
      typeof window.GGG.archive.init !== 'function'
    ) {

      attempts +=
        1;


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
