/* ==========================================================
   GGG PODCAST
   PODCAST PAGE DATA + RENDERING

   VERSION
   v1.0 — Canonical Podcast Episode Sequence

   PURPOSE

   Provides Podcast-specific rendering while using the
   canonical GGG Archive data system as the source of truth.

   CURRENT RESPONSIBILITIES

   • hydrate THE INVESTIGATION episode sequence
   • source records through window.GGG.archive
   • render Podcast records only
   • render public records only
   • sort episodes by episodeNumber
   • use canonical Archive titles
   • use canonical Archive thumbnails
   • link cards to canonical Archive records

   DATA POLICY

   The Archive record manifest remains canonical.

   Podcast records qualify for the episode sequence when:

   • type === "Podcast"
   • visibility === "public"
   • episodeNumber is a valid number
   • url exists

   Draft, scheduled, hidden, malformed, and URL-less records
   fail closed and are not rendered.

   EXPECTED RECORD FIELDS

   title
   type
   episodeNumber
   visibility
   status
   url
   thumbnail

   ARCHITECTURE

   This file does NOT fetch archive-records.json directly.

   It consumes the existing Archive interface:

   window.GGG.archive

   This prevents Podcast and Archive from maintaining
   separate copies of canonical record data.
========================================================== */


(function () {

  'use strict';


  /* ========================================================
     STATE
  ======================================================== */

  let initialized =
    false;


  /* ========================================================
     HELPERS
  ======================================================== */


  function getArchiveInterface() {

    return (
      window.GGG &&
      window.GGG.archive
    )
      ? window.GGG.archive
      : null;

  }


  function normalizeRecords(source) {

    if (!source) {

      return [];

    }


    /* ------------------------------------------------------
       ARRAY SOURCE

       Supports:
       [
         {
           id: "GGG-POD-2026-0001",
           ...
         }
       ]
    ------------------------------------------------------ */

    if (Array.isArray(source)) {

      return source
        .filter(Boolean);

    }


    /* ------------------------------------------------------
       OBJECT SOURCE

       Supports canonical Archive structure:

       {
         "GGG-POD-2026-0001": {
           ...
         }
       }
    ------------------------------------------------------ */

    if (
      typeof source === 'object'
    ) {

      return Object.entries(source)
        .map(
          function ([recordId, record]) {

            if (
              !record ||
              typeof record !== 'object'
            ) {

              return null;

            }


            return {
              id: recordId,
              ...record
            };

          }
        )
        .filter(Boolean);

    }


    return [];

  }


  function isPublicPodcastRecord(record) {

    if (!record) {

      return false;

    }


    if (
      record.type !== 'Podcast'
    ) {

      return false;

    }


    /*
     * Visibility is intentionally explicit.
     *
     * Only "public" qualifies.
     *
     * draft
     * scheduled
     * private
     * missing
     * unknown
     *
     * all fail closed.
     */

    if (
      record.visibility !== 'public'
    ) {

      return false;

    }


    if (
      !record.url
    ) {

      return false;

    }


    const episodeNumber =
      Number(record.episodeNumber);


    if (
      !Number.isFinite(episodeNumber)
    ) {

      return false;

    }


    return true;

  }


  function getPodcastEpisodes(records) {

    return records
      .filter(
        isPublicPodcastRecord
      )
      .sort(
        function (a, b) {

          return (
            Number(a.episodeNumber) -
            Number(b.episodeNumber)
          );

        }
      );

  }


  /* ========================================================
     EPISODE CARD
  ======================================================== */


  function createEpisodeCard(record) {

    const episodeNumber =
      Number(record.episodeNumber);


    /* ------------------------------------------------------
       CARD
    ------------------------------------------------------ */

    const card =
      document.createElement(
        'article'
      );

    card.className =
      'ggg-podcast-episode ' +
      'ggg-podcast-episode--jacket ' +
      'paper-telegram';

    card.dataset.recordId =
      record.id || '';

    card.dataset.episodeNumber =
      String(episodeNumber);


    /* ------------------------------------------------------
       ADMIN
    ------------------------------------------------------ */

    const admin =
      document.createElement(
        'div'
      );

    admin.className =
      'ggg-podcast-episode__admin';


    const episodeLabel =
      document.createElement(
        'span'
      );

    episodeLabel.textContent =
      `EPISODE ${episodeNumber}`;


    const recordLabel =
      document.createElement(
        'span'
      );

    recordLabel.textContent =
      'PODCAST RECORD';


    admin.append(
      episodeLabel,
      recordLabel
    );


    /* ------------------------------------------------------
       ARTWORK
    ------------------------------------------------------ */

    const artwork =
      document.createElement(
        'figure'
      );

    artwork.className =
      'ggg-podcast-episode__artwork';


    if (record.thumbnail) {

      const image =
        document.createElement(
          'img'
        );

      image.src =
        record.thumbnail;

      image.alt =
        record.title
          ? `Episode ${episodeNumber} — ${record.title}`
          : `Episode ${episodeNumber} artwork`;

      image.loading =
        'lazy';

      image.dataset.gggMaterial =
        'photo';


      artwork.appendChild(
        image
      );

    }


    const caption =
      document.createElement(
        'figcaption'
      );

    caption.textContent =
      'EPISODE RECORD';


    artwork.appendChild(
      caption
    );


    /* ------------------------------------------------------
       BODY
    ------------------------------------------------------ */

    const body =
      document.createElement(
        'div'
      );

    body.className =
      'ggg-podcast-episode__body';


    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'ggg-podcast-episode__title';

    title.dataset.gggMaterial =
      'print';

        const recordTitle =
      record.title ||
      `Episode ${episodeNumber}`;


    /*
     * Standard Zach & Kyle episodes use a deliberate
     * editorial line break after the host names.
     *
     * The canonical Archive title remains untouched.
     * This is presentation logic only.
     */

    const hostPrefix =
      'Zach & Kyle';


    if (
      recordTitle.startsWith(
        hostPrefix
      )
    ) {

      const hostLine =
        document.createTextNode(
          hostPrefix
        );


      const lineBreak =
        document.createElement(
          'br'
        );


      const episodeTitle =
        document.createTextNode(
          recordTitle
            .slice(
              hostPrefix.length
            )
            .trim()
        );


      title.append(
        hostLine,
        lineBreak,
        episodeTitle
      );


    } else {

      title.textContent =
        recordTitle;

    }


    const meta =
      document.createElement(
        'div'
      );

    meta.className =
      'ggg-podcast-episode__meta';

    meta.dataset.gggMaterial =
      'ink';

    meta.textContent =
      record.status ||
      'ARCHIVE RECORD';


    body.append(
      title,
      meta
    );


    /* ------------------------------------------------------
       CANONICAL ARCHIVE LINK
    ------------------------------------------------------ */

    const link =
      document.createElement(
        'a'
      );

    link.className =
      'ggg-podcast-episode__link';

    link.href =
      record.url;

    link.textContent =
      'VIEW RECORD';


    link.setAttribute(
      'aria-label',
      record.title
        ? `View Episode ${episodeNumber}: ${record.title}`
        : `View Episode ${episodeNumber}`
    );


    /* ------------------------------------------------------
       COMPLETE CARD
    ------------------------------------------------------ */

    card.append(
      admin,
      artwork,
      body,
      link
    );


    return card;

  }


  /* ========================================================
     EPISODE SEQUENCE
  ======================================================== */


  function renderEpisodeSequence(records) {

    const section =
      document.querySelector(
        '[data-ggg-podcast-episodes]'
      );

    if (!section) {

      return;

    }


    const track =
      section.querySelector(
        '[data-ggg-podcast-episode-track]'
      );


    if (!track) {

      console.warn(
        '[GGG Podcast] Episode track not found.'
      );

      return;

    }


    const episodes =
      getPodcastEpisodes(
        records
      );


    /* ------------------------------------------------------
       EMPTY STATE

       No public Podcast records means the entire component
       disappears rather than exposing an empty shell.
    ------------------------------------------------------ */

    if (!episodes.length) {

      section.hidden =
        true;

      return;

    }


    section.hidden =
      false;


    /* ------------------------------------------------------
       RESET

       Prevent duplicate cards if hydration is invoked again.
    ------------------------------------------------------ */

    track.replaceChildren();


    /* ------------------------------------------------------
       RENDER IN EPISODE ORDER
    ------------------------------------------------------ */

    episodes.forEach(
      function (record) {

        track.appendChild(
          createEpisodeCard(
            record
          )
        );

      }
    );


    console.info(
      '[GGG Podcast] Episode sequence hydrated:',
      episodes.length
    );

  }


  /* ========================================================
     HYDRATION
  ======================================================== */


  async function hydrate() {

    const archive =
      getArchiveInterface();


    if (!archive) {

      console.warn(
        '[GGG Podcast] Archive interface unavailable.'
      );

      return;

    }


    if (
      typeof archive.init !== 'function' ||
      typeof archive.getAllRecords !== 'function'
    ) {

      console.warn(
        '[GGG Podcast] Archive interface is incomplete.'
      );

      return;

    }


    try {

      /* ----------------------------------------------------
         ENSURE CANONICAL ARCHIVE DATA IS READY
      ---------------------------------------------------- */

      await archive.init();


      /* ----------------------------------------------------
         READ EXISTING ARCHIVE DATA

         No secondary fetch is performed here.
      ---------------------------------------------------- */

      const records =
        normalizeRecords(
          archive.getAllRecords()
        );


      renderEpisodeSequence(
        records
      );


      initialized =
        true;


    } catch (error) {

      console.error(
        '[GGG Podcast] Failed to hydrate Podcast page.',
        error
      );

    }

  }


  /* ========================================================
     PUBLIC INTERFACE
  ======================================================== */


  window.GGG =
    window.GGG || {};


  window.GGG.podcast = {

    init:
      hydrate,

    hydrateEpisodes:
      hydrate,

    isReady:
      function () {

        return initialized;

      }

  };


  /* ========================================================
     AUTO INITIALIZATION
  ======================================================== */


  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      hydrate,
      {
        once: true
      }
    );

  } else {

    hydrate();

  }

})();
