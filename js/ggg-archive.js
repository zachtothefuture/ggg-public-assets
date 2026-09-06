/* ==========================================================
   GGG ARCHIVE — DATA API

   VERSION
   v1.3 — Record Visibility

   Shared client-side interface for the Guild Archive graph,
   Archive Home editorial configuration, and canonical
   Archive Record metadata.

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
   • getAllRecords()
   • getAllRelationships()
   • isReady()

   Canonical Record Header automation:
   • Record ID     ← data-record-id
   • Record Type   ← archive-records.json
   • Status        ← archive-records.json
   • Collection(s) ← archive-records.json

   Entry-authored Record Header fields remain local:
   • Recovered / Primary Location
   • Current Location
   • Access Level

   Visibility:
   • public     → available to public Archive interfaces
   • draft      → hidden
   • scheduled  → hidden

   Security model:
   • Only visibility === "public" is exposed by public
     Archive lookup and discovery methods.
   • Missing or invalid visibility fails closed.
   • Relationships to hidden records are suppressed.
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
     VISIBILITY

     Canonical archive-records.json v1.3:

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

     Canonical archive-records.json v1.3:

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

       Useful for debugging and future CSS if needed.
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

     Once canonical data is ready, any Archive Record Header
     on the page is automatically hydrated.
  ======================================================== */

  archive.init =
    function () {

      if (initialized) {

        hydrateRecordHeaders();


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
              Array.isArray(
                relationshipManifest.relationships
              )
                ? relationshipManifest.relationships
                : [];


            homeConfig =
              homeManifest || {};


            initialized =
              true;



            /* ------------------------------------------------
               HYDRATE RECORD ENTRY HEADER
            ------------------------------------------------ */

            hydrateRecordHeaders();



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

     Example:

     [
       "Kennedy Family",
       "EP. 101"
     ]
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

     Returns public-safe editorial configuration.

     Entries that reference hidden canonical records are
     removed automatically.

     This covers:
     • Featured Investigation
     • Open Investigations
     • Recent Activity
  ======================================================== */

  archive.getHomeConfig =
    function () {

      return getPublicHomeConfig();

    };



  /* ========================================================
     RECORD HEADER HYDRATION

     Public method so another component can request a
     re-hydration if Archive Entry markup is ever inserted
     dynamically after initialization.
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
     DEBUG / INSPECTION

     Public-facing inspection methods also respect
     visibility so downstream components cannot accidentally
     bypass the publication gate.
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
