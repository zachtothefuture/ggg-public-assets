/* ==========================================================
   GGG ARCHIVE — DATA API

   VERSION
   v1.6 — Associated Records Hydration

   Shared client-side interface for the Guild Archive graph,
   Archive Home editorial configuration, canonical Archive
   Record metadata, reusable Archive Record cards, and
   graph-driven Associated Records.

   Public data sources:
   • archive-records.json
   • archive-relationships.json
   • archive-home.json

   Provides:
   • init()
   • getRecord()
   • getRelationships()
   • getRelatedRecords()
   • getOutgoingRelationships()
   • getIncomingRelationships()
   • getHomeConfig()
   • getRecordCollections()
   • hydrateRecordHeaders()
   • hydrateRecordCards()
   • hydrateAssociatedRecords()
   • getAllRecords()
   • getAllRelationships()
   • isReady()

   Canonical Record Header automation:
   • Record ID     ← data-record-id
   • Record Type   ← archive-records.json
   • Status        ← archive-records.json
   • Collection(s) ← archive-records.json
   • Access Level  ← archive-records.json

   Entry-authored Record Header fields remain local:
   • Recovered / Primary Location
   • Current Location

   Record Card automation:
   • Record IDs    ← data-ggg-archive-records
   • Record Type   ← archive-records.json
   • Title         ← archive-records.json
   • Metadata      ← collection, then status fallback
   • URL           ← archive-records.json
   • Count         ← successfully resolved public records

   Associated Records automation:
   • Current ID    ← canonical Record Header
   • Relationships ← archive-relationships.json
   • Record Type   ← archive-records.json
   • Title         ← archive-records.json
   • Relationship  ← canonical relationship vocabulary
   • URL           ← archive-records.json
   • Count         ← successfully resolved public records

   Relationship authoring:
   • source = one canonical Record ID
   • type   = one canonical relationship type
   • target = one or more canonical Record IDs

   Canonical v1.1 relationship example:

   {
     "source": "GGG-POD-2026-0001",
     "type": "documents",
     "target": [
       "GGG-PER-2026-0001",
       "GGG-ART-2026-0001"
     ]
   }

   Target arrays are normalized at load time into individual
   internal relationships. Downstream Archive components never
   need to know whether the manifest used one or many targets.

   Legacy single-string target values remain supported.

   Visibility:
   • public     → available to public Archive interfaces
   • draft      → hidden
   • scheduled  → hidden

   Security model:
   • Only visibility === "public" is exposed by public
     Archive lookup and discovery methods.
   • Missing or invalid visibility fails closed.
   • Relationships to hidden records are suppressed.
   • Record card groups use the same public visibility gate.
   • Associated Records use the same public visibility gate.
========================================================== */


