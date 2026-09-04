/* ==========================================================
   GGG ARCHIVE — DATA API

   VERSION
   v1.1 — Archive Home Data

   Shared client-side interface for the Guild Archive graph
   and Archive Home editorial configuration.

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
     INITIALIZE

     Loads Archive data once per page.
  ======================================================== */

  archive.init =
    function () {

      if (initialized) {

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
