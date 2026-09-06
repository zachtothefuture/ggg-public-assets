/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v2.5 — Body-Level Picker Portal

   COMPONENTS
   • Featured Investigation
   • Archive Index
   • Search the Archive
   • Record Type Picker
   • Collection Picker
   • Latest Records
   • Open Investigations
   • Recent Activity
   • Archive Statistics

   ARCHIVE INDEX INPUTS
   • Search Query
   • Record Type
   • Collection
   • All Records

   PICKER INTERACTION
   • Record Type + Collection compact controls
   • Shared modal / mobile bottom sheet
   • Options generated from canonical Archive records
   • Current selection reflected in picker controls
   • One browse filter active at a time
   • Escape / backdrop / close-button support
   • Focus returns to originating picker

   MOBILE FIX
   • Picker is moved to document.body
   • Escapes Squarespace / Archive stacking contexts
   • Fixed positioning resolves against viewport
   • Prevents page content from painting above picker

   SEARCH INTERACTION
   • Custom clear control
   • Clear hides Archive Index
   • Clear returns focus to input
   • Search resets browse picker selections
   • Mobile submit dismisses keyboard
   • Mobile submit reveals results

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

  const MOBILE_BREAKPOINT =
    700;

  const MOBILE_SEARCH_SCROLL_DELAY =
    180;

  const PICKER_RESULT_SCROLL_DELAY =
    120;


  let attempts =
    0;



  /* ========================================================
     PICKER STATE
  ======================================================== */

  let selectedRecordType =
    'all';

  let selectedCollection =
    'all';

  let activePicker =
    null;

  let lastPickerTrigger =
    null;



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
        month:
          'long',

        day:
          'numeric',

        year:
          'numeric'
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



  function isMobileArchiveView() {

    return window.matchMedia(
      '(max-width: ' +
      MOBILE_BREAKPOINT +
      'px)'
    ).matches;

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
     ARCHIVE INDEX ELEMENTS
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
        ),

      typeTrigger:
        section.querySelector(
          '[data-ggg-picker-trigger="type"]'
        ),

      collectionTrigger:
        section.querySelector(
          '[data-ggg-picker-trigger="collection"]'
        ),

      typeValue:
        section.querySelector(
          '[data-ggg-picker-value="type"]'
        ),

      collectionValue:
        section.querySelector(
          '[data-ggg-picker-value="collection"]'
        ),

      picker:
        document.querySelector(
          '[data-ggg-archive-picker]'
        ),

      pickerTitle:
        document.querySelector(
          '[data-ggg-picker-title]'
        ),

      pickerOptions:
        document.querySelector(
          '[data-ggg-picker-options]'
        )

    };

  }



  /* ========================================================
     PICKER PORTAL

     Moves the shared picker directly beneath <body>.

     This prevents Squarespace layout transforms,
     Archive component stacking contexts and mobile Safari
     compositing layers from trapping the fixed dialog.
  ======================================================== */

  function mountArchivePickerPortal() {

    const picker =
      document.querySelector(
        '[data-ggg-archive-picker]'
      );


    if (!picker) {

      return;

    }


    if (
      picker.parentElement ===
      document.body
    ) {

      return;

    }


    document.body.appendChild(
      picker
    );


    console.log(
      'GGG Archive Home: Picker mounted to body'
    );

  }



  /* ========================================================
     SEARCH CLEAR CONTROL
  ======================================================== */

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



  /* ========================================================
     ARCHIVE INDEX ROW
  ======================================================== */

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



  /* ========================================================
     ARCHIVE INDEX VISIBILITY
  ======================================================== */

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



  /* ========================================================
     INDEX STATUS
  ======================================================== */

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



  /* ========================================================
     RENDER ARCHIVE INDEX
  ======================================================== */

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



  /* ========================================================
     RESULT REVEAL
  ======================================================== */

  function scrollToArchiveIndex() {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.index ||
      elements.index.hidden
    ) {

      return;

    }


    elements.index.scrollIntoView({
      behavior:
        'smooth',

      block:
        'start'
    });

  }



  function revealMobileSearchResults() {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.index
    ) {

      return;

    }


    if (
      elements.input &&
      typeof elements.input.blur ===
        'function'
    ) {

      elements.input.blur();

    }


    if (!isMobileArchiveView()) {

      return;

    }


    window.setTimeout(
      function () {

        if (
          !elements.index ||
          elements.index.hidden
        ) {

          return;

        }


        elements.index.scrollIntoView({
          behavior:
            'smooth',

          block:
            'start'
        });

      },
      MOBILE_SEARCH_SCROLL_DELAY
    );

  }



  function revealPickerResults() {

    window.setTimeout(
      function () {

        scrollToArchiveIndex();

      },
      PICKER_RESULT_SCROLL_DELAY
    );

  }



  /* ========================================================
     PICKER VALUE DISPLAY
  ======================================================== */

  function updatePickerValues() {

    const elements =
      getIndexElements();


    if (!elements) {

      return;

    }


    if (elements.typeValue) {

      if (
        selectedRecordType ===
        'all'
      ) {

        elements.typeValue.textContent =
          'ALL RECORDS';

      } else {

        elements.typeValue.textContent =
          TYPE_LABELS[
            selectedRecordType
          ] ||
          selectedRecordType;

      }

    }


    if (elements.collectionValue) {

      if (
        selectedCollection ===
        'all'
      ) {

        elements.collectionValue.textContent =
          'ALL COLLECTIONS';

      } else {

        elements.collectionValue.textContent =
          selectedCollection;

      }

    }

  }



  function resetPickerSelections() {

    selectedRecordType =
      'all';

    selectedCollection =
      'all';


    updatePickerValues();

  }



  /* ========================================================
     PICKER DATA
  ======================================================== */

  function getRecordTypeOptions() {

    const records =
      window.GGG.archive.getAllRecords();


    const counts =
      Object.values(records)
        .reduce(
          function (
            result,
            record
          ) {

            if (
              !record ||
              !record.type
            ) {

              return result;

            }


            if (!result[record.type]) {

              result[record.type] =
                0;

            }


            result[record.type] +=
              1;


            return result;

          },
          {}
        );


    const options =
      [
        {
          value:
            'all',

          label:
            'All Records',

          count:
            Object.keys(records).length
        }
      ];


    Object.keys(TYPE_LABELS)
      .filter(
        function (type) {

          return Boolean(
            counts[type]
          );

        }
      )
      .forEach(
        function (type) {

          options.push({
            value:
              type,

            label:
              TYPE_LABELS[type],

            count:
              counts[type]
          });

        }
      );


    return options;

  }



  function getCollectionOptions() {

    const records =
      window.GGG.archive.getAllRecords();


    const counts =
      Object.values(records)
        .reduce(
          function (
            result,
            record
          ) {

            if (
              !record ||
              !record.collection
            ) {

              return result;

            }


            const collection =
              String(
                record.collection
              ).trim();


            if (!collection) {

              return result;

            }


            if (!result[collection]) {

              result[collection] =
                0;

            }


            result[collection] +=
              1;


            return result;

          },
          {}
        );


    const options =
      [
        {
          value:
            'all',

          label:
            'All Collections',

          count:
            Object.keys(records).length
        }
      ];


    Object.keys(counts)
      .sort(
        function (a, b) {

          return a.localeCompare(
            b
          );

        }
      )
      .forEach(
        function (collection) {

          options.push({
            value:
              collection,

            label:
              collection,

            count:
              counts[collection]
          });

        }
      );


    return options;

  }



  /* ========================================================
     CREATE PICKER OPTION
  ======================================================== */

  function createPickerOption(
    pickerType,
    option
  ) {

    const button =
      createElement(
        'button',
        'ggg-archive-picker__option'
      );


    button.type =
      'button';


    button.dataset.gggPickerOption =
      option.value;


    button.dataset.gggPickerType =
      pickerType;



    const selectedValue =
      (
        pickerType === 'type'
          ? selectedRecordType
          : selectedCollection
      );


    button.setAttribute(
      'aria-selected',
      (
        selectedValue ===
        option.value
          ? 'true'
          : 'false'
      )
    );



    const label =
      createElement(
        'span'
      );


    label.textContent =
      option.label;



    const meta =
      createElement(
        'span',
        'ggg-archive-picker__option-meta'
      );



    const count =
      createElement(
        'span',
        'ggg-archive-picker__option-count'
      );


    count.textContent =
      String(
        option.count
      );



    const arrow =
      createElement(
        'span',
        'ggg-archive-picker__option-arrow'
      );


    arrow.textContent =
      '→';


    arrow.setAttribute(
      'aria-hidden',
      'true'
    );


    meta.append(
      count,
      arrow
    );


    button.append(
      label,
      meta
    );


    const countLabel =
      (
        option.count === 1
          ? ' record'
          : ' records'
      );


    button.setAttribute(
      'aria-label',
      option.label +
      ', ' +
      option.count +
      countLabel
    );


    return button;

  }



  /* ========================================================
     OPEN PICKER
  ======================================================== */

  function openArchivePicker(
    pickerType,
    trigger
  ) {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.picker ||
      !elements.pickerTitle ||
      !elements.pickerOptions
    ) {

      return;

    }


    activePicker =
      pickerType;


    lastPickerTrigger =
      trigger ||
      null;



    let options =
      [];


    if (pickerType === 'type') {

      elements.pickerTitle.textContent =
        'RECORD TYPE';


      options =
        getRecordTypeOptions();

    } else {

      elements.pickerTitle.textContent =
        'COLLECTIONS';


      options =
        getCollectionOptions();

    }



    elements.pickerOptions.replaceChildren();


    options.forEach(
      function (option) {

        elements.pickerOptions.appendChild(
          createPickerOption(
            pickerType,
            option
          )
        );

      }
    );



    elements.picker.hidden =
      false;


    document.documentElement.classList.add(
      'ggg-archive-picker-open'
    );


    document.body.classList.add(
      'ggg-archive-picker-open'
    );



    if (trigger) {

      trigger.setAttribute(
        'aria-expanded',
        'true'
      );

    }



    const activeOption =
      elements.pickerOptions.querySelector(
        '[aria-selected="true"]'
      );


    const firstOption =
      elements.pickerOptions.querySelector(
        '[data-ggg-picker-option]'
      );


    window.requestAnimationFrame(
      function () {

        const focusTarget =
          activeOption ||
          firstOption;


        if (
          focusTarget &&
          typeof focusTarget.focus ===
            'function'
        ) {

          focusTarget.focus({
            preventScroll:
              true
          });

        }

      }
    );


    console.log(
      'GGG Archive Home: Picker opened',
      pickerType
    );

  }



  /* ========================================================
     CLOSE PICKER
  ======================================================== */

  function closeArchivePicker(
    restoreFocus
  ) {

    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.picker
    ) {

      return;

    }


    elements.picker.hidden =
      true;


    document.documentElement.classList.remove(
      'ggg-archive-picker-open'
    );


    document.body.classList.remove(
      'ggg-archive-picker-open'
    );



    if (elements.typeTrigger) {

      elements.typeTrigger.setAttribute(
        'aria-expanded',
        'false'
      );

    }


    if (elements.collectionTrigger) {

      elements.collectionTrigger.setAttribute(
        'aria-expanded',
        'false'
      );

    }



    if (
      restoreFocus &&
      lastPickerTrigger &&
      typeof lastPickerTrigger.focus ===
        'function'
    ) {

      lastPickerTrigger.focus({
        preventScroll:
          true
      });

    }


    activePicker =
      null;


    lastPickerTrigger =
      null;

  }



  /* ========================================================
     CLEAR SEARCH FOR BROWSE
  ======================================================== */

  function clearSearchForBrowse() {

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


    if (
      typeof elements.input.blur ===
        'function'
    ) {

      elements.input.blur();

    }


    updateSearchClearControl();

  }



  /* ========================================================
     APPLY RECORD TYPE
  ======================================================== */

  function applyRecordType(
    type
  ) {

    const records =
      window.GGG.archive.getAllRecords();


    let matches =
      Object.entries(records);


    selectedRecordType =
      type ||
      'all';


    selectedCollection =
      'all';


    if (
      selectedRecordType !==
      'all'
    ) {

      matches =
        matches.filter(
          function (entry) {

            return (
              entry[1] &&
              entry[1].type ===
                selectedRecordType
            );

          }
        );

    }


    sortRecordsByTitle(
      matches
    );


    clearSearchForBrowse();

    updatePickerValues();


    renderArchiveIndex(
      matches,
      {
        mode:
          (
            selectedRecordType ===
            'all'
              ? 'all'
              : 'type'
          ),

        value:
          (
            selectedRecordType ===
            'all'
              ? ''
              : selectedRecordType
          )
      }
    );

  }



  /* ========================================================
     APPLY COLLECTION
  ======================================================== */

  function applyCollection(
    collection
  ) {

    const records =
      window.GGG.archive.getAllRecords();


    let matches =
      Object.entries(records);


    selectedCollection =
      collection ||
      'all';


    selectedRecordType =
      'all';


    if (
      selectedCollection !==
      'all'
    ) {

      matches =
        matches.filter(
          function (entry) {

            return (
              entry[1] &&
              entry[1].collection ===
                selectedCollection
            );

          }
        );

    }


    sortRecordsByTitle(
      matches
    );


    clearSearchForBrowse();

    updatePickerValues();


    renderArchiveIndex(
      matches,
      {
        mode:
          (
            selectedCollection ===
            'all'
              ? 'all'
              : 'collection'
          ),

        value:
          (
            selectedCollection ===
            'all'
              ? ''
              : selectedCollection
          )
      }
    );

  }



  /* ========================================================
     INITIALIZE ARCHIVE PICKERS
  ======================================================== */

  function initArchivePickers() {

    mountArchivePickerPortal();


    const elements =
      getIndexElements();


    if (
      !elements ||
      !elements.picker
    ) {

      return;

    }


    updatePickerValues();



    if (elements.typeTrigger) {

      elements.typeTrigger.setAttribute(
        'aria-expanded',
        'false'
      );


      elements.typeTrigger.addEventListener(
        'click',
        function () {

          openArchivePicker(
            'type',
            elements.typeTrigger
          );

        }
      );

    }



    if (elements.collectionTrigger) {

      elements.collectionTrigger.setAttribute(
        'aria-expanded',
        'false'
      );


      elements.collectionTrigger.addEventListener(
        'click',
        function () {

          openArchivePicker(
            'collection',
            elements.collectionTrigger
          );

        }
      );

    }



    elements.picker.addEventListener(
      'click',
      function (event) {

        const closeControl =
          event.target.closest(
            '[data-ggg-picker-close]'
          );


        if (
          closeControl &&
          elements.picker.contains(
            closeControl
          )
        ) {

          closeArchivePicker(
            true
          );


          return;

        }



        const option =
          event.target.closest(
            '[data-ggg-picker-option]'
          );


        if (
          !option ||
          !elements.picker.contains(
            option
          )
        ) {

          return;

        }


        const pickerType =
          option.dataset.gggPickerType;


        const value =
          option.dataset.gggPickerOption;


        if (pickerType === 'type') {

          applyRecordType(
            value
          );

        } else if (
          pickerType ===
          'collection'
        ) {

          applyCollection(
            value
          );

        }


        closeArchivePicker(
          false
        );


        revealPickerResults();

      }
    );



    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key !== 'Escape' ||
          !activePicker
        ) {

          return;

        }


        event.preventDefault();


        closeArchivePicker(
          true
        );

      }
    );


    console.log(
      'GGG Archive Home: Archive Pickers ready'
    );

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


    if (summary) {

      summary.textContent =
        record.summary ||
        '';

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


        resetPickerSelections();


        const matches =
          Object.entries(records)
            .filter(
              function (entry) {

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

              }
            );


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


        revealMobileSearchResults();


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

        .map(
          function (entry) {

            return {

              id:
                entry[0],

              record:
                entry[1]

            };

          }
        )

        .filter(
          function (item) {

            return (
              item.record &&
              item.record.dateAdded &&
              /^\d{4}-\d{2}-\d{2}$/.test(
                item.record.dateAdded
              )
            );

          }
        )

        .sort(
          function (a, b) {

            return b.record.dateAdded
              .localeCompare(
                a.record.dateAdded
              );

          }
        )

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
      latest.map(
        function (item) {

          return item.id;

        }
      )
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


    if (!investigations.length) {

      const empty =
        createElement(
          'div',
          'ggg-archive-home-open__empty',
          'print'
        );


      empty.textContent =
        'NO OPEN INVESTIGATIONS';


      container.appendChild(
        empty
      );


      console.log(
        'GGG Archive Home: Open Investigations loaded — none open'
      );


      return;

    }


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
        .sort(
          function (a, b) {

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

          }
        );


    if (!sortedActivity.length) {

      const empty =
        createElement(
          'div',
          'ggg-archive-home-activity__empty',
          'print'
        );


      empty.textContent =
        'NO RECENT ARCHIVE CHANGES';


      log.appendChild(
        empty
      );


      console.log(
        'GGG Archive Home: Recent Activity loaded — no recent changes'
      );


      return;

    }


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

    initSearch();

    initArchivePickers();

    renderLatestRecords();

    renderOpenInvestigations();

    renderRecentActivity();

    renderStatistics();

  }



  /* ========================================================
     INITIALIZE
  ======================================================== */

  function initArchiveHome() {

    if (
      !window.GGG ||
      !window.GGG.archive ||
      typeof window.GGG.archive.init !==
        'function'
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
