/* ==========================================================
   GGG Manufacturing Engine
   Pipeline Diagnostic
========================================================== */

console.log("👻 GGG Manufacturing Loaded");

document.documentElement.classList.add("ggg-loaded");

(function () {

  /* ========================================================
     GGG MANUFACTURING ENGINE v2
     Reliable DOM registry + compact SVG process library
  ======================================================== */


  /* ========================================================
     PROCESS REGISTRY
  ======================================================== */

  const PROCESS_MAP = [

    {
      selector:
        '.entry-title, .ggg-page-title, .ggg-document-title',
      process:
        'letterpress'
    },

    {
      selector:
        '.ggg-record-id, .ggg-record__id, .ggg-index-id',
      process:
        'offset'
    },

    {
      selector:
        '.ggg-dateline, .ggg-byline, .ggg-record-type',
      process:
        'typewriter'
    },

    {
      selector:
        '.ggg-status-stamp, .ggg-stamp',
      process:
        'stamp'
    }

  ];


  /* ========================================================
     SVG PROCESS LIBRARY
     Keep SVG focused on actual physical distortion only.
  ======================================================== */

  const svgMarkup = `
  <svg
    aria-hidden="true"
    width="0"
    height="0"
    style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;"
  >
    <defs>


      <!-- ===================================================
           LETTERPRESS
           Micro edge distortion + ink gain
      ==================================================== -->

      <filter
        id="ggg-process-letterpress"
        x="-15%"
        y="-20%"
        width="130%"
        height="140%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".018 .38"
          numOctaves="2"
          seed="17"
          result="grain"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="grain"
          scale=".72"
          xChannelSelector="R"
          yChannelSelector="G"
          result="distorted"
        />

        <feMorphology
          in="SourceAlpha"
          operator="dilate"
          radius=".22"
          result="gain"
        />

        <feGaussianBlur
          in="gain"
          stdDeviation=".10"
          result="gainSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".13"
          result="gainColor"
        />

        <feComposite
          in="gainColor"
          in2="gainSoft"
          operator="in"
          result="inkGain"
        />

        <feMerge>
          <feMergeNode in="inkGain"/>
          <feMergeNode in="distorted"/>
        </feMerge>

      </filter>


      <!-- ===================================================
           OFFSET
           Tiny mechanical registration
      ==================================================== -->

      <filter
        id="ggg-process-offset"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        color-interpolation-filters="sRGB"
      >

        <feOffset
          in="SourceAlpha"
          dx=".28"
          dy=".05"
          result="registration"
        />

        <feGaussianBlur
          in="registration"
          stdDeviation=".08"
          result="registrationSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".08"
          result="registrationInk"
        />

        <feComposite
          in="registrationInk"
          in2="registrationSoft"
          operator="in"
          result="ghost"
        />

        <feMerge>
          <feMergeNode in="ghost"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>

      </filter>


      <!-- ===================================================
           TYPEWRITER
           Ribbon strike irregularity
      ==================================================== -->

      <filter
        id="ggg-process-typewriter"
        x="-15%"
        y="-15%"
        width="130%"
        height="130%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".030 .62"
          numOctaves="1"
          seed="23"
          result="ribbon"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="ribbon"
          scale=".34"
        />

      </filter>


      <!-- ===================================================
           RUBBER STAMP
           Stronger edge distortion / imperfect transfer
      ==================================================== -->

      <filter
        id="ggg-process-stamp"
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".050 .46"
          numOctaves="3"
          seed="77"
          result="stampNoise"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="stampNoise"
          scale="1.65"
          xChannelSelector="R"
          yChannelSelector="G"
          result="distorted"
        />

        <feMorphology
          in="SourceAlpha"
          operator="dilate"
          radius=".42"
          result="gain"
        />

        <feGaussianBlur
          in="gain"
          stdDeviation=".18"
          result="gainSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".18"
          result="gainColor"
        />

        <feComposite
          in="gainColor"
          in2="gainSoft"
          operator="in"
          result="inkGain"
        />

        <feOffset
          in="SourceAlpha"
          dx=".75"
          dy=".10"
          result="drag"
        />

        <feGaussianBlur
          in="drag"
          stdDeviation=".24"
          result="dragSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".08"
          result="dragInk"
        />

        <feComposite
          in="dragInk"
          in2="dragSoft"
          operator="in"
          result="smear"
        />

        <feMerge>
          <feMergeNode in="inkGain"/>
          <feMergeNode in="smear"/>
          <feMergeNode in="distorted"/>
        </feMerge>

      </filter>


    </defs>
  </svg>
  `;


  /* ========================================================
     REGISTER ONE PROCESS
  ======================================================== */

  function registerProcess(
    selector,
    process
  ) {

    document
      .querySelectorAll(selector)
      .forEach(function (element) {

        element.classList.add(
          'ggg-process',
          'ggg-process-' + process
        );

        element.setAttribute(
          'data-ggg-process',
          process
        );
        element.setAttribute(
          'data-ggg-print-text',
          String(element.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
        );

      });

  }


  /* ========================================================
     INITIALIZE
  ======================================================== */

  function initGGGManufacturing() {

    if (
      document.documentElement.dataset.gggManufacturingV2 ===
      'true'
    ) {
      return;
    }


    document.documentElement.dataset.gggManufacturingV2 =
      'true';


    document.body.insertAdjacentHTML(
      'beforeend',
      svgMarkup
    );


    PROCESS_MAP.forEach(function (entry) {

      registerProcess(
        entry.selector,
        entry.process
      );

    });


    console.log(
      'GGG MANUFACTURING v2: READY'
    );

  }


  /* ========================================================
     SQUARESPACE-SAFE START
  ======================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initGGGManufacturing,
      {
        once: true
      }
    );

  } else {

    initGGGManufacturing();

  }

})();



document.addEventListener('DOMContentLoaded', function () {

  /* ========================================================
     MANUAL SEARCH PAGE DETECTION
  ======================================================== */

  const params = new URLSearchParams(window.location.search);

  const isManualSearch =
    window.location.pathname === '/search' &&
    params.get('f_collectionId') === '6a7fef9283df04280a7a1aab';

  if (!isManualSearch) return;

  document.body.classList.add('ggg-manual-search-results');


  /* ========================================================
     SEARCH RESULTS
  ======================================================== */

  const results = Array.from(
    document.querySelectorAll(
      '.sqs-search-page .search-result[data-url]'
    )
  );

  if (!results.length) return;


  /* ========================================================
     HELPERS
  ======================================================== */

  function cleanText(value) {

    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();

  }


  function getField(doc, wantedLabel) {

    const groups =
      doc.querySelectorAll(
        '.ggg-record-header__grid > div'
      );

    for (const group of groups) {

      const label =
        group.querySelector('.ggg-record-label');

      const value =
        group.querySelector('.ggg-record-value');

      if (
        label &&
        value &&
        cleanText(label.textContent).toUpperCase() ===
        wantedLabel.toUpperCase()
      ) {

        return cleanText(value.textContent);

      }

    }

    return '';

  }


  function getStatus(doc) {

    const stamp =
      doc.querySelector('.ggg-status-stamp');

    return stamp
      ? cleanText(stamp.textContent)
      : '';

  }


  function getSummary(doc) {

    const summary =
      doc.querySelector('.ggg-summary__text');

    return summary
      ? cleanText(summary.textContent)
      : '';

  }


  /* ========================================================
     RENDER METADATA
  ======================================================== */

  function addMetadata(result, metadata) {

    const title =
      result.querySelector('.sqs-title');

    if (!title) return;


    /* Remove any previously-generated Guild metadata */

    result
      .querySelectorAll(
        '.ggg-index-id, .ggg-index-meta, .ggg-index-description'
      )
      .forEach(el => el.remove());


    /* ------------------------------------------------------
       IDENTIFIER
    ------------------------------------------------------ */

    if (metadata.identifier) {

      const identifier =
        document.createElement('div');

      identifier.className =
        'ggg-index-id';

      identifier.textContent =
        metadata.identifier;

      title.insertAdjacentElement(
        'beforebegin',
        identifier
      );

    }


    /* ------------------------------------------------------
       METADATA
    ------------------------------------------------------ */

    const values = [

      metadata.section,
      metadata.status,
      metadata.version

    ].filter(Boolean);


    let meta = null;

    if (values.length) {

      meta =
        document.createElement('div');

      meta.className =
        'ggg-index-meta';

      values.forEach((value, index) => {

        const item =
          document.createElement('span');

        item.className =
          'ggg-index-meta__item';

        item.textContent =
          value;

        meta.appendChild(item);

        if (index < values.length - 1) {

          const divider =
            document.createElement('span');

          divider.className =
            'ggg-index-meta__divider';

          divider.textContent =
            '·';

          meta.appendChild(divider);

        }

      });

      title.insertAdjacentElement(
        'afterend',
        meta
      );

    }


    /* ------------------------------------------------------
       SUMMARY
    ------------------------------------------------------ */

    if (metadata.summary) {

      const description =
        document.createElement('div');

      description.className =
        'ggg-index-description';

      description.textContent =
        metadata.summary;

      if (meta) {

        meta.insertAdjacentElement(
          'afterend',
          description
        );

      } else {

        title.insertAdjacentElement(
          'afterend',
          description
        );

      }

    }


    /* ------------------------------------------------------
       HIDE SQUARESPACE SNIPPET
    ------------------------------------------------------ */

    result
      .querySelectorAll(
        '.sqs-content'
      )
      .forEach(el => {

        if (
          !el.classList.contains(
            'ggg-index-description'
          )
        ) {

          el.classList.add(
            'ggg-index-original-snippet'
          );

        }

      });

  }


  /* ========================================================
     FETCH ONE DOCUMENT
  ======================================================== */

  async function enrichResult(result) {

    const url =
      result.dataset.url;

    if (!url) return;

    const cacheKey =
      'ggg-manual-index-v2:' + url;


    /* Session cache */

    try {

      const cached =
        sessionStorage.getItem(cacheKey);

      if (cached) {

        addMetadata(
          result,
          JSON.parse(cached)
        );

        return;

      }

    } catch (error) {}


    /* Fetch page */

    try {

      const response =
        await fetch(url, {
          credentials: 'same-origin'
        });

      if (!response.ok) return;

      const html =
        await response.text();

      const parser =
        new DOMParser();

      const doc =
        parser.parseFromString(
          html,
          'text/html'
        );


      const metadata = {

        identifier:
          getField(doc, 'IDENTIFIER'),

        section:
          getField(doc, 'SECTION'),

        version:
          getField(doc, 'VERSION'),

        status:
          getStatus(doc),

        summary:
          getSummary(doc)

      };


      if (

        !metadata.identifier &&
        !metadata.section &&
        !metadata.version &&
        !metadata.status &&
        !metadata.summary

      ) {

        return;

      }


      addMetadata(
        result,
        metadata
      );


      try {

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify(metadata)
        );

      } catch (error) {}

    }

    catch (error) {

      console.warn(
        'Guild Index could not load metadata:',
        url,
        error
      );

    }

  }


  /* ========================================================
     SMALL FETCH QUEUE
  ======================================================== */

  async function runQueue(items, limit = 4) {

    let next = 0;

    async function worker() {

      while (next < items.length) {

        const index = next++;

        await enrichResult(
          items[index]
        );

      }

    }

    await Promise.all(

      Array.from(
        {
          length:
            Math.min(limit, items.length)
        },
        worker
      )

    );

  }


  runQueue(results);

});