(function () {

  'use strict';


  /* ========================================================
     NAMESPACE
  ======================================================== */

  window.GGG =
    window.GGG || {};


  const archive =
    window.GGG.archive =
    window.GGG.archive || {};



  /* ========================================================
     DATA LOCATION
  ======================================================== */

  const DATA_BASE =
    'https://zachtothefuture.github.io/ggg-public-assets/data';


  const DATA_URLS = {

    records:
      `${DATA_BASE}/archive-records.json`,

    relationships:
      `${DATA_BASE}/archive-relationships.json`,

    home:
      `${DATA_BASE}/archive-home.json`

  };



  /* ========================================================
     INTERNAL STATE
  ======================================================== */

  let initialized =
    false;

  let initializationPromise =
    null;

  let records =
    {};

  let relationshipTypes =
    {};

  let relationships =
    [];

  let homeConfig =
    {};



  /* ========================================================
     HELPERS
  ======================================================== */

  async function loadJSON(url) {

    const response =
      await fetch(
        url,
        {
          cache:
            'no-store'
        }
      );


    if (!response.ok) {

      throw new Error(
        `GGG Archive could not load ${url}: ${response.status}`
      );

    }


    return response.json();

  }



  function normalizeId(value) {

    return String(
      value || ''
    )
      .trim()
      .toUpperCase();

  }



  function getRelationshipType(type) {

    return relationshipTypes[
      String(type || '')
        .trim()
        .toLowerCase()
    ] || null;

  }



  /* ========================================================
     RELATIONSHIP NORMALIZATION

     Canonical archive-relationships.json v1.1:

     {
       "source": "GGG-POD-2026-0001",
       "type": "documents",
       "target": [
         "GGG-PER-2026-0001",
         "GGG-ART-2026-0001"
       ]
     }

     Authoring model:
     • source = one Record ID
     • type   = one relationship type
     • target = array of one or more Record IDs

     Internal model:
     Each source → target relationship becomes its own object.

     Example:

     POD-0001 → documents → PER-0001
     POD-0001 → documents → ART-0001

     Legacy support:
     A single-string target is also accepted and normalized
     into the same internal representation.

     Invalid entries are skipped rather than exposed to
     downstream Archive components.
  ======================================================== */

  function normalizeRelationships(input) {

    if (
      !Array.isArray(
        input
      )
    ) {

      return [];

    }


    const normalized =
      [];


    input.forEach(
      function (relationship) {

        if (
          !relationship ||
          typeof relationship !==
          'object'
        ) {

          return;

        }


        const source =
          normalizeId(
            relationship.source
          );


        const type =
          String(
            relationship.type || ''
          )
            .trim()
            .toLowerCase();


        if (
          !source ||
          !type
        ) {

          console.warn(
            'GGG Archive: Skipping invalid relationship.',
            relationship
          );


          return;

        }


        const authoredTargets =
          Array.isArray(
            relationship.target
          )
            ? relationship.target
            : [
                relationship.target
              ];


        authoredTargets.forEach(
          function (targetValue) {

            const target =
              normalizeId(
                targetValue
              );


            if (!target) {

              console.warn(
                'GGG Archive: Skipping relationship with invalid target.',
                relationship
              );


              return;

            }


            normalized.push({

              source:
                source,

              type:
                type,

              target:
                target

            });

          }
        );

      }
    );


    return normalized;

  }



  /* ========================================================
     VISIBILITY

     Canonical archive-records.json:

     "visibility": "public"

     Public Archive interfaces expose only records explicitly
     marked public.

     Draft, scheduled, missing, empty, or unknown values are
     treated as hidden.
  ======================================================== */

  function isPublicRecord(recordOrId) {

    let record =
      recordOrId;


    if (
      typeof recordOrId ===
      'string'
    ) {

      const id =
        normalizeId(
          recordOrId
        );


      record =
        records[id];

    }


    if (!record) {

      return false;

    }


    return String(
      record.visibility || ''
    )
      .trim()
      .toLowerCase() ===
      'public';

  }



  function getPublicRecords() {

    const publicRecords =
      {};


    Object.entries(
      records
    ).forEach(
      function (
        [
          recordId,
          record
        ]
      ) {

        if (
          !isPublicRecord(
            record
          )
        ) {

          return;

        }


        publicRecords[
          recordId
        ] =
          record;

      }
    );


    return publicRecords;

  }



  /* ========================================================
     COLLECTION NORMALIZATION

     Canonical archive-records.json:

     "collection": [
       "Kennedy Family",
       "EP. 101"
     ]

     Empty collection:

     "collection": []

     Legacy single-string values remain supported.
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



  /* ========================================================
     RECORD HEADER — COLLECTIONS
  ======================================================== */

  function renderRecordCollections(
    container,
    collections
  ) {

    container.replaceChildren();


    collections.forEach(
      function (collection) {

        const item =
          document.createElement(
            'span'
          );


        item.textContent =
          collection;


        container.appendChild(
          item
        );

      }
    );

  }



  /* ========================================================
     RECORD HEADER — HYDRATE ONE

     Header hydration intentionally reads canonical record
     data directly rather than through getRecord().

     This allows an unpublished Squarespace draft page to
     hydrate correctly during authoring and QA while the
     record remains hidden from public Archive discovery.
  ======================================================== */

  function hydrateRecordHeader(header) {

    if (!header) {

      return false;

    }


    const recordId =
      normalizeId(
        header.getAttribute(
          'data-record-id'
        )
      );


    if (!recordId) {

      console.warn(
        'GGG Archive: Record Header is missing data-record-id.',
        header
      );


      return false;

    }


    const record =
      records[recordId];


    if (!record) {

      console.warn(
        `GGG Archive: No canonical record found for ${recordId}.`
      );


      return false;

    }



    /* ------------------------------------------------------
       VISIBLE RECORD ID
    ------------------------------------------------------ */

    const idElement =
      header.querySelector(
        '[data-ggg-record-id-value]'
      );


    if (idElement) {

      idElement.textContent =
        recordId;

    }



    /* ------------------------------------------------------
       RECORD TYPE
    ------------------------------------------------------ */

    const typeElement =
      header.querySelector(
        '[data-ggg-record-type]'
      );


    if (typeElement) {

      typeElement.textContent =
        record.type || '';

    }



    /* ------------------------------------------------------
       STATUS
    ------------------------------------------------------ */

    const statusElement =
      header.querySelector(
        '[data-ggg-record-status]'
      );


    if (statusElement) {

      statusElement.textContent =
        record.status || '';

    }



    /* ------------------------------------------------------
       ACCESS LEVEL
    ------------------------------------------------------ */

    const accessElement =
      header.querySelector(
        '[data-ggg-record-access]'
      );


    if (accessElement) {

      accessElement.textContent =
        record.accessLevel || '';

    }



    /* ------------------------------------------------------
       COLLECTIONS
    ------------------------------------------------------ */

    const collections =
      getRecordCollections(
        record
      );


    const collectionContainer =
      header.querySelector(
        '[data-ggg-record-collections]'
      );


    if (collectionContainer) {

      renderRecordCollections(
        collectionContainer,
        collections
      );

    }



    /* ------------------------------------------------------
       COLLECTION / COLLECTIONS LABEL
    ------------------------------------------------------ */

    const collectionLabel =
      header.querySelector(
        '[data-ggg-record-collection-label]'
      );


    if (collectionLabel) {

      collectionLabel.textContent =
        collections.length === 1
          ? 'Collection'
          : 'Collections';

    }



    /* ------------------------------------------------------
       HYDRATION STATE
    ------------------------------------------------------ */

    header.setAttribute(
      'data-ggg-record-hydrated',
      'true'
    );


    return true;

  }



  /* ========================================================
     RECORD HEADER — HYDRATE ALL

     Supports one or more Record Headers on a page.

     Archive Entry pages will normally contain one.
  ======================================================== */

  function hydrateRecordHeaders() {

    const headers =
      document.querySelectorAll(
        '.ggg-record-header[data-record-id]'
      );


    if (!headers.length) {

      return;

    }


    headers.forEach(
      function (header) {

        hydrateRecordHeader(
          header
        );

      }
    );

  }



  /* ========================================================
     CURRENT ARCHIVE RECORD ID

     Archive Entry components inherit the canonical page
     identity from the Record Header.

     The Record ID should therefore be authored once:

     .ggg-record-header[data-record-id]

     Components such as Associated Records do not need their
     own duplicate Record ID.
  ======================================================== */

  function getCurrentArchiveRecordId() {

    const header =
      document.querySelector(
        '.ggg-record-header[data-record-id]'
      );


    if (!header) {

      return '';

    }


    return normalizeId(
      header.getAttribute(
        'data-record-id'
      )
    );

  }



  /* ========================================================
     ARCHIVE RECORD CARDS — ID PARSING

     Example:

     data-ggg-archive-records="
       GGG-PER-2026-0001,
       GGG-ART-2026-0001,
       GGG-ART-2026-0002
     "

     Whitespace and line breaks are ignored.
     Authored order is preserved.
  ======================================================== */

     function parseArchiveRecordIds(value) {
   
       return String(
         value || ''
       )
         .split(',')
         .map(
           function (recordId) {
   
             return normalizeId(
               recordId
             );
   
           }
         )
         .filter(Boolean);
   
     }
   
   
   
     function createArchiveRecordCard(
     recordId,
     record
   ) {
   
     const link =
       document.createElement(
         'a'
       );
   
   
     link.className =
       'ggg-archive-home-record';
   
   
     link.dataset.recordId =
       recordId;
   
   
     link.href =
       record.url ||
       '#';
   
   
   
     /* ------------------------------------------------------
        TYPE
     ------------------------------------------------------ */
   
     const type =
       document.createElement(
         'span'
       );
   
   
     type.className =
       'ggg-archive-home-record__type';
   
   
     type.setAttribute(
       'data-ggg-material',
       'print'
     );
   
   
     type.textContent =
       (
         record.type ||
         'Record'
       ).toUpperCase();
   
   
   
     /* ------------------------------------------------------
        RECORD ID
     ------------------------------------------------------ */
   
     const id =
       document.createElement(
         'span'
       );
   
   
     id.className =
       'ggg-archive-home-record__id';
   
   
     id.setAttribute(
       'data-ggg-material',
       'print'
     );
   
   
     id.textContent =
       recordId;
   
   
   
     /* ------------------------------------------------------
        TITLE
     ------------------------------------------------------ */
   
     const title =
       document.createElement(
         'span'
       );
   
   
     title.className =
       'ggg-archive-home-record__title';
   
   
     title.setAttribute(
       'data-ggg-material',
       'ink'
     );
   
   
     title.textContent =
       record.title ||
       recordId;
   
   
   
     /* ------------------------------------------------------
        ARROW
     ------------------------------------------------------ */
   
     const arrow =
       document.createElement(
         'span'
       );
   
   
     arrow.className =
       'ggg-archive-home-record__arrow';
   
   
     arrow.textContent =
       '→';
   
   
     arrow.setAttribute(
       'aria-hidden',
       'true'
     );
   
   
   
     /* ------------------------------------------------------
        ACCESSIBILITY
     ------------------------------------------------------ */
   
     link.setAttribute(
       'aria-label',
       `Open Archive record: ${
         record.title ||
         recordId
       }`
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
     ARCHIVE RECORD CARDS — HYDRATE ONE GROUP

     Required parent attribute:

     data-ggg-archive-records

     Preferred child targets:

     data-ggg-archive-record-grid
     data-ggg-archive-record-count

     Current Podcast class names are retained as fallbacks
     for compatibility.

     Public visibility is enforced through archive.getRecord().

     Missing, hidden, or URL-less records are skipped and
     reported in the console.

     If no records resolve, the component is hidden.
  ======================================================== */

  function hydrateRecordCardGroup(
    component
  ) {

    if (!component) {

      return false;

    }


    const recordIds =
      parseArchiveRecordIds(
        component.getAttribute(
          'data-ggg-archive-records'
        )
      );


    const grid =
      component.querySelector(
        '[data-ggg-archive-record-grid]'
      ) ||
      component.querySelector(
        '.ggg-podcast-investigation__grid'
      );


    const count =
      component.querySelector(
        '[data-ggg-archive-record-count]'
      ) ||
      component.querySelector(
        '.ggg-podcast-investigation__count'
      );


    if (!grid) {

      console.warn(
        'GGG Archive: Record card group is missing a grid target.',
        component
      );


      return false;

    }


    const resolved =
      [];


    recordIds.forEach(
      function (recordId) {

        const record =
          archive.getRecord(
            recordId
          );


        if (!record) {

          console.warn(
            `GGG Archive: Public record not found for ${recordId}.`
          );


          return;

        }


        if (!record.url) {

          console.warn(
            `GGG Archive: Record ${recordId} is missing a canonical URL.`
          );


          return;

        }


        resolved.push({

          id:
            recordId,

          record:
            record

        });

      }
    );


    grid.replaceChildren();


    resolved.forEach(
      function (item) {

        grid.appendChild(
          createArchiveRecordCard(
            item.id,
            item.record
          )
        );

      }
    );



    /* ------------------------------------------------------
       COUNT
    ------------------------------------------------------ */

    if (count) {

      const total =
        resolved.length;


      count.textContent =
        `${total} RELATED ${
          total === 1
            ? 'RECORD'
            : 'RECORDS'
        }`;

    }



    /* ------------------------------------------------------
       EMPTY STATE
    ------------------------------------------------------ */

    component.hidden =
      resolved.length === 0;



    /* ------------------------------------------------------
       HYDRATION STATE
    ------------------------------------------------------ */

    component.setAttribute(
      'data-ggg-archive-records-hydrated',
      'true'
    );


    return true;

  }



  /* ========================================================
     ARCHIVE RECORD CARDS — HYDRATE ALL
  ======================================================== */

  function hydrateRecordCardGroups() {

    const components =
      document.querySelectorAll(
        '[data-ggg-archive-records]'
      );


    if (!components.length) {

      return;

    }


    components.forEach(
      function (component) {

        hydrateRecordCardGroup(
          component
        );

      }
    );

  }



  /* ========================================================
     ASSOCIATED RECORDS — CREATE ONE ROW

     Produces markup compatible with:

     MANUAL — RECORDS

     Row content:
     • Record Type   ← archive-records.json
     • Title         ← archive-records.json
     • Relationship  ← archive-relationships.json
     • URL           ← archive-records.json

     Relationship labels are always presented from the
     perspective of the current Archive Record.
  ======================================================== */

  function createAssociatedRecordRow(
    item
  ) {

    const record =
      item.record;


    const link =
      document.createElement(
        'a'
      );


    link.className =
      'ggg-record';


    link.href =
      record.url;


    link.setAttribute(
      'data-record-id',
      item.id
    );


    link.setAttribute(
      'aria-label',
      `Open Archive record: ${
        record.title ||
        item.id
      }`
    );



    /* ------------------------------------------------------
       RECORD TYPE
    ------------------------------------------------------ */

    const type =
      document.createElement(
        'div'
      );


    type.className =
      'ggg-record__type';


    type.setAttribute(
      'data-ggg-material',
      'print'
    );


    type.textContent =
      String(
        record.type ||
        'Record'
      ).toUpperCase();


    link.appendChild(
      type
    );



    /* ------------------------------------------------------
       TITLE
    ------------------------------------------------------ */

    const title =
      document.createElement(
        'div'
      );


    title.className =
      'ggg-record__title';


    title.setAttribute(
      'data-ggg-material',
      'print'
    );


    title.textContent =
      record.title ||
      'Untitled Record';


    link.appendChild(
      title
    );



    /* ------------------------------------------------------
       RELATIONSHIP
    ------------------------------------------------------ */

    const meta =
      document.createElement(
        'div'
      );


    meta.className =
      'ggg-record__meta';


    meta.setAttribute(
      'data-ggg-material',
      'ink'
    );


    meta.textContent =
      item.relationshipLabel ||
      item.relationship ||
      'Related';


    link.appendChild(
      meta
    );



    /* ------------------------------------------------------
       ARROW
    ------------------------------------------------------ */

    const arrow =
      document.createElement(
        'div'
      );


    arrow.className =
      'ggg-record__arrow';


    arrow.setAttribute(
      'aria-hidden',
      'true'
    );


    arrow.textContent =
      '→';


    link.appendChild(
      arrow
    );


    return link;

  }



  /* ========================================================
     ASSOCIATED RECORDS — HYDRATE ONE

     Canonical placeholder:

     <div
       class="ggg-records ggg-archive-records"
       data-associated-records="auto"
     >
     </div>

     The current Record ID is inherited from the canonical
     Record Header.

     The component is fully graph-driven:
     • Current ID comes from Record Header
     • Relationships come from archive-relationships.json
     • Direct relationships are resolved
     • Inverse relationships are derived automatically
     • Record metadata comes from archive-records.json
     • Hidden records are suppressed
     • Count is generated automatically

     No record rows should be manually authored inside an
     auto-associated component.
  ======================================================== */

  function hydrateAssociatedRecordsComponent(
    component
  ) {

    if (!component) {

      return false;

    }


    const recordId =
      getCurrentArchiveRecordId();


    if (!recordId) {

      console.warn(
        'GGG Archive: Associated Records could not determine the current Record ID.',
        component
      );


      component.hidden =
        true;


      return false;

    }


    const relatedRecords =
      archive
        .getRelatedRecords(
          recordId
        )
        .filter(
          function (item) {

            return (
              item &&
              item.record &&
              item.record.url
            );

          }
        );


    component.replaceChildren();



    /* ------------------------------------------------------
       EMPTY STATE

       If the graph resolves no public relationships, hide
       the component rather than exposing an empty frame.
    ------------------------------------------------------ */

    if (!relatedRecords.length) {

      component.hidden =
        true;


      component.setAttribute(
        'data-associated-records-hydrated',
        'true'
      );


      return true;

    }



    /* ------------------------------------------------------
       HEADER
    ------------------------------------------------------ */

    const header =
      document.createElement(
        'div'
      );


    header.className =
      'ggg-records__header';



    const label =
      document.createElement(
        'div'
      );


    label.className =
      'ggg-records__label';


    label.setAttribute(
      'data-ggg-material',
      'print'
    );


    label.textContent =
      'ASSOCIATED RECORDS';



    const count =
      document.createElement(
        'div'
      );


    count.className =
      'ggg-records__count';


    count.setAttribute(
      'data-ggg-material',
      'print'
    );


    count.textContent =
      `${relatedRecords.length} ${
        relatedRecords.length === 1
          ? 'RECORD'
          : 'RECORDS'
      }`;


    header.appendChild(
      label
    );


    header.appendChild(
      count
    );


    component.appendChild(
      header
    );



    /* ------------------------------------------------------
       RECORD ROWS
    ------------------------------------------------------ */

    relatedRecords.forEach(
      function (item) {

        component.appendChild(
          createAssociatedRecordRow(
            item
          )
        );

      }
    );



    /* ------------------------------------------------------
       HYDRATION STATE
    ------------------------------------------------------ */

    component.hidden =
      false;


    component.setAttribute(
      'data-associated-records-hydrated',
      'true'
    );


    return true;

  }



  /* ========================================================
     ASSOCIATED RECORDS — HYDRATE ALL

     Finds every graph-driven Associated Records placeholder
     on the current page.
  ======================================================== */

  function hydrateAssociatedRecords() {

    const components =
      document.querySelectorAll(
        '[data-associated-records="auto"]'
      );


    if (!components.length) {

      return;

    }


    components.forEach(
      function (component) {

        hydrateAssociatedRecordsComponent(
          component
        );

      }
    );

  }



  /* ========================================================
     ARCHIVE HOME — PUBLIC CONFIGURATION

     Editorial configuration may reference canonical records.

     Any item pointing to a hidden record is removed before
     being exposed to public Archive Home components.
  ======================================================== */

  function getPublicHomeConfig() {

    const output =
      {
        ...homeConfig
      };



    /* ------------------------------------------------------
       FEATURED INVESTIGATION
    ------------------------------------------------------ */

    if (
      output.featuredInvestigation &&
      output.featuredInvestigation.record &&
      !isPublicRecord(
        output.featuredInvestigation.record
      )
    ) {

      output.featuredInvestigation =
        null;

    }



    /* ------------------------------------------------------
       OPEN INVESTIGATIONS
    ------------------------------------------------------ */

    if (
      Array.isArray(
        output.openInvestigations
      )
    ) {

      output.openInvestigations =
        output.openInvestigations.filter(
          function (item) {

            return (
              item &&
              item.record &&
              isPublicRecord(
                item.record
              )
            );

          }
        );

    }



    /* ------------------------------------------------------
       RECENT ACTIVITY
    ------------------------------------------------------ */

    if (
      Array.isArray(
        output.recentActivity
      )
    ) {

      output.recentActivity =
        output.recentActivity.filter(
          function (item) {

            return (
              item &&
              item.record &&
              isPublicRecord(
                item.record
              )
            );

          }
        );

    }


    return output;

  }



  /* ========================================================
     INITIALIZE

     Loads Archive data once per page.

     Relationship target arrays are normalized before any
     public relationship methods are exposed.

     Once canonical data is ready:

     • Archive Record Headers are hydrated.
     • ID-driven Archive Record card groups are hydrated.
     • Graph-driven Associated Records are hydrated.
  ======================================================== */

  archive.init =
    function () {

      if (initialized) {

        hydrateRecordHeaders();

        hydrateRecordCardGroups();

        hydrateAssociatedRecords();


        return Promise.resolve(
          archive
        );

      }


      if (initializationPromise) {

        return initializationPromise;

      }


      initializationPromise =
        Promise.all([

          loadJSON(
            DATA_URLS.records
          ),

          loadJSON(
            DATA_URLS.relationships
          ),

          loadJSON(
            DATA_URLS.home
          )

        ])
        .then(
          function (
            [
              recordManifest,
              relationshipManifest,
              homeManifest
            ]
          ) {

            records =
              recordManifest.records || {};


            relationshipTypes =
              relationshipManifest.types || {};


            relationships =
              normalizeRelationships(
                relationshipManifest.relationships
              );


            homeConfig =
              homeManifest || {};


            initialized =
              true;



            /* ------------------------------------------------
               HYDRATE ARCHIVE COMPONENTS
            ------------------------------------------------ */

            hydrateRecordHeaders();

            hydrateRecordCardGroups();

            hydrateAssociatedRecords();



            return archive;

          }
        )
        .catch(
          function (error) {

            initializationPromise =
              null;


            console.error(
              'GGG Archive:',
              error
            );


            throw error;

          }
        );


      return initializationPromise;

    };



  /* ========================================================
     GET RECORD

     PUBLIC LOOKUP

     Returns a canonical record only when explicitly marked:

     "visibility": "public"

     Hidden records resolve to null.
  ======================================================== */

  archive.getRecord =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      const record =
        records[id];


      if (
        !isPublicRecord(
          record
        )
      ) {

        return null;

      }


      return record;

    };



  /* ========================================================
     GET RECORD COLLECTIONS

     Always returns an array.

     Public ID lookups respect visibility.
  ======================================================== */

  archive.getRecordCollections =
    function (recordOrId) {

      let record =
        recordOrId;


      if (
        typeof recordOrId ===
        'string'
      ) {

        record =
          archive.getRecord(
            recordOrId
          );

      }


      return getRecordCollections(
        record
      );

    };



  /* ========================================================
     OUTGOING RELATIONSHIPS

     Relationships authored FROM the supplied record.

     Manifest target arrays have already been expanded into
     individual internal relationships during initialization.

     Both the source record and relationship destination
     must be public.
  ======================================================== */

  archive.getOutgoingRelationships =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      if (
        !isPublicRecord(
          id
        )
      ) {

        return [];

      }


      return relationships
        .filter(
          function (relationship) {

            const source =
              normalizeId(
                relationship.source
              );


            const target =
              normalizeId(
                relationship.target
              );


            return (
              source === id &&
              isPublicRecord(
                target
              )
            );

          }
        )
        .map(
          function (relationship) {

            const definition =
              getRelationshipType(
                relationship.type
              );


            return {

              source:
                normalizeId(
                  relationship.source
                ),

              target:
                normalizeId(
                  relationship.target
                ),

              type:
                relationship.type,

              label:
                definition
                  ? definition.label
                  : relationship.type,

              direction:
                'outgoing'

            };

          }
        );

    };



  /* ========================================================
     INCOMING RELATIONSHIPS

     Relationships authored elsewhere that point TO the
     supplied record.

     These are automatically translated into their inverse
     relationship type.

     Both records must be public.
  ======================================================== */

  archive.getIncomingRelationships =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      if (
        !isPublicRecord(
          id
        )
      ) {

        return [];

      }


      return relationships
        .filter(
          function (relationship) {

            const source =
              normalizeId(
                relationship.source
              );


            const target =
              normalizeId(
                relationship.target
              );


            return (
              target === id &&
              isPublicRecord(
                source
              )
            );

          }
        )
        .map(
          function (relationship) {

            const definition =
              getRelationshipType(
                relationship.type
              );


            const inverseType =
              definition &&
              definition.inverse
                ? definition.inverse
                : relationship.type;


            const inverseDefinition =
              getRelationshipType(
                inverseType
              );


            return {

              source:
                id,

              target:
                normalizeId(
                  relationship.source
                ),

              type:
                inverseType,

              label:
                inverseDefinition
                  ? inverseDefinition.label
                  : inverseType,

              direction:
                'incoming'

            };

          }
        );

    };



  /* ========================================================
     ALL RELATIONSHIPS

     Returns both direct and automatically derived inverse
     relationships from the supplied record's perspective.

     Hidden records and relationships to hidden records are
     automatically excluded.
  ======================================================== */

  archive.getRelationships =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      if (
        !isPublicRecord(
          id
        )
      ) {

        return [];

      }


      const outgoing =
        archive.getOutgoingRelationships(
          id
        );


      const incoming =
        archive.getIncomingRelationships(
          id
        );


      const combined =
        outgoing.concat(
          incoming
        );


      const seen =
        new Set();


      return combined.filter(
        function (relationship) {

          const key =
            [
              relationship.target,
              relationship.type
            ].join(
              '::'
            );


          if (seen.has(key)) {

            return false;

          }


          seen.add(key);

          return true;

        }
      );

    };



  /* ========================================================
     RELATED RECORDS

     Resolves relationship targets against public
     archive-records.

     Draft and scheduled records cannot appear as related
     records on public Archive Entries.
  ======================================================== */

  archive.getRelatedRecords =
    function (recordId) {

      return archive
        .getRelationships(
          recordId
        )
        .map(
          function (relationship) {

            const record =
              archive.getRecord(
                relationship.target
              );


            if (!record) {

              return null;

            }


            return {

              id:
                relationship.target,

              relationship:
                relationship.type,

              relationshipLabel:
                relationship.label,

              record:
                record

            };

          }
        )
        .filter(Boolean);

    };



  /* ========================================================
     ARCHIVE HOME CONFIGURATION
  ======================================================== */

  archive.getHomeConfig =
    function () {

      return getPublicHomeConfig();

    };



  /* ========================================================
     RECORD HEADER HYDRATION
  ======================================================== */

  archive.hydrateRecordHeaders =
    function () {

      if (!initialized) {

        return archive
          .init()
          .then(
            function () {

              hydrateRecordHeaders();

              return archive;

            }
          );

      }


      hydrateRecordHeaders();


      return Promise.resolve(
        archive
      );

    };



  /* ========================================================
     RECORD CARD HYDRATION
  ======================================================== */

  archive.hydrateRecordCards =
    function () {

      if (!initialized) {

        return archive
          .init()
          .then(
            function () {

              hydrateRecordCardGroups();

              return archive;

            }
          );

      }


      hydrateRecordCardGroups();


      return Promise.resolve(
        archive
      );

    };



  /* ========================================================
     ASSOCIATED RECORDS HYDRATION

     Public method so dynamically inserted Archive Entry
     content can request graph-driven Associated Records.

     The current Record ID is inherited from the canonical
     Record Header.
  ======================================================== */

  archive.hydrateAssociatedRecords =
    function () {

      if (!initialized) {

        return archive
          .init()
          .then(
            function () {

              hydrateAssociatedRecords();

              return archive;

            }
          );

      }


      hydrateAssociatedRecords();


      return Promise.resolve(
        archive
      );

    };



  /* ========================================================
     DEBUG / INSPECTION

     Public-facing inspection methods respect visibility.

     getAllRelationships() returns normalized individual
     relationships rather than the grouped authoring form
     stored in archive-relationships.json.
  ======================================================== */

  archive.getAllRecords =
    function () {

      return getPublicRecords();

    };


  archive.getAllRelationships =
    function () {

      return relationships.filter(
        function (relationship) {

          const source =
            normalizeId(
              relationship.source
            );


          const target =
            normalizeId(
              relationship.target
            );


          return (
            isPublicRecord(
              source
            ) &&
            isPublicRecord(
              target
            )
          );

        }
      );

    };


  archive.isReady =
    function () {

      return initialized;

    };


})();
