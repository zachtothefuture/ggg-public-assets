/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v2.2

   COMPONENTS
   • Featured Investigation
   • Archive Index
   • Browse by Record Type
   • Browse by Collection
   • Search the Archive
   • Latest Records
   • Open Investigations
   • Recent Activity
   • Archive Statistics

   ARCHIVE INDEX INPUTS
   • Search Query
   • Record Type
   • Collection
   • All Records

   SEARCH INTERACTION
   • Custom clear control
   • Clear hides Archive Index
   • Clear returns focus to input

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



  function normalizeSearchValue(value) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }



  function formatArchiveDate(value) {

    if (
      !value ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

      return value || '';

    }


    const parts =
      value.split('-');


    const date =
      new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      );


    return date.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    );

  }



  function sortRecordsByTitle(entries) {

    return entries.sort(
      function (a, b) {

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

      }
    );

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



    const title =
      createElement(
        'h3',
        'ggg-archive-home-record__title',
        'print'
      );


    title.textContent =
      record.title ||
      recordId;



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



    article.append(
      type,
      title,
      meta,
      link
    );


    return article;

  }



  /* ========================================================
     ARCHIVE INDEX
  ======================================================== */

  function getIndexElements() {

    const section =
      document.querySelector(
        '[data-ggg-archive-index]'
      );


    if (!section) {

      return null;

    }


    return {

      section:
        section,

      form:
        section.querySelector(
          '[data-ggg-search-form]'
        ),

      input:
        section.querySelector(
          '[data-ggg-search-input]'
        ),

      clear:
        section.querySelector(
          '[data-ggg-search-clear]'
        ),

      index:
        section.querySelector(
          '[data-ggg-index]'
        ),

      status:
        section.querySelector(
          '[data-ggg-index-status]'
        ),

      results:
        section.querySelector(
          '[data-ggg-index-results]'
        )

    };

  }



  function updateSearchClearControl() {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.input ||
      !elements.clear
    ) {

      return;

    }


    const hasValue =
      Boolean(
        String(
          elements.input.value || ''
        ).length
      );


    elements.clear.hidden =
      !hasValue;

  }



  function createIndexRow(
    recordId,
    record
  ) {

    const link =
      createElement(
        'a',
        'ggg-archive-home-index__row'
      );


    link.dataset.recordId =
      recordId;


    link.href =
      record.url ||
      '#';



    const type =
      createElement(
        'span',
        'ggg-archive-home-index__type',
        'print'
      );


    type.textContent =
      (
        record.type ||
        'Record'
      ).toUpperCase();



    const id =
      createElement(
        'span',
        'ggg-archive-home-index__id',
        'print'
      );


    id.textContent =
      recordId;



    const title =
      createElement(
        'span',
        'ggg-archive-home-index__title',
        'ink'
      );


    title.textContent =
      record.title ||
      recordId;



    const arrow =
      createElement(
        'span',
        'ggg-archive-home-index__arrow'
      );


    arrow.textContent =
      '→';


    arrow.setAttribute(
      'aria-hidden',
      'true'
    );



    link.append(
      type,
      id,
      title,
      arrow
    );


    return link;

  }



  function hideArchiveIndex() {

    const elements =
      getIndexElements();


    if (!elements) {

      return;

    }


    if (elements.results) {

      elements.results.replaceChildren();

    }


    if (elements.status) {

      elements.status.textContent =
        '';

    }


    if (elements.index) {

      elements.index.hidden =
        true;

    }

  }



  function clearArchiveSearch(
    shouldFocus
  ) {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.input
    ) {

      return;

    }


    elements.input.value =
      '';


    hideArchiveIndex();

    updateSearchClearControl();


    if (
      shouldFocus &&
      typeof elements.input.focus ===
        'function'
    ) {

      elements.input.focus();

    }


    console.log(
      'GGG Archive Home: Archive Index reset'
    );

  }



  function getIndexStatusText(
    mode,
    count,
    value
  ) {

    if (mode === 'search') {

      if (count === 0) {

        return (
          'NO RECORDS FOUND FOR “' +
          value.toUpperCase() +
          '”'
        );

      }


      if (count === 1) {

        return (
          '1 RECORD FOUND FOR “' +
          value.toUpperCase() +
          '”'
        );

      }


      return (
        count +
        ' RECORDS FOUND FOR “' +
        value.toUpperCase() +
        '”'
      );

    }



    if (mode === 'type') {

      if (count === 1) {

        return (
          '1 ' +
          String(value).toUpperCase() +
          ' RECORD'
        );

      }


      return (
        count +
        ' ' +
        String(value).toUpperCase() +
        ' RECORDS'
      );

    }



    if (mode === 'collection') {

      if (count === 1) {

        return (
          '1 RECORD IN ' +
          String(value).toUpperCase()
        );

      }


      return (
        count +
        ' RECORDS IN ' +
        String(value).toUpperCase()
      );

    }



    if (count === 1) {

      return '1 RECORD';

    }


    return (
      count +
      ' RECORDS'
    );

  }



  function renderArchiveIndex(
    entries,
    options
  ) {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.index ||
      !elements.results ||
      !elements.status
    ) {

      return;

    }


    const settings =
      options || {};


    const mode =
      settings.mode ||
      'all';


    const value =
      settings.value ||
      '';


    elements.results.replaceChildren();


    entries.forEach(
      function (entry) {

        elements.results.appendChild(
          createIndexRow(
            entry[0],
            entry[1]
          )
        );

      }
    );


    elements.status.textContent =
      getIndexStatusText(
        mode,
        entries.length,
        value
      );


    elements.index.hidden =
      false;


    console.log(
      'GGG Archive Home: Archive Index rendered',
      {
        mode:
          mode,

        value:
          value,

        records:
          entries.map(
            function (entry) {

              return entry[0];

            }
          )
      }
    );

  }



  function scrollToArchiveIndex() {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.section
    ) {

      return;

    }


    elements.section.scrollIntoView({
      behavior:
        'smooth',

      block:
        'start'
    });

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
     BROWSE BY RECORD TYPE
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



  function initBrowseInteraction() {

    const navigation =
      document.querySelector(
        '[data-ggg-browse-types]'
      );


    if (!navigation) {

      return;

    }


    navigation.addEventListener(
      'click',
      function (event) {

        const link =
          event.target.closest(
            '[data-ggg-browse-type]'
          );


        if (
          !link ||
          !navigation.contains(link)
        ) {

          return;

        }


        event.preventDefault();


        const type =
          link.dataset.gggBrowseType;


        const records =
          window.GGG.archive.getAllRecords();


        let matches =
          Object.entries(records);


        if (
          type &&
          type !== 'all'
        ) {

          matches =
            matches.filter(
              function (entry) {

                return (
                  entry[1] &&
                  entry[1].type ===
                    type
                );

              }
            );

        }


        sortRecordsByTitle(
          matches
        );


        const index =
          getIndexElements();


        if (
          index &&
          index.input
        ) {

          index.input.value =
            '';

          updateSearchClearControl();

        }


        renderArchiveIndex(
          matches,
          {
            mode:
              (
                type === 'all'
                  ? 'all'
                  : 'type'
              ),

            value:
              type
          }
        );


        scrollToArchiveIndex();

      }
    );


    console.log(
      'GGG Archive Home: Browse interaction ready'
    );

  }



  /* ========================================================
     SEARCH THE ARCHIVE
  ======================================================== */

  function initSearch() {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.form ||
      !elements.input
    ) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    updateSearchClearControl();



    elements.form.addEventListener(
      'submit',
      function (event) {

        event.preventDefault();


        const rawQuery =
          String(
            elements.input.value || ''
          ).trim();


        const query =
          normalizeSearchValue(
            rawQuery
          );


        updateSearchClearControl();


        if (!query) {

          hideArchiveIndex();

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

            });


        sortRecordsByTitle(
          matches
        );


        renderArchiveIndex(
          matches,
          {
            mode:
              'search',

            value:
              rawQuery
          }
        );


        console.log(
          'GGG Archive Home: Search',
          rawQuery,
          matches.map(
            function (entry) {

              return entry[0];

            }
          )
        );

      }
    );



    elements.input.addEventListener(
      'input',
      function () {

        const query =
          normalizeSearchValue(
            elements.input.value
          );


        updateSearchClearControl();


        if (!query) {

          hideArchiveIndex();


          console.log(
            'GGG Archive Home: Archive Index reset'
          );

        }

      }
    );



    if (elements.clear) {

      elements.clear.addEventListener(
        'click',
        function () {

          clearArchiveSearch(
            true
          );

        }
      );

    }


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
     BROWSE BY COLLECTION
  ======================================================== */

  function renderCollections() {

    const grid =
      document.querySelector(
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



  function initCollectionInteraction() {

    const grid =
      document.querySelector(
        '[data-ggg-collections-grid]'
      );


    if (!grid) {

      return;

    }


    grid.addEventListener(
      'click',
      function (event) {

        const link =
          event.target.closest(
            '[data-ggg-collection]'
          );


        if (
          !link ||
          !grid.contains(link)
        ) {

          return;

        }


        event.preventDefault();


        const collection =
          link.dataset.gggCollection;


        const records =
          window.GGG.archive.getAllRecords();


        const matches =
          Object.entries(records)

            .filter(function (entry) {

              return (
                entry[1] &&
                entry[1].collection ===
                  collection
              );

            });


        sortRecordsByTitle(
          matches
        );


        const index =
          getIndexElements();


        if (
          index &&
          index.input
        ) {

          index.input.value =
            '';

          updateSearchClearControl();

        }


        renderArchiveIndex(
          matches,
          {
            mode:
              'collection',

            value:
              collection
          }
        );


        scrollToArchiveIndex();

      }
    );


    console.log(
      'GGG Archive Home: Collection interaction ready'
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


        link.href =
          record.url ||
          '#';



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
     RECENT ACTIVITY
  ======================================================== */

  function renderRecentActivity() {

    const section =
      document.querySelector(
        '[data-ggg-recent-activity]'
      );


    if (!section) {

      return;

    }


    const log =
      section.querySelector(
        '[data-ggg-activity-log]'
      );


    if (!log) {

      return;

    }


    const home =
      window.GGG.archive.getHomeConfig();


    const activity =
      home &&
      Array.isArray(
        home.recentActivity
      )
        ? home.recentActivity
        : [];


    log.replaceChildren();


    const sortedActivity =
      activity
        .slice()
        .sort(function (a, b) {

          const dateA =
            (
              a &&
              a.date
            ) || '';


          const dateB =
            (
              b &&
              b.date
            ) || '';


          return dateB.localeCompare(
            dateA
          );

        });


    sortedActivity.forEach(
      function (entry) {

        if (
          !entry ||
          !entry.date ||
          !entry.type ||
          !entry.record
        ) {

          return;

        }


        const recordId =
          entry.record;


        const record =
          window.GGG.archive.getRecord(
            recordId
          );


        if (!record) {

          console.warn(
            'GGG Archive Home: Recent Activity record not found:',
            recordId
          );

          return;

        }


        const row =
          createElement(
            'div',
            'ggg-archive-home-activity__entry'
          );


        row.dataset.recordId =
          recordId;



        const time =
          createElement(
            'time',
            '',
            'print'
          );


        time.dateTime =
          entry.date;


        time.textContent =
          formatArchiveDate(
            entry.date
          );



        const activityType =
          createElement(
            'span',
            '',
            'print'
          );


        activityType.textContent =
          entry.type;



        const link =
          createElement(
            'a',
            '',
            'ink'
          );


        link.textContent =
          record.title ||
          recordId;


        link.href =
          record.url ||
          '#';


        row.append(
          time,
          activityType,
          link
        );


        log.appendChild(
          row
        );

      }
    );


    console.log(
      'GGG Archive Home: Recent Activity loaded',
      sortedActivity
    );

  }



  /* ========================================================
     ARCHIVE STATISTICS
  ======================================================== */

  function renderStatistics() {

    const section =
      document.querySelector(
        '[data-ggg-statistics]'
      );


    if (!section) {

      return;

    }


    const grid =
      section.querySelector(
        '[data-ggg-statistics-grid]'
      );


    if (!grid) {

      return;

    }


    const records =
      window.GGG.archive.getAllRecords();


    const home =
      window.GGG.archive.getHomeConfig();


    const recordList =
      Object.values(records);


    const totalRecords =
      recordList.length;


    const artifacts =
      recordList.filter(
        function (record) {

          return (
            record &&
            record.type ===
              'Artifact'
          );

        }
      ).length;


    const people =
      recordList.filter(
        function (record) {

          return (
            record &&
            record.type ===
              'Person'
          );

        }
      ).length;


    const documentaryTypes =
      [
        'Document',
        'Audio Recording',
        'Film/Video'
      ];


    const documentaryRecords =
      recordList.filter(
        function (record) {

          return (
            record &&
            documentaryTypes.includes(
              record.type
            )
          );

        }
      ).length;


    const openInvestigations =
      recordList.filter(
        function (record) {

          return (
            record &&
            record.status ===
              'Under Investigation'
          );

        }
      ).length;


    const unresolvedQuestions =
      (
        home &&
        Array.isArray(
          home.openInvestigations
        )
      )
        ? home.openInvestigations
            .filter(
              function (investigation) {

                return Boolean(
                  investigation &&
                  investigation.question
                );

              }
            )
            .length
        : 0;


    const statistics =
      [

        {
          label:
            'Total Records',

          value:
            totalRecords,

          description:
            'Catalogued Records'
        },

        {
          label:
            'Artifacts',

          value:
            artifacts,

          description:
            'Physical Objects'
        },

        {
          label:
            'People',

          value:
            people,

          description:
            'Biographical Records'
        },

        {
          label:
            'Documentary Records',

          value:
            documentaryRecords,

          description:
            'Documents · Audio · Film'
        },

        {
          label:
            'Open Investigations',

          value:
            openInvestigations,

          description:
            'Currently Active'
        },

        {
          label:
            'Unresolved Questions',

          value:
            unresolvedQuestions,

          description:
            'Awaiting Evidence'
        }

      ];


    grid.replaceChildren();


    statistics.forEach(
      function (statistic) {

        const item =
          createElement(
            'div'
          );


        const term =
          createElement(
            'dt',
            '',
            'print'
          );


        term.textContent =
          statistic.label;



        const value =
          createElement(
            'dd',
            '',
            'print'
          );


        value.textContent =
          String(
            statistic.value
          );



        const description =
          createElement(
            'span',
            '',
            'ink'
          );


        description.textContent =
          statistic.description;


        item.append(
          term,
          value,
          description
        );


        grid.appendChild(
          item
        );

      }
    );


    console.log(
      'GGG Archive Home: Statistics loaded',
      {
        totalRecords:
          totalRecords,

        artifacts:
          artifacts,

        people:
          people,

        documentaryRecords:
          documentaryRecords,

        openInvestigations:
          openInvestigations,

        unresolvedQuestions:
          unresolvedQuestions
      }
    );

  }



  /* ========================================================
     RENDER ARCHIVE HOME
  ======================================================== */

  function renderArchiveHome() {

    renderFeaturedInvestigation();

    renderBrowse();

    renderCollections();

    initSearch();

    renderLatestRecords();

    renderOpenInvestigations();

    renderRecentActivity();

    renderStatistics();


    initBrowseInteraction();

    initCollectionInteraction();

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
