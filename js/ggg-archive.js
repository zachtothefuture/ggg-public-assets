/* ==========================================================
   GGG ARCHIVE — DATA API

   VERSION
   v1.2 — Record Header Hydration

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

   Record Header automation:
   • Record ID     ← data-record-id
   • Status        ← archive-records.json
   • Collection(s) ← archive-records.json

   Entry-authored Record Header fields remain local:
   • Recovered
   • Current Location
   • Access Level
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
     COLLECTION NORMALIZATION

     Canonical archive-records.json v1.2:

     "collection": [
       "Kennedy Family",
       "EP. 101"
     ]

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
  ======================================================== */

  archive.getRecord =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      return records[id] || null;

    };



  /* ========================================================
     GET RECORD COLLECTIONS

     Always returns an array.

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
  ======================================================== */

  archive.getOutgoingRelationships =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      return relationships
        .filter(
          function (relationship) {

            return normalizeId(
              relationship.source
            ) === id;

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
  ======================================================== */

  archive.getIncomingRelationships =
    function (recordId) {

      const id =
        normalizeId(
          recordId
        );


      return relationships
        .filter(
          function (relationship) {

            return normalizeId(
              relationship.target
            ) === id;

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
  ======================================================== */

  archive.getRelationships =
    function (recordId) {

      const outgoing =
        archive.getOutgoingRelationships(
          recordId
        );


      const incoming =
        archive.getIncomingRelationships(
          recordId
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

     Resolves relationship targets against archive-records.
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

     Returns editorial configuration for Archive Home.

     This file contains presentation decisions such as:
     • Featured Investigation
     • Open Investigations
     • Recent Activity
  ======================================================== */

  archive.getHomeConfig =
    function () {

      return homeConfig;

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

     Helpful during development.
  ======================================================== */

  archive.getAllRecords =
    function () {

      return records;

    };


  archive.getAllRelationships =
    function () {

      return relationships.slice();

    };


  archive.isReady =
    function () {

      return initialized;

    };


})();
