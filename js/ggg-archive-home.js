/* ==========================================================
   GGG ARCHIVE HOME — RENDERER

   VERSION
   v2.7 — Multi-Collection Records

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

   PICKER SYSTEM
   • Shared modal / mobile bottom sheet
   • Picker mounted directly to document.body
   • Escapes Squarespace stacking contexts
   • Tracks Safari Visual Viewport
   • Adapts to expanded / collapsed browser chrome
   • Options scroll internally when necessary
   • One browse filter active at a time

   COLLECTION MODEL
   • collection is canonically an array
   • records may belong to multiple collections
   • legacy string values remain supported
   • search indexes every collection
   • picker counts every membership
   • filtering matches array membership

   SEARCH INTERACTION
   • Custom clear control
   • Clear hides Archive Index
   • Search resets picker selections
   • Mobile submit dismisses keyboard
   • Mobile submit reveals results

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

  let viewportListenersReady =
    false;



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



  /* ========================================================
     COLLECTION NORMALIZATION

     Canonical v1.2:
     collection = array of strings

     Backward compatibility:
     legacy string values are accepted and converted
     internally to a one-item array.
  ======================================================== */

  function getRecordCollections(record) {

    if (
      !record ||
      !record.collection
    ) {

      return [];

    }


    if (
      Array.isArray(
        record.collection
      )
    ) {

      return record.collection
        .map(
          function (collection) {

            return String(
              collection || ''
            ).trim();

          }
        )
        .filter(Boolean);

    }


    const collection =
      String(
        record.collection
      ).trim();


    return collection
      ? [collection]
      : [];

  }



  function getRecordCollectionLabel(record) {

    return getRecordCollections(
      record
    ).join(' · ');

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
      getRecordCollections(
        record
      )
        .concat(
          record.status
            ? [record.status]
            : []
        )
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
     VISUAL VIEWPORT
  ======================================================== */

  function updateArchiveVisualViewport() {

    const root =
      document.documentElement;


    const viewport =
      window.visualViewport;


    const layoutHeight =
      window.innerHeight;


    const visualHeight =
      viewport
        ? viewport.height
        : layoutHeight;


    const visualTop =
      viewport
        ? viewport.offsetTop
        : 0;


    const visualBottom =
      Math.max(
        0,
        layoutHeight -
        (
          visualHeight +
          visualTop
        )
      );


    root.style.setProperty(
      '--ggg-archive-visual-height',
      visualHeight + 'px'
    );


    root.style.setProperty(
      '--ggg-archive-visual-top',
      visualTop + 'px'
    );


    root.style.setProperty(
      '--ggg-archive-visual-bottom',
      visualBottom + 'px'
    );

  }



  function initArchiveVisualViewport() {

    if (viewportListenersReady) {

      updateArchiveVisualViewport();

      return;

    }


    viewportListenersReady =
      true;


    updateArchiveVisualViewport();


    window.addEventListener(
      'resize',
      updateArchiveVisualViewport,
      {
        passive:
          true
      }
    );


    window.addEventListener(
      'orientationchange',
      updateArchiveVisualViewport,
      {
        passive:
          true
      }
    );


    if (window.visualViewport) {

      window.visualViewport.addEventListener(
        'resize',
        updateArchiveVisualViewport,
        {
          passive:
            true
        }
      );


      window.visualViewport.addEventListener(
        'scroll',
        updateArchiveVisualViewport,
        {
          passive:
            true
        }
      );

    }


    console.log(
      'GGG Archive Home: Visual Viewport ready'
    );

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

      elements.typeValue.textContent =
        (
          selectedRecordType === 'all'
            ? 'ALL RECORDS'
            : (
              TYPE_LABELS[
                selectedRecordType
              ] ||
              selectedRecordType
            )
        );

    }


    if (elements.collectionValue) {

      elements.collectionValue.textContent =
        (
          selectedCollection === 'all'
            ? 'ALL COLLECTIONS'
            : selectedCollection
        );

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
     RECORD TYPE OPTIONS
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


            result[record.type] =
              (
                result[record.type] ||
                0
              ) + 1;


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



  /* ========================================================
     COLLECTION OPTIONS

     A record increments every collection it belongs to.
  ======================================================== */

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

            getRecordCollections(
              record
            )
              .forEach(
                function (collection) {

                  result[collection] =
                    (
                      result[collection] ||
                      0
                    ) + 1;

                }
              );


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
     PICKER OPTION
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


    button.setAttribute(
      'aria-label',
      option.label +
      ', ' +
      option.count +
      (
        option.count === 1
          ? ' record'
          : ' records'
      )
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


    updateArchiveVisualViewport();


    activePicker =
      pickerType;


    lastPickerTrigger =
      trigger ||
      null;



    const options =
      (
        pickerType === 'type'
          ? getRecordTypeOptions()
          : getCollectionOptions()
      );


    elements.pickerTitle.textContent =
      (
        pickerType === 'type'
          ? 'RECORD TYPE'
          : 'COLLECTIONS'
      );


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

        updateArchiveVisualViewport();


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

  function applyRecordType(type) {

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

     A record matches if the selected collection exists
     anywhere in its collection array.
  ======================================================== */

  function applyCollection(collection) {

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

            return getRecordCollections(
              entry[1]
            ).includes(
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
     INITIALIZE PICKERS
  ======================================================== */

  function initArchivePickers() {

    mountArchivePickerPortal();

    initArchiveVisualViewport();


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

        }


        if (
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

      return;

    }


    const recordId =
      featured.record;


    const record =
      window.GGG.archive.getRecord(
        recordId
      );


    if (!record) {

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

  }



  /* ========================================================
     SEARCH

     Every collection name participates in discovery.
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
                    record.status,
                    record.summary
                  ]
                    .concat(
                      getRecordCollections(
                        record
                      )
                    )
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

            return (
              (
                b &&
                b.date
              ) || ''
            ).localeCompare(
              (
                a &&
                a.date
              ) || ''
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


        const record =
          window.GGG.archive.getRecord(
            entry.record
          );


        if (!record) {

          return;

        }


        const row =
          createElement(
            'div',
            'ggg-archive-home-activity__entry'
          );



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
          entry.record;


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

  }



  /* ========================================================
     STATISTICS
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


    const documentaryTypes =
      [
        'Document',
        'Audio Recording',
        'Film/Video'
      ];


    const statistics =
      [

        {
          label:
            'Total Records',

          value:
            recordList.length,

          description:
            'Catalogued Records'
        },

        {
          label:
            'Artifacts',

          value:
            recordList.filter(
              function (record) {

                return (
                  record &&
                  record.type ===
                    'Artifact'
                );

              }
            ).length,

          description:
            'Physical Objects'
        },

        {
          label:
            'People',

          value:
            recordList.filter(
              function (record) {

                return (
                  record &&
                  record.type ===
                    'Person'
                );

              }
            ).length,

          description:
            'Biographical Records'
        },

        {
          label:
            'Documentary Records',

          value:
            recordList.filter(
              function (record) {

                return (
                  record &&
                  documentaryTypes.includes(
                    record.type
                  )
                );

              }
            ).length,

          description:
            'Documents · Audio · Film'
        },

        {
          label:
            'Open Investigations',

          value:
            recordList.filter(
              function (record) {

                return (
                  record &&
                  record.status ===
                    'Under Investigation'
                );

              }
            ).length,

          description:
            'Currently Active'
        },

        {
          label:
            'Unresolved Questions',

          value:
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
              : 0,

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
