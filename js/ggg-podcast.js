/* ==========================================================
   GGG PODCAST
   PODCAST PAGE DATA + RENDERING

   VERSION
   v1.9 — Podcast Voice Priority

   PURPOSE

   Provides Podcast-specific rendering while using the
   canonical GGG Archive data system as the source of truth.

   RESPONSIBILITIES

   • hydrate THE INVESTIGATION episode sequence
   • hydrate CAUGHT UP? latest episode
   • hydrate latest episode summary
   • provide summary-only spoiler control
   • hydrate VOICES FROM THE INVESTIGATION
   • derive Podcast appearances from Archive relationships
   • support optional editorial Voice priority
   • source records through window.GGG.archive
   • source relationships through window.GGG.archive
   • render public records only
   • sort episodes by episodeNumber
   • use canonical Archive titles
   • use canonical Archive summaries
   • use canonical Archive thumbnails
   • link components to canonical Archive records

   DATA POLICY

   The Archive record manifest remains canonical.

   Podcast records qualify when:

   • type === "Podcast"
   • visibility === "public"
   • episodeNumber is a valid number
   • url exists

   Voice records qualify when:

   • type === "Person"
   • visibility === "public"
   • url exists
   • podcastVoice.include === true
   • at least one public Podcast appearance exists

   Podcast appearances are derived from canonical Archive
   relationships using:

   type === "appears-in"

   Expected authored direction:

   PERSON → PODCAST

   Example:

   {
     "source": "GGG-PER-2026-0005",
     "type": "appears-in",
     "target": [
       "GGG-POD-2026-0001",
       "GGG-POD-2026-0008"
     ]
   }

   archive.js normalizes target arrays into individual
   relationships before this file consumes them.

   Draft, scheduled, hidden, malformed, and URL-less records
   fail closed and are not rendered.

   EXPECTED PODCAST RECORD FIELDS

   title
   summary
   type
   episodeNumber
   visibility
   status
   url
   thumbnail

   EXPECTED PERSON RECORD FIELDS

   title
   type
   visibility
   url
   thumbnail

   podcastVoice: {
     include: true,
     credit: "Historian",
     priority: 1
   }

   VOICE ORDER

   • explicit priority first
   • lower priority numbers rank higher
   • records without priority follow chronology
   • chronology = first public episode appearance
   • alphabetical Person title breaks final ties

   SPOILER POLICY

   The latest episode begins spoiler-safe.

   • full episode title remains visible
   • canonical summary is hidden
   • visitor explicitly reveals summary
   • episode number remains visible
   • canonical Archive action remains visible

   ARCHITECTURE

   This file does NOT fetch archive-records.json or
   archive-relationships.json directly.

   It consumes:

   window.GGG.archive

   This prevents Podcast and Archive from maintaining
   separate copies of canonical data.
========================================================== */


