/* ==========================================================

   GGG DESIGN SYSTEM
   COMPONENT — AMBIENT AUDIO

   VERSION
   v1.2 — Foreground Audio Priority

   PURPOSE

   Provides a quiet looping atmospheric audio layer for
   selected GGG pages.

   The system is page-configured and remains independent
   from foreground audio experiences such as the Insignia
   Audio Player.

   PLAYBACK MODEL

   • page explicitly opts in
   • audio waits for first user interaction
   • pointer, touch, keyboard and scroll may attempt wake
   • foreground audio controls own their interaction
   • playback fades in gently
   • audio loops continuously
   • audio pauses when the page becomes hidden
   • audio resumes when the page becomes visible
   • no visible controls required

   FOREGROUND AUDIO PRIORITY

   • interactions inside [data-ggg-audio-player] do not
     attempt to wake ambient playback
   • foreground media receives the interaction exclusively
   • existing ambient playback may still be ducked through
     the public API
   • prevents competing play() requests from sharing the
     same initial interaction

   DUCKING MODEL

   • foreground components may request duck()
   • ambient audio fades to a reduced level
   • restore() returns to the configured ambient volume
   • foreground components do not directly manipulate audio

   PAGE CONFIGURATION

   window.GGG_AMBIENT_AUDIO = {
     enabled: true,
     src: '...',
     volume: 0.10,
     fadeInDuration: 1800,
     duckVolume: 0.025,
     duckDuration: 500,
     restoreDuration: 1000
   };

========================================================== */


