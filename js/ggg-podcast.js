/* ==========================================================
   GGG PODCAST
   PODCAST PAGE DATA + RENDERING

   VERSION
   v1.1 — Episode Sequence + Latest Episode

   PURPOSE

   Provides Podcast-specific rendering while using the
   canonical GGG Archive data system as the source of truth.

   CURRENT RESPONSIBILITIES

   • hydrate THE INVESTIGATION episode sequence
   • hydrate CAUGHT UP? latest episode
   • source records through window.GGG.archive
   • render Podcast records only
   • render public records only
   • sort episodes by episodeNumber
   • use canonical Archive titles
   • use canonical Archive thumbnails
   • link components to canonical Archive records

   DATA POLICY

   The Archive record manifest remains canonical.

   Podcast records qualify when:

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


  function appendFormattedEpisodeTitle(
    element,
    recordTitle
  ) {

    const title =
      recordTitle || 'Untitled Episode';


    /*
     * Standard Zach & Kyle episodes use a deliberate
     * editorial line break after the host names.
     *
     * Canonical Archive data remains untouched.
     */

    const hostPrefix =
      'Zach & Kyle';


    if (
      title.startsWith(
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
          title
            .slice(
              hostPrefix.length
            )
            .trim()
        );


      element.append(
        hostLine,
        lineBreak,
        episodeTitle
      );


      return;

    }


    element.textContent =
      title;

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


    appendFormattedEpisodeTitle(
      title,
      record.title ||
      `Episode ${episodeNumber}`
    );


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


  function renderEpisodeSequence(episodes) {

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


    /* ------------------------------------------------------
       EMPTY STATE
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
     LATEST EPISODE
  ======================================================== */


  function renderLatestEpisode(episodes) {

    const section =
      document.querySelector(
        '[data-ggg-podcast-latest]'
      );

    if (!section) {

      return;

    }


    /* ------------------------------------------------------
       EMPTY STATE
    ------------------------------------------------------ */

    if (!episodes.length) {

      section.hidden =
        true;

      return;

    }


    const latest =
      episodes[
        episodes.length - 1
      ];


    const episodeNumber =
      Number(
        latest.episodeNumber
      );


    const episode =
      section.querySelector(
        '[data-ggg-podcast-latest-episode]'
      );


    const title =
      section.querySelector(
        '[data-ggg-podcast-latest-title]'
      );


    const link =
      section.querySelector(
        '[data-ggg-podcast-latest-link]'
      );


    if (
      !episode ||
      !title ||
      !link
    ) {

      console.warn(
        '[GGG Podcast] Latest Episode hydration targets missing.'
      );

      return;

    }


    /* ------------------------------------------------------
       EPISODE NUMBER
    ------------------------------------------------------ */

    episode.textContent =
      `EPISODE ${episodeNumber}`;


    /* ------------------------------------------------------
       TITLE
    ------------------------------------------------------ */

    title.replaceChildren();


    appendFormattedEpisodeTitle(
      title,
      latest.title ||
      `Episode ${episodeNumber}`
    );


    /* ------------------------------------------------------
       LINK
    ------------------------------------------------------ */

    link.href =
      latest.url;

    link.textContent =
      'VIEW RECORD';


    link.setAttribute(
      'aria-label',
      latest.title
        ? `View latest episode: Episode ${episodeNumber}, ${latest.title}`
        : `View latest episode: Episode ${episodeNumber}`
    );


    section.hidden =
      false;


    console.info(
      '[GGG Podcast] Latest episode hydrated:',
      episodeNumber
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


      const episodes =
        getPodcastEpisodes(
          records
        );


      /* ----------------------------------------------------
         HYDRATE PODCAST COMPONENTS
      ---------------------------------------------------- */

      renderEpisodeSequence(
        episodes
      );


      renderLatestEpisode(
        episodes
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

    hydrateLatest:
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