(function () {

  'use strict';


  /* ========================================================
     STATE
  ======================================================== */

  let initialized =
    false;


  /* ========================================================
     ARCHIVE INTERFACE
  ======================================================== */


  function getArchiveInterface() {

    return (
      window.GGG &&
      window.GGG.archive
    )
      ? window.GGG.archive
      : null;

  }


  /* ========================================================
     RECORD NORMALIZATION
  ======================================================== */


  function normalizeRecords(source) {

    if (!source) {

      return [];

    }


    /* ------------------------------------------------------
       ARRAY SOURCE
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


  /* ========================================================
     RELATIONSHIP NORMALIZATION
  ======================================================== */


  function normalizeRelationships(source) {

    if (!source) {

      return [];

    }


    if (Array.isArray(source)) {

      return source
        .filter(
          function (relationship) {

            return (
              relationship &&
              typeof relationship === 'object'
            );

          }
        );

    }


    /*
     * Defensive support for an object-based relationship
     * collection if the Archive interface ever returns one.
     */

    if (
      typeof source === 'object'
    ) {

      return Object.values(source)
        .filter(
          function (relationship) {

            return (
              relationship &&
              typeof relationship === 'object'
            );

          }
        );

    }


    return [];

  }


  /* ========================================================
     PODCAST RECORD QUALIFICATION
  ======================================================== */


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
     * Only explicitly public Podcast records qualify.
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
      Number(
        record.episodeNumber
      );


    if (
      !Number.isFinite(
        episodeNumber
      )
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
            Number(
              a.episodeNumber
            ) -
            Number(
              b.episodeNumber
            )
          );

        }
      );

  }


  /* ========================================================
     PERSON RECORD QUALIFICATION
  ======================================================== */


  function isPodcastVoiceRecord(record) {

    if (!record) {

      return false;

    }


    if (
      record.type !== 'Person'
    ) {

      return false;

    }


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


    if (
      !record.podcastVoice ||
      record.podcastVoice.include !== true
    ) {

      return false;

    }


    return true;

  }


  /* ========================================================
     RECORD LOOKUP
  ======================================================== */


  function createRecordMap(records) {

    const map =
      new Map();


    records.forEach(
      function (record) {

        if (
          !record ||
          !record.id
        ) {

          return;

        }


        map.set(
          record.id,
          record
        );

      }
    );


    return map;

  }


  /* ========================================================
     STANDARD EPISODE TITLE FORMATTER
  ======================================================== */


  function appendFormattedEpisodeTitle(
    element,
    recordTitle
  ) {

    const title =
      recordTitle ||
      'Untitled Episode';


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
      Number(
        record.episodeNumber
      );


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
      String(
        episodeNumber
      );


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


    if (
      record.thumbnail
    ) {

      const image =
        document.createElement(
          'img'
        );

      image.src =
        record.thumbnail;

      image.alt =
        record.title
          ? (
              `Episode ${episodeNumber} — ` +
              record.title
            )
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
        ? (
            `View Episode ${episodeNumber}: ` +
            record.title
          )
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


    if (
      !episodes.length
    ) {

      section.hidden =
        true;

      return;

    }


    section.hidden =
      false;


    track.replaceChildren();


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
     LATEST EPISODE SPOILER CONTROL
  ======================================================== */


  function setLatestSpoilerState(
    section,
    hidden
  ) {

    const summary =
      section.querySelector(
        '[data-ggg-podcast-latest-summary]'
      );


    const message =
      section.querySelector(
        '[data-ggg-podcast-latest-spoiler-message]'
      );


    const toggle =
      section.querySelector(
        '[data-ggg-podcast-latest-spoiler-toggle]'
      );


    if (
      !summary ||
      !message ||
      !toggle
    ) {

      return;

    }


    /*
     * Full episode title always remains visible.
     *
     * Only the canonical episode summary is treated
     * as spoiler-sensitive.
     */

    summary.hidden =
      hidden;


    message.hidden =
      !hidden;


    toggle.textContent =
      hidden
        ? 'SHOW DETAILS'
        : 'HIDE DETAILS';


    toggle.setAttribute(
      'aria-expanded',
      hidden
        ? 'false'
        : 'true'
    );


    section.classList.toggle(
      'is-spoiler-hidden',
      hidden
    );

  }


  function initializeLatestSpoilerControl(
    section
  ) {

    const toggle =
      section.querySelector(
        '[data-ggg-podcast-latest-spoiler-toggle]'
      );


    const summary =
      section.querySelector(
        '[data-ggg-podcast-latest-summary]'
      );


    const message =
      section.querySelector(
        '[data-ggg-podcast-latest-spoiler-message]'
      );


    if (
      !toggle ||
      !summary ||
      !message
    ) {

      console.warn(
        '[GGG Podcast] Latest Episode spoiler controls missing.'
      );

      return;

    }


    /*
     * Every page load and hydration begins spoiler-safe.
     */

    setLatestSpoilerState(
      section,
      true
    );


    /*
     * Prevent duplicate listeners if hydration is invoked
     * more than once.
     */

    if (
      toggle.dataset.gggSpoilerBound ===
      'true'
    ) {

      return;

    }


    toggle.dataset.gggSpoilerBound =
      'true';


    toggle.addEventListener(
      'click',
      function () {

        const isExpanded =
          toggle.getAttribute(
            'aria-expanded'
          ) === 'true';


        setLatestSpoilerState(
          section,
          isExpanded
        );

      }
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


    if (
      !episodes.length
    ) {

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


    const summary =
      section.querySelector(
        '[data-ggg-podcast-latest-summary]'
      );


    const link =
      section.querySelector(
        '[data-ggg-podcast-latest-link]'
      );


    if (
      !episode ||
      !title ||
      !summary ||
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
       SUMMARY
    ------------------------------------------------------ */

    summary.textContent =
      latest.summary ||
      'Continue with the newest published episode.';


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
        ? (
            `View latest episode: Episode ` +
            `${episodeNumber}, ${latest.title}`
          )
        : (
            `View latest episode: ` +
            `Episode ${episodeNumber}`
          )
    );


    /* ------------------------------------------------------
       SPOILER CONTROL
    ------------------------------------------------------ */

    initializeLatestSpoilerControl(
      section
    );


    section.hidden =
      false;


    console.info(
      '[GGG Podcast] Latest episode hydrated:',
      episodeNumber
    );

  }


  /* ========================================================
     PODCAST VOICES
  ======================================================== */


  function getPodcastVoices(
    records,
    relationships,
    episodes
  ) {

    const recordMap =
      createRecordMap(
        records
      );


    /*
     * Public Podcast IDs are derived from the exact same
     * qualifying episode collection used elsewhere.
     */

    const publicPodcastIds =
      new Set(
        episodes
          .map(
            function (record) {

              return record.id;

            }
          )
          .filter(Boolean)
      );


    /*
     * personId → Set of public episode numbers
     */

    const appearances =
      new Map();


    relationships.forEach(
      function (relationship) {

        /* --------------------------------------------------
           CANONICAL RELATIONSHIP TYPE

           Archive relationships use:

           relationship.type

           NOT:

           relationship.relationship
        -------------------------------------------------- */

        if (
          !relationship ||
          relationship.type !== 'appears-in'
        ) {

          return;

        }


        const personId =
          relationship.source;


        const podcastId =
          relationship.target;


        if (
          !personId ||
          !podcastId
        ) {

          return;

        }


        /*
         * A relationship can safely be authored before an
         * episode is released.

         * It does not become visible here until the target
         * Podcast itself qualifies as public.
         */

        if (
          !publicPodcastIds.has(
            podcastId
          )
        ) {

          return;

        }


        const person =
          recordMap.get(
            personId
          );


        const podcast =
          recordMap.get(
            podcastId
          );


        if (
          !isPodcastVoiceRecord(
            person
          ) ||
          !isPublicPodcastRecord(
            podcast
          )
        ) {

          return;

        }


        const episodeNumber =
          Number(
            podcast.episodeNumber
          );


        if (
          !appearances.has(
            personId
          )
        ) {

          appearances.set(
            personId,
            new Set()
          );

        }


        appearances
          .get(
            personId
          )
          .add(
            episodeNumber
          );

      }
    );


    const voices =
      [];


    appearances.forEach(
      function (
        episodeSet,
        personId
      ) {

        const person =
          recordMap.get(
            personId
          );


        if (!person) {

          return;

        }


        const episodeNumbers =
          Array.from(
            episodeSet
          )
          .sort(
            function (a, b) {

              return a - b;

            }
          );


        if (
          !episodeNumbers.length
        ) {

          return;

        }


        voices.push({
          person:
            person,

          episodeNumbers:
            episodeNumbers,

          firstEpisode:
            episodeNumbers[0]
        });

      }
    );


    /* ------------------------------------------------------
       VOICE ORDER

       1. Editorial priority
       2. First public episode appearance
       3. Alphabetical Person title

       Lower priority numbers rank higher.

       Records without an explicit positive priority follow
       the normal chronological ordering.
    ------------------------------------------------------ */

    voices.sort(
      function (a, b) {

        const aPriority =
          Number(
            a.person.podcastVoice &&
            a.person.podcastVoice.priority
          );


        const bPriority =
          Number(
            b.person.podcastVoice &&
            b.person.podcastVoice.priority
          );


        const aHasPriority =
          Number.isFinite(
            aPriority
          ) &&
          aPriority > 0;


        const bHasPriority =
          Number.isFinite(
            bPriority
          ) &&
          bPriority > 0;


        /* --------------------------------------------------
           PRIORITIZED PEOPLE COME FIRST
        -------------------------------------------------- */

        if (
          aHasPriority &&
          !bHasPriority
        ) {

          return -1;

        }


        if (
          !aHasPriority &&
          bHasPriority
        ) {

          return 1;

        }


        /* --------------------------------------------------
           ORDER PRIORITIZED PEOPLE BY PRIORITY NUMBER
        -------------------------------------------------- */

        if (
          aHasPriority &&
          bHasPriority &&
          aPriority !== bPriority
        ) {

          return (
            aPriority -
            bPriority
          );

        }


        /* --------------------------------------------------
           DEFAULT:
           FIRST PUBLIC EPISODE APPEARANCE
        -------------------------------------------------- */

        const episodeDifference =
          a.firstEpisode -
          b.firstEpisode;


        if (
          episodeDifference !== 0
        ) {

          return episodeDifference;

        }


        /* --------------------------------------------------
           FINAL TIE-BREAKER:
           ALPHABETICAL
        -------------------------------------------------- */

        return String(
          a.person.title || ''
        ).localeCompare(
          String(
            b.person.title || ''
          )
        );

      }
    );


    return voices;

  }


  /* ========================================================
     PODCAST VOICE CARD
  ======================================================== */


  function createPodcastVoiceCard(
    voice
  ) {

    const person =
      voice.person;


    const episodeNumbers =
      voice.episodeNumbers;


    /* ------------------------------------------------------
       LINK
    ------------------------------------------------------ */

    const link =
      document.createElement(
        'a'
      );

    link.className =
      'ggg-podcast-guest';

    link.href =
      person.url;


    link.dataset.recordId =
      person.id || '';


    link.setAttribute(
      'aria-label',
      person.title
        ? (
            `View Archive record for ` +
            person.title
          )
        : 'View Person Archive record'
    );


    /* ------------------------------------------------------
       PORTRAIT SLOT

       Slot always exists so identities remain aligned.
    ------------------------------------------------------ */

    const portrait =
      document.createElement(
        'div'
      );

    portrait.className =
      'ggg-podcast-guest__portrait';


    if (
      person.thumbnail
    ) {

      const image =
        document.createElement(
          'img'
        );

      image.src =
        person.thumbnail;

      image.alt =
        '';

      image.loading =
        'lazy';

      image.dataset.gggMaterial =
        'photo';


      portrait.appendChild(
        image
      );


    } else {

      portrait.setAttribute(
        'aria-hidden',
        'true'
      );

    }


    /* ------------------------------------------------------
       IDENTITY
    ------------------------------------------------------ */

    const identity =
      document.createElement(
        'div'
      );

    identity.className =
      'ggg-podcast-guest__identity';


    const name =
      document.createElement(
        'div'
      );

    name.className =
      'ggg-podcast-guest__name';

    name.dataset.gggMaterial =
      'print';

    name.textContent =
      person.title ||
      'Unnamed Person';


    /* ------------------------------------------------------
       DETAIL

       Credit may truncate independently.

       Episode appearance always remains visible.

       Example:

       Film, television, and theater actress · EP. 101
    ------------------------------------------------------ */

    const detail =
      document.createElement(
        'div'
      );

    detail.className =
      'ggg-podcast-guest__detail';

    detail.dataset.gggMaterial =
      'ink';


    const credit =
      (
        person.podcastVoice &&
        person.podcastVoice.credit
      )
        ? String(
            person.podcastVoice.credit
          ).trim()
        : 'Guest';


    const appearanceLabel =
      episodeNumbers.length === 1
        ? `EP. ${episodeNumbers[0]}`
        : (
            'EP. ' +
            episodeNumbers.join(
              ', '
            )
          );


    const creditElement =
      document.createElement(
        'span'
      );

    creditElement.className =
      'ggg-podcast-guest__credit';

    creditElement.textContent =
      credit;


    const separator =
      document.createElement(
        'span'
      );

    separator.className =
      'ggg-podcast-guest__separator';

    separator.setAttribute(
      'aria-hidden',
      'true'
    );

    separator.textContent =
      '·';


    const appearances =
      document.createElement(
        'span'
      );

    appearances.className =
      'ggg-podcast-guest__appearances';

    appearances.textContent =
      appearanceLabel;


    detail.append(
      creditElement,
      separator,
      appearances
    );


    identity.append(
      name,
      detail
    );


    link.append(
      portrait,
      identity
    );


    return link;

  }


  /* ========================================================
     VOICES FROM THE INVESTIGATION
  ======================================================== */


  function renderPodcastVoices(
    records,
    relationships,
    episodes
  ) {

    const section =
      document.querySelector(
        '[data-ggg-podcast-voices]'
      );


    if (!section) {

      return;

    }


    const grid =
      section.querySelector(
        '[data-ggg-podcast-voices-grid]'
      );


    if (!grid) {

      console.warn(
        '[GGG Podcast] Voices grid not found.'
      );

      return;

    }


    const voices =
      getPodcastVoices(
        records,
        relationships,
        episodes
      );


    /* ------------------------------------------------------
       EMPTY STATE

       If nobody currently qualifies, the component disappears
       rather than exposing an empty guest index.
    ------------------------------------------------------ */

    if (
      !voices.length
    ) {

      section.hidden =
        true;

      grid.replaceChildren();

      return;

    }


    section.hidden =
      false;


    /* ------------------------------------------------------
       RESET

       Prevent duplicate entries if hydration runs again.
    ------------------------------------------------------ */

    grid.replaceChildren();


    voices.forEach(
      function (voice) {

        grid.appendChild(
          createPodcastVoiceCard(
            voice
          )
        );

      }
    );


    console.info(
      '[GGG Podcast] Voices hydrated:',
      voices.length
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
      typeof archive.getAllRecords !== 'function' ||
      typeof archive.getAllRelationships !== 'function'
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


      const relationships =
        normalizeRelationships(
          archive.getAllRelationships()
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


      renderPodcastVoices(
        records,
        relationships,
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

    hydrateVoices:
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