document.addEventListener('DOMContentLoaded', function () {

  /* ========================================================
     GUILD MANUAL — RELATED DOCUMENTS
     Author only:
       1. destination URL
       2. relationship
  ======================================================== */

  const records = Array.from(
    document.querySelectorAll(
      '.ggg-manual-record[href][data-relationship]'
    )
  );

  if (!records.length) return;


  const RELATED_CACHE_VERSION = 'v2';


  /* ========================================================
     HELPERS
  ======================================================== */

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }


  function getField(doc, wantedLabel) {

    const groups = doc.querySelectorAll(
      '.ggg-record-header__grid > div'
    );

    for (const group of groups) {

      const label = group.querySelector(
        '.ggg-record-label'
      );

      const value = group.querySelector(
        '.ggg-record-value'
      );

      if (
        label &&
        value &&
        cleanText(label.textContent).toUpperCase() ===
        wantedLabel.toUpperCase()
      ) {
        return cleanText(value.textContent);
      }

    }

    return '';
  }


  function getStatus(doc) {

    const stamp = doc.querySelector(
      '.ggg-status-stamp'
    );

    return stamp
      ? cleanText(stamp.textContent)
      : '';
  }


 function getSummary(doc) {

  const summary =
    doc.querySelector(
      '.ggg-summary__text'
    );

  if (!summary) {
    return '';
  }


  const text =
    cleanText(
      summary.textContent
    );

  if (!text) {
    return '';
  }


  /* --------------------------------------------------------
     RELATED DOCUMENTS SHOULD BE CONCISE

     Prefer the first complete sentence.
  -------------------------------------------------------- */

  const firstSentence =
    text.match(
      /^.*?[.!?](?:\s|$)/
    );


  let result =
    firstSentence
      ? firstSentence[0].trim()
      : text;


  /* --------------------------------------------------------
     SAFETY LIMIT

     Prevent unusually long first sentences from creating
     oversized Related Document rows.
  -------------------------------------------------------- */

  const MAX_LENGTH = 180;


  if (result.length > MAX_LENGTH) {

    result =
      result
        .slice(0, MAX_LENGTH)
        .replace(/\s+\S*$/, '')
        .trim() +
      '…';

  }


  return result;

}

  function getTitle(doc) {

    /*
       Canonical source first.
    */

    const documentTitle = getField(
      doc,
      'DOCUMENT'
    );

    if (documentTitle) {
      return documentTitle;
    }


    /*
       Fallback to H1.
    */

    const h1 = doc.querySelector('h1');

    if (h1) {
      return cleanText(h1.textContent);
    }


    return cleanText(doc.title);
  }


  /* ========================================================
     RENDER
  ======================================================== */

  function renderRecord(record, data) {

    const relationship = cleanText(
      record.dataset.relationship
    );


    /*
       Rebuild the row from scratch.
    */

    record.innerHTML = '';


    /* Identifier */

    const id = document.createElement('div');

    id.className =
      'ggg-record__id';

    id.textContent =
      data.identifier;


    /* Main */

    const main = document.createElement('div');

    main.className =
      'ggg-record__main';


    /* Relationship */

    const relation = document.createElement('div');

    relation.className =
      'ggg-record__relationship';

    relation.textContent =
      relationship;


    /* Title */

    const title = document.createElement('div');

    title.className =
      'ggg-record__title';

    title.textContent =
      data.title;


    /* Metadata */

    const meta = document.createElement('div');

    meta.className =
      'ggg-record__meta';


    [
      data.section,
      data.status,
      data.version
    ]
      .filter(Boolean)
      .forEach(value => {

        const item =
          document.createElement('span');

        item.textContent =
          value;

        meta.appendChild(item);

      });


    main.appendChild(relation);
    main.appendChild(title);

    if (meta.children.length) {
      main.appendChild(meta);
    }


    /* Description */

    const description =
      document.createElement('div');

    description.className =
      'ggg-record__description';

    description.textContent =
      data.summary;


    /* Arrow */

    const arrow =
      document.createElement('div');

    arrow.className =
      'ggg-record__arrow';

    arrow.setAttribute(
      'aria-hidden',
      'true'
    );

    arrow.textContent =
      '→';


    /* Assemble */

    record.appendChild(id);
    record.appendChild(main);
    record.appendChild(description);
    record.appendChild(arrow);


    /* Accessibility */

    record.setAttribute(
      'aria-label',
      [
        relationship,
        data.identifier,
        data.title
      ]
        .filter(Boolean)
        .join(': ')
    );


    record.classList.add(
      'ggg-manual-record--loaded'
    );

  }


  /* ========================================================
     FETCH
  ======================================================== */

  async function loadRecord(record) {

    const href =
      record.getAttribute('href');

    if (
      !href ||
      href === '#' ||
      href.startsWith('PASTE-')
    ) {
      return;
    }


    const url = new URL(
      href,
      window.location.origin
    );


    /*
       Related Manual documents should remain same-origin.
    */

    if (
      url.origin !==
      window.location.origin
    ) {

      console.warn(
        'Guild Manual related document is not same-origin:',
        href
      );

      return;
    }


    const fetchUrl =
      url.pathname +
      url.search;


    const cacheKey =
      'ggg-manual-related-' +
      RELATED_CACHE_VERSION +
      ':' +
      fetchUrl;


    /* ------------------------------------------------------
       CACHE
    ------------------------------------------------------ */

    try {

      const cached =
        sessionStorage.getItem(
          cacheKey
        );

      if (cached) {

        renderRecord(
          record,
          JSON.parse(cached)
        );

        return;

      }

    } catch (error) {}


    /* ------------------------------------------------------
       FETCH PAGE
    ------------------------------------------------------ */

    try {

      const response =
        await fetch(
          fetchUrl,
          {
            credentials:
              'same-origin'
          }
        );


      if (!response.ok) {
        throw new Error(
          'HTTP ' + response.status
        );
      }


      const html =
        await response.text();


      const doc =
        new DOMParser()
          .parseFromString(
            html,
            'text/html'
          );


      const data = {

        identifier:
          getField(
            doc,
            'IDENTIFIER'
          ),

        title:
          getTitle(doc),

        section:
          getField(
            doc,
            'SECTION'
          ),

        status:
          getStatus(doc),

        version:
          getField(
            doc,
            'VERSION'
          ),

        summary:
          getSummary(doc)

      };


      /*
         Require enough canonical metadata to prove
         we actually fetched a Manual document.
      */

      if (
        !data.identifier ||
        !data.title
      ) {

        throw new Error(
          'Manual metadata not found'
        );

      }


      renderRecord(
        record,
        data
      );


      /* Cache successful result */

      try {

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify(data)
        );

      } catch (error) {}


    } catch (error) {

      console.warn(
        'Guild Manual related document could not load:',
        fetchUrl,
        error
      );


      record.classList.add(
        'ggg-manual-record--error'
      );

    }

  }


  /* ========================================================
     AUTOMATIC COUNTS
  ======================================================== */

  document
    .querySelectorAll(
      '.ggg-manual-records'
    )
    .forEach(group => {

      const total =
        group.querySelectorAll(
          '.ggg-manual-record[href][data-relationship]'
        ).length;


      const count =
        group.querySelector(
          '.ggg-records__count'
        );


      if (count) {

        count.textContent =
          total +
          (
            total === 1
              ? ' DOCUMENT'
              : ' DOCUMENTS'
          );

      }

    });


  /* ========================================================
     SMALL FETCH QUEUE
  ======================================================== */

  async function runQueue(
    items,
    limit = 4
  ) {

    let next = 0;


    async function worker() {

      while (next < items.length) {

        const index = next++;

        await loadRecord(
          items[index]
        );

      }

    }


    await Promise.all(

      Array.from(
        {
          length:
            Math.min(
              limit,
              items.length
            )
        },
        worker
      )

    );

  }


  runQueue(records);

});