(() => {

  'use strict';


  /* ========================================================
     CONFIG
  ======================================================== */

  const DEFAULTS = {

    enabled:
      false,

    src:
      '',

    volume:
      0.10,

    fadeInDuration:
      1800,

    duckVolume:
      0.025,

    duckDuration:
      500,

    restoreDuration:
      1000

  };


  const PAGE_CONFIG =
    window.GGG_AMBIENT_AUDIO || {};


  const CONFIG = {
    ...DEFAULTS,
    ...PAGE_CONFIG
  };


  /* ========================================================
     VALIDATE
  ======================================================== */

  if (!CONFIG.enabled) return;


  if (!CONFIG.src) {

    console.warn(
      '[GGG Ambient Audio] No audio source provided.'
    );

    return;

  }


  /* ========================================================
     AUDIO
  ======================================================== */

  const audio =
    new Audio(CONFIG.src);


  audio.loop =
    true;


  audio.preload =
    'auto';


  audio.volume =
    0;


  /* ========================================================
     STATE
  ======================================================== */

  let hasStarted =
    false;


  let isStarting =
    false;


  let isDucked =
    false;


  let fadeFrame =
    null;


  /* ========================================================
     HELPERS
  ======================================================== */

  function clamp(
    value,
    min,
    max
  ) {

    return Math.min(
      Math.max(
        value,
        min
      ),
      max
    );

  }


  function getVolume(
    value
  ) {

    return clamp(
      Number(value) || 0,
      0,
      1
    );

  }


  function cancelFade() {

    if (
      fadeFrame ===
      null
    ) {
      return;
    }


    cancelAnimationFrame(
      fadeFrame
    );


    fadeFrame =
      null;

  }


  /* ========================================================
     FOREGROUND AUDIO INTERACTION

     Foreground audio controls own their initiating gesture.

     The ambient system must not attempt audio.play() from
     the same pointer / keyboard interaction used to start
     foreground media.
  ======================================================== */

  function isForegroundAudioInteraction(
    event
  ) {

    if (
      !event ||
      !event.target ||
      typeof event.target.closest !==
        'function'
    ) {

      return false;

    }


    return Boolean(
      event.target.closest(
        '[data-ggg-audio-player]'
      )
    );

  }


  /* ========================================================
     VOLUME TRANSITION
  ======================================================== */

  function fadeTo(
    targetVolume,
    duration
  ) {

    cancelFade();


    const target =
      getVolume(
        targetVolume
      );


    const fadeDuration =
      Math.max(
        Number(duration) || 0,
        0
      );


    if (!fadeDuration) {

      audio.volume =
        target;

      return;

    }


    const startVolume =
      audio.volume;


    const startTime =
      performance.now();


    function step(
      now
    ) {

      const progress =
        clamp(
          (
            now -
            startTime
          ) /
          fadeDuration,
          0,
          1
        );


      audio.volume =
        startVolume +
        (
          target -
          startVolume
        ) *
        progress;


      if (
        progress <
        1
      ) {

        fadeFrame =
          requestAnimationFrame(
            step
          );

      } else {

        audio.volume =
          target;


        fadeFrame =
          null;

      }

    }


    fadeFrame =
      requestAnimationFrame(
        step
      );

  }


  /* ========================================================
     AMBIENT LEVEL
  ======================================================== */

  function getCurrentTargetVolume() {

    return isDucked
      ? getVolume(
          CONFIG.duckVolume
        )
      : getVolume(
          CONFIG.volume
        );

  }


  /* ========================================================
     START
  ======================================================== */

  async function start(
    event
  ) {

    /*
      Foreground audio controls own their interaction.

      Do not attempt to wake the ambient layer from the same
      event that may start foreground playback.
    */

    if (
      isForegroundAudioInteraction(
        event
      )
    ) {

      return;

    }


    if (hasStarted) return;


    if (isStarting) return;


    isStarting =
      true;


    try {

      await audio.play();


      hasStarted =
        true;


      isStarting =
        false;


      /*
        Playback has successfully unlocked.

        Wake listeners are no longer required.
      */

      removeInteractionListeners();

      removeScrollListener();


      fadeTo(
        getCurrentTargetVolume(),
        CONFIG.fadeInDuration
      );

    } catch (error) {

      isStarting =
        false;


      /*
        Some browsers do not treat every interaction type
        as permission to begin audible media.

        Keep all wake listeners active so a later valid
        interaction can retry playback.
      */

    }

  }


  /* ========================================================
     DUCK
  ======================================================== */

  function duck() {

    isDucked =
      true;


    /*
      Duck state may be established before ambient playback
      begins.

      This allows foreground audio to own the first page
      interaction without causing ambient audio to enter at
      full volume later while foreground audio remains active.
    */

    if (!hasStarted) return;


    fadeTo(
      CONFIG.duckVolume,
      CONFIG.duckDuration
    );

  }


  /* ========================================================
     RESTORE
  ======================================================== */

  function restore() {

    isDucked =
      false;


    if (!hasStarted) return;


    fadeTo(
      CONFIG.volume,
      CONFIG.restoreDuration
    );

  }


  /* ========================================================
     INTERACTION
  ======================================================== */

  const interactionEvents = [
    'pointerdown',
    'touchstart',
    'keydown',
    'wheel'
  ];


  function addInteractionListeners() {

    interactionEvents.forEach(
      function (
        eventName
      ) {

        document.addEventListener(
          eventName,
          start,
          {
            passive:
              true
          }
        );

      }
    );

  }


  function removeInteractionListeners() {

    interactionEvents.forEach(
      function (
        eventName
      ) {

        document.removeEventListener(
          eventName,
          start
        );

      }
    );

  }


  /*
    Touch scrolling will normally trigger touchstart before
    movement begins.

    The window scroll listener provides an additional wake
    attempt for scrolling initiated through other input
    mechanisms.

    Browsers may reject audio playback from scroll itself.
    If so, the remaining interaction listeners stay active.
  */

  window.addEventListener(
    'scroll',
    start,
    {
      passive:
        true
    }
  );


  function removeScrollListener() {

    window.removeEventListener(
      'scroll',
      start
    );

  }


  /* ========================================================
     PAGE VISIBILITY
  ======================================================== */

  document.addEventListener(
    'visibilitychange',
    function () {

      if (!hasStarted) return;


      if (
        document.hidden
      ) {

        cancelFade();


        audio.pause();


        return;

      }


      audio.play()
        .then(
          function () {

            /*
              Resume at whichever ambient state is currently
              active.

              If foreground audio is still active, remain
              ducked. Otherwise return to normal ambience.
            */

            fadeTo(
              getCurrentTargetVolume(),
              CONFIG.restoreDuration
            );

          }
        )
        .catch(
          function () {

            /*
              A browser may require another interaction after
              visibility changes.

              No additional action is required here.
            */

          }
        );

    }
  );


  /* ========================================================
     INITIALIZE
  ======================================================== */

  addInteractionListeners();


  /* ========================================================
     PUBLIC API

     Other GGG systems communicate with the ambient layer
     through this interface rather than manipulating the
     underlying audio element directly.
  ======================================================== */

  window.GGG_AMBIENT_AUDIO_PLAYER = {

    audio,

    config:
      CONFIG,

    play:
      start,

    pause:
      function () {

        cancelFade();


        audio.pause();

      },

    duck:
      duck,

    restore:
      restore,

    get started() {

      return hasStarted;

    },

    get ducked() {

      return isDucked;

    }

  };


})();
