/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v1.5

   COMPONENTS
   • Featured Investigation
   • Browse the Archive
   • Search the Archive
   • Latest Records
   • Collections
   • Open Investigations

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



  function createRecordCard(
    recordId,
    record
  ) {

    const article =
      createElement(
        'article',
        'ggg-archive-home-record'
      );


    article.dataset.recordId =
      recordId;



    /* ======================================================
       TYPE
    ====================================================== */

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



    /* ======================================================
       TITLE
    ====================================================== */

    const title =
      createElement(
        'h3',
        'ggg-archive-home-record__title',
        'print'
      );


    title.textContent =
      record.title ||
      recordId;



    /* ======================================================
       META
    ====================================================== */

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



    /* ======================================================
       LINK
    ====================================================== */

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



    /* ======================================================
       ASSEMBLE
    ====================================================== */

    article.append(
      type,
      title,
      meta,
      link
    );


    return article;

  }



  function normalizeSearchValue(value) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

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
     SEARCH THE ARCHIVE
  ======================================================== */

  function initSearch() {

    const section =
      document.querySelector(
        '[data-ggg-archive-search]'
      );


    if (!section) {

      return;

    }


    const form =
      section.querySelector(
        '[data-ggg-search-form]'
      );


    const input =
      section.querySelector(
        '[data-ggg-search-input]'
      );


    const results =
      section.querySelector(
        '[data-ggg-search-results]'
      );


    if (
      !form ||
      !input ||
      !results
    ) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    form.addEventListener(
      'submit',
      function (event) {

        event.preventDefault();


        const query =
          normalizeSearchValue(
            input.value
          );


        if (!query) {

          results.replaceChildren();

          results.hidden =
            true;

          return;

        }


        const matches =
          Object.entries(records)

            .filter(function (entry) {

              const recordId =
                entry[0];


              const record =
                entry[1] || {};


              const keywords =
                Array.isArray(
                  record.keywords
                )
                  ? record.keywords
                  : [];


              const searchable =
                [
                  recordId,
                  record.title,
                  record.type,
                  record.collection,
                  record.status,
                  record.summary
                ]
                  .concat(
                    keywords
                  )
                  .map(
                    normalizeSearchValue
                  )
                  .join(' ');


              return searchable.includes(
                query
              );

            })

            .sort(function (a, b) {

              const titleA =
                normalizeSearchValue(
                  a[1] &&
                  a[1].title
                );


              const titleB =
                normalizeSearchValue(
                  b[1] &&
                  b[1].title
                );


              return titleA.localeCompare(
                titleB
              );

            });


        results.replaceChildren();


        matches.forEach(
          function (entry) {

            results.appendChild(
              createRecordCard(
                entry[0],
                entry[1]
              )
            );

          }
        );


        results.hidden =
          false;


        console.log(
          'GGG Archive Home: Search',
          query,
          matches.map(
            function (entry) {

              return entry[0];

            }
          )
        );

      }
    );


    console.log(
      'GGG Archive Home: Search ready'
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


    latest.forEach(
      function (item) {

        grid.appendChild(
          createRecordCard(
            item.id,
            item.record
          )
        );

      }
    );


    console.log(
      'GGG Archive Home: Latest Records loaded',
      latest.map(function (item) {

        return item.id;

      })
    );

  }



  /* ========================================================
     COLLECTIONS
  ======================================================== */

  function renderCollections() {

    const section =
      document.querySelector(
        '[data-ggg-collections]'
      );


    if (!section) {

      return;

    }


    const grid =
      section.querySelector(
        '[data-ggg-collections-grid]'
      );


    if (!grid) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    const collectionCounts =
      Object.values(records)
        .reduce(function (
          counts,
          record
        ) {

          if (
            !record ||
            !record.collection
          ) {

            return counts;

          }


          const collection =
            String(
              record.collection
            ).trim();


          if (!collection) {

            return counts;

          }


          if (!counts[collection]) {

            counts[collection] =
              0;

          }


          counts[collection] +=
            1;


          return counts;

        }, {});


    const collections =
      Object.keys(
        collectionCounts
      )
        .sort(function (a, b) {

          return a.localeCompare(
            b
          );

        });


    grid.replaceChildren();


    collections.forEach(
      function (collection) {

        const link =
          createElement(
            'a',
            'ggg-archive-home-collection'
          );


        link.href =
          '#';


        link.dataset.gggCollection =
          collection;


        link.dataset.recordCount =
          String(
            collectionCounts[
              collection
            ]
          );



        const label =
          createElement(
            'span',
            '',
            'ink'
          );


        label.textContent =
          collection;



        const arrow =
          createElement(
            'span'
          );


        arrow.textContent =
          '→';


        arrow.setAttribute(
          'aria-hidden',
          'true'
        );


        const count =
          collectionCounts[
            collection
          ];


        link.setAttribute(
          'aria-label',
          collection +
          ', ' +
          count +
          (
            count === 1
              ? ' record'
              : ' records'
          )
        );


        link.append(
          label,
          arrow
        );


        grid.appendChild(
          link
        );

      }
    );


    console.log(
      'GGG Archive Home: Collections loaded',
      collectionCounts
    );

  }



  /* ========================================================
     OPEN INVESTIGATIONS
  ======================================================== */

  function renderOpenInvestigations() {

    const section =
      document.querySelector(
        '[data-ggg-open-investigations]'
      );


    if (!section) {

      return;

    }


    const container =
      section.querySelector(
        '[data-ggg-open-records]'
      );


    if (!container) {

      return;

    }


    const home =
      window.GGG.archive.getHomeConfig();


    const investigations =
      home &&
      Array.isArray(
        home.openInvestigations
      )
        ? home.openInvestigations
        : [];


    container.replaceChildren();


    investigations.forEach(
      function (investigation) {

        if (
          !investigation ||
          !investigation.question ||
          !investigation.record
        ) {

          return;

        }


        const recordId =
          investigation.record;


        const record =
          window.GGG.archive.getRecord(
            recordId
          );


        if (!record) {

          console.warn(
            'GGG Archive Home: Open Investigation record not found:',
            recordId
          );

          return;

        }


        const link =
          createElement(
            'a',
            'ggg-archive-home-open__record'
          );


        link.dataset.recordId =
          recordId;


        if (record.url) {

          link.href =
            record.url;

        }
        else {

          link.href =
            '#';

        }



        const question =
          createElement(
            'span',
            '',
            'ink'
          );


        question.textContent =
          investigation.question;



        const arrow =
          createElement(
            'span'
          );


        arrow.textContent =
          '→';


        arrow.setAttribute(
          'aria-hidden',
          'true'
        );


        link.append(
          question,
          arrow
        );


        container.appendChild(
          link
        );

      }
    );


    console.log(
      'GGG Archive Home: Open Investigations loaded',
      investigations.map(
        function (investigation) {

          return investigation.record;

        }
      )
    );

  }



  /* ========================================================
     RENDER ARCHIVE HOME
  ======================================================== */

  function renderArchiveHome() {

    renderFeaturedInvestigation();

    renderBrowse();

    initSearch();

    renderLatestRecords();

    renderCollections();

    renderOpenInvestigations();

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