window.addEventListener("load", function () {

  if (
    window.Y &&
    Y.UA &&
    typeof Y.UA.ios !== "undefined"
  ) {
    Y.UA.ios = 0;
  }

});

document.addEventListener('DOMContentLoaded', function () {

  /* ========================================================
     GGG MANUFACTURING ENGINE v3
     Canonical SVG filter library + automatic assignments
  ======================================================== */


  /* ========================================================
     PREVENT DUPLICATE INITIALIZATION
  ======================================================== */

  if (
    document.documentElement.dataset.gggManufacturing === 'true'
  ) {
    return;
  }

  document.documentElement.dataset.gggManufacturing =
    'true';


  /* ========================================================
     SVG FILTER LIBRARY
  ======================================================== */

(function () {

  /* ========================================================
     GGG MANUFACTURING — REGISTRATION TEST
     No SVG. No filters. Just prove the DOM connection.
  ======================================================== */

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }


  function findExactText(text) {

    return Array.from(
      document.querySelectorAll('body *')
    ).find(function (element) {

      return cleanText(element.textContent)
        .toUpperCase() ===
        text.toUpperCase();

    }) || null;

  }


  function init() {

    console.log(
      'GGG MANUFACTURING: init'
    );


    document.documentElement.dataset.gggManufacturing =
      'true';


    /* ------------------------------------------------------
       TITLE
    ------------------------------------------------------ */

    const title =
      document.querySelector(
        '.entry-title, .ggg-page-title, .ggg-document-title, h1'
      ) ||
      findExactText(
        'Publishing Philosophy'
      );


    if (title) {

      title.dataset.gggManufactured =
        'true';

      title.dataset.gggManufactureProcess =
        'letterpress';

      console.log(
        'GGG MANUFACTURING: title found',
        title
      );

    } else {

      console.warn(
        'GGG MANUFACTURING: title NOT found'
      );

    }


    /* ------------------------------------------------------
       CURRENT STAMP
    ------------------------------------------------------ */

    const stamp =
      document.querySelector(
        '.ggg-status-stamp, .ggg-stamp'
      ) ||
      findExactText(
        'CURRENT'
      );


    if (stamp) {

      stamp.dataset.gggManufactured =
        'true';

      stamp.dataset.gggManufactureProcess =
        'stamp';

      console.log(
        'GGG MANUFACTURING: stamp found',
        stamp
      );

    } else {

      console.warn(
        'GGG MANUFACTURING: stamp NOT found'
      );

    }

  }


  /* --------------------------------------------------------
     SAFE SQUARESPACE INITIALIZATION
  -------------------------------------------------------- */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }

})();

  /*  const svgMarkup = `
<svg
  aria-hidden="true"
  width="0"
  height="0"
  style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;"
>
  <defs>


    <!-- =====================================================
         01 — LETTERPRESS
    ====================================================== -->

    <filter
      id="ggg-press-letterpress"
      x="-20%"
      y="-25%"
      width="140%"
      height="150%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".018 .31"
        numOctaves="2"
        seed="17"
        result="grain"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="grain"
        scale=".85"
        xChannelSelector="R"
        yChannelSelector="G"
        result="roughInk"
      />

      <feMorphology
        in="SourceAlpha"
        operator="dilate"
        radius=".32"
        result="gainAlpha"
      />

      <feGaussianBlur
        in="gainAlpha"
        stdDeviation=".16"
        result="gainSoft"
      />

      <feFlood
        flood-color="#211810"
        flood-opacity=".19"
        result="gainColor"
      />

      <feComposite
        in="gainColor"
        in2="gainSoft"
        operator="in"
        result="inkGain"
      />

      <feOffset
        in="SourceAlpha"
        dy=".85"
        result="lowerEdge"
      />

      <feFlood
        flood-color="#FFFFFF"
        flood-opacity=".19"
        result="fiberLight"
      />

      <feComposite
        in="fiberLight"
        in2="lowerEdge"
        operator="in"
        result="pressureLight"
      />

      <feMerge>
        <feMergeNode in="pressureLight"/>
        <feMergeNode in="inkGain"/>
        <feMergeNode in="roughInk"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         02 — OFFSET
    ====================================================== -->

    <filter
      id="ggg-press-offset"
      x="-15%"
      y="-15%"
      width="130%"
      height="130%"
      color-interpolation-filters="sRGB"
    >

      <feOffset
        in="SourceAlpha"
        dx=".42"
        dy=".08"
        result="registration"
      />

      <feGaussianBlur
        in="registration"
        stdDeviation=".12"
        result="registrationSoft"
      />

      <feFlood
        flood-color="#211810"
        flood-opacity=".11"
        result="ghostInk"
      />

      <feComposite
        in="ghostInk"
        in2="registrationSoft"
        operator="in"
        result="ghost"
      />

      <feMerge>
        <feMergeNode in="ghost"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         03 — TYPEWRITER
    ====================================================== -->

    <filter
      id="ggg-press-typewriter"
      x="-15%"
      y="-20%"
      width="130%"
      height="140%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".032 .58"
        numOctaves="2"
        seed="23"
        result="ribbon"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="ribbon"
        scale=".52"
        result="strike"
      />

      <feOffset
        in="SourceAlpha"
        dx=".38"
        dy=".12"
        result="doubleAlpha"
      />

      <feGaussianBlur
        in="doubleAlpha"
        stdDeviation=".16"
        result="doubleSoft"
      />

      <feFlood
        flood-color="#211810"
        flood-opacity=".10"
        result="doubleInk"
      />

      <feComposite
        in="doubleInk"
        in2="doubleSoft"
        operator="in"
        result="doubleStrike"
      />

      <feMerge>
        <feMergeNode in="doubleStrike"/>
        <feMergeNode in="strike"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         04 — RUBBER STAMP
    ====================================================== -->

    <filter
      id="ggg-press-stamp"
      x="-25%"
      y="-30%"
      width="150%"
      height="160%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".055 .42"
        numOctaves="3"
        seed="9"
        result="stampNoise"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="stampNoise"
        scale="1.25"
        result="stampEdge"
      />

      <feMorphology
        in="SourceAlpha"
        operator="dilate"
        radius=".62"
        result="stampGain"
      />

      <feGaussianBlur
        in="stampGain"
        stdDeviation=".22"
        result="stampGainSoft"
      />

      <feFlood
        flood-color="#211810"
        flood-opacity=".20"
        result="pooledInk"
      />

      <feComposite
        in="pooledInk"
        in2="stampGainSoft"
        operator="in"
        result="pool"
      />

      <feOffset
        in="SourceAlpha"
        dx="1"
        dy=".15"
        result="dragAlpha"
      />

      <feGaussianBlur
        in="dragAlpha"
        stdDeviation=".35"
        result="dragSoft"
      />

      <feFlood
        flood-color="#211810"
        flood-opacity=".10"
        result="dragInk"
      />

      <feComposite
        in="dragInk"
        in2="dragSoft"
        operator="in"
        result="drag"
      />

      <feMerge>
        <feMergeNode in="pool"/>
        <feMergeNode in="drag"/>
        <feMergeNode in="stampEdge"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         05 — CARBON COPY
    ====================================================== -->

    <filter
      id="ggg-press-carbon"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
      color-interpolation-filters="sRGB"
    >

      <feOffset
        in="SourceGraphic"
        dx=".7"
        dy=".32"
        result="copy"
      />

      <feGaussianBlur
        in="copy"
        stdDeviation=".28"
        result="copySoft"
      />

      <feComponentTransfer
        in="copySoft"
        result="copyFade"
      >
        <feFuncA
          type="linear"
          slope=".36"
        />
      </feComponentTransfer>

      <feMerge>
        <feMergeNode in="copyFade"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         06 — MIMEOGRAPH
    ====================================================== -->

    <filter
      id="ggg-press-mimeograph"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".035 .42"
        numOctaves="2"
        seed="42"
        result="mimeNoise"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="mimeNoise"
        scale=".72"
        result="mimeInk"
      />

      <feGaussianBlur
        in="SourceAlpha"
        stdDeviation=".38"
        result="halo"
      />

      <feFlood
        flood-color="#594770"
        flood-opacity=".16"
        result="purple"
      />

      <feComposite
        in="purple"
        in2="halo"
        operator="in"
        result="purpleHalo"
      />

      <feMerge>
        <feMergeNode in="purpleHalo"/>
        <feMergeNode in="mimeInk"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         07 — PENCIL
    ====================================================== -->

    <filter
      id="ggg-press-pencil"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".065 .72"
        numOctaves="2"
        seed="61"
        result="graphite"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="graphite"
        scale=".55"
        result="roughGraphite"
      />

      <feGaussianBlur
        in="roughGraphite"
        stdDeviation=".10"
        result="softGraphite"
      />

      <feMerge>
        <feMergeNode in="softGraphite"/>
        <feMergeNode in="roughGraphite"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         08 — PHOTOSTAT
    ====================================================== -->

    <filter
      id="ggg-press-photostat"
      x="-10%"
      y="-10%"
      width="120%"
      height="120%"
      color-interpolation-filters="sRGB"
    >

      <feColorMatrix
        type="saturate"
        values="0"
        result="mono"
      />

      <feComponentTransfer in="mono">

        <feFuncR
          type="gamma"
          amplitude="1.08"
          exponent=".68"
          offset="0"
        />

        <feFuncG
          type="gamma"
          amplitude="1.08"
          exponent=".68"
          offset="0"
        />

        <feFuncB
          type="gamma"
          amplitude="1.08"
          exponent=".68"
          offset="0"
        />

      </feComponentTransfer>

    </filter>


    <!-- =====================================================
         09 — DIAZO / BLUEPRINT
    ====================================================== -->

    <filter
      id="ggg-press-diazo"
      x="-10%"
      y="-10%"
      width="120%"
      height="120%"
      color-interpolation-filters="sRGB"
    >

      <feColorMatrix
        type="matrix"
        values=".12 0 0 0 .08  0 .32 0 0 .17  0 0 .58 0 .30  0 0 0 1 0"
      />

    </filter>


    <!-- =====================================================
         10 — LETTERPRESS v2
         Strong diagnostic / physical version
    ====================================================== -->

    <filter
      id="ggg-press-letterpress-v2"
      x="-25%"
      y="-30%"
      width="150%"
      height="160%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".010 .16"
        numOctaves="2"
        seed="117"
        result="pressureNoise"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="pressureNoise"
        scale="1.8"
        xChannelSelector="R"
        yChannelSelector="G"
        result="distortedInk"
      />

      <feMorphology
        in="SourceAlpha"
        operator="dilate"
        radius=".48"
        result="expandedAlpha"
      />

      <feGaussianBlur
        in="expandedAlpha"
        stdDeviation=".20"
        result="expandedSoft"
      />

      <feFlood
        flood-color="#241A12"
        flood-opacity=".22"
        result="gainColor"
      />

      <feComposite
        in="gainColor"
        in2="expandedSoft"
        operator="in"
        result="inkGain"
      />

      <feOffset
        in="SourceAlpha"
        dx="0"
        dy="1.05"
        result="pressedEdge"
      />

      <feGaussianBlur
        in="pressedEdge"
        stdDeviation=".20"
        result="pressedEdgeSoft"
      />

      <feFlood
        flood-color="#FFFFFF"
        flood-opacity=".22"
        result="paperLight"
      />

      <feComposite
        in="paperLight"
        in2="pressedEdgeSoft"
        operator="in"
        result="compressionHighlight"
      />

      <feOffset
        in="SourceAlpha"
        dx="0"
        dy="-.70"
        result="upperEdge"
      />

      <feGaussianBlur
        in="upperEdge"
        stdDeviation=".12"
        result="upperEdgeSoft"
      />

      <feFlood
        flood-color="#160F09"
        flood-opacity=".18"
        result="upperDark"
      />

      <feComposite
        in="upperDark"
        in2="upperEdgeSoft"
        operator="in"
        result="dieShadow"
      />

      <feOffset
        in="SourceAlpha"
        dx=".75"
        dy=".12"
        result="dragAlpha"
      />

      <feGaussianBlur
        in="dragAlpha"
        stdDeviation=".32"
        result="dragSoft"
      />

      <feFlood
        flood-color="#241A12"
        flood-opacity=".07"
        result="dragColor"
      />

      <feComposite
        in="dragColor"
        in2="dragSoft"
        operator="in"
        result="inkDrag"
      />

      <feMerge>
        <feMergeNode in="compressionHighlight"/>
        <feMergeNode in="inkGain"/>
        <feMergeNode in="dieShadow"/>
        <feMergeNode in="inkDrag"/>
        <feMergeNode in="distortedInk"/>
      </feMerge>

    </filter>


    <!-- =====================================================
         11 — RUBBER STAMP v2
    ====================================================== -->

    <filter
      id="ggg-press-stamp-v2"
      x="-30%"
      y="-35%"
      width="160%"
      height="170%"
      color-interpolation-filters="sRGB"
    >

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".045 .36"
        numOctaves="3"
        seed="77"
        result="stampTexture"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="stampTexture"
        scale="2.2"
        xChannelSelector="R"
        yChannelSelector="G"
        result="warpedStamp"
      />

      <feMorphology
        in="SourceAlpha"
        operator="dilate"
        radius=".72"
        result="stampGain"
      />

      <feGaussianBlur
        in="stampGain"
        stdDeviation=".28"
        result="stampGainSoft"
      />

      <feFlood
        flood-color="#241A12"
        flood-opacity=".24"
        result="stampGainColor"
      />

      <feComposite
        in="stampGainColor"
        in2="stampGainSoft"
        operator="in"
        result="pooledInk"
      />

      <feOffset
        in="SourceAlpha"
        dx="1.3"
        dy=".15"
        result="smearAlpha"
      />

      <feGaussianBlur
        in="smearAlpha"
        stdDeviation=".42"
        result="smearSoft"
      />

      <feFlood
        flood-color="#241A12"
        flood-opacity=".11"
        result="smearColor"
      />

      <feComposite
        in="smearColor"
        in2="smearSoft"
        operator="in"
        result="stampSmear"
      />

      <feTurbulence
        type="fractalNoise"
        baseFrequency=".075 .62"
        numOctaves="2"
        seed="213"
        result="dryNoise"
      />

      <feColorMatrix
        in="dryNoise"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  .33 .33 .33 0 0"
        result="dryAlpha"
      />

      <feComponentTransfer
        in="dryAlpha"
        result="dryThreshold"
      >
        <feFuncA
          type="table"
          tableValues="0 0 .12 .22"
        />
      </feComponentTransfer>

      <feComposite
        in="warpedStamp"
        in2="dryThreshold"
        operator="out"
        result="dryStamp"
      />

      <feMerge>
        <feMergeNode in="pooledInk"/>
        <feMergeNode in="stampSmear"/>
        <feMergeNode in="dryStamp"/>
      </feMerge>

    </filter>


  </defs>
</svg>
`;


document.body.insertAdjacentHTML(
  'beforeend',
  svgMarkup
);
  
  


(function () {

  console.log('GGG MANUFACTURING TEST: script executed');

  document.documentElement.dataset.gggManufacturingTest =
    'working';

})();
