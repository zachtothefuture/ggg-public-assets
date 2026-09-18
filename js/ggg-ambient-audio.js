/* ==========================================================

   GGG DESIGN SYSTEM
   COMPONENT — AMBIENT AUDIO

   VERSION
   v1.0 — Shared Page Atmosphere

   PURPOSE

   Provides a quiet looping atmospheric audio layer for
   selected GGG pages.

   The system is page-configured and remains independent
   from foreground audio experiences such as the Insignia
   Audio Player.

   PLAYBACK MODEL

   • page explicitly opts in
   • audio waits for first user interaction
   • playback fades in gently
   • audio loops continuously
   • audio pauses when the page becomes hidden
   • audio resumes when the page becomes visible
   • no visible controls required

   PAGE CONFIGURATION

   window.GGG_AMBIENT_AUDIO = {
     enabled: true,
     src: '...',
     volume: 0.10
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
      1800

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


  let fadeFrame =
    null;


  /* ========================================================
     HELPERS
  ======================================================== */

  function clamp(value, min, max) {

    return Math.min(
      Math.max(value, min),
      max
    );

  }


  function cancelFade() {

    if (!fadeFrame) return;


    cancelAnimationFrame(
      fadeFrame
    );


    fadeFrame =
      null;

  }


  /* ========================================================
     FADE IN
  ======================================================== */

  function fadeIn() {

    cancelFade();


    const targetVolume =
      clamp(
        Number(CONFIG.volume) || 0,
        0,
        1
      );


    const duration =
      Math.max(
        Number(CONFIG.fadeInDuration) || 0,
        0
      );


    if (!duration) {

      audio.volume =
        targetVolume;

      return;

    }


    const startVolume =
      audio.volume;


    const startTime =
      performance.now();


    function step(now) {

      const progress =
        clamp(
          (now - startTime) / duration,
          0,
          1
        );


      audio.volume =
        startVolume +
        (
          targetVolume - startVolume
        ) * progress;


      if (progress < 1) {

        fadeFrame =
          requestAnimationFrame(step);

      } else {

        fadeFrame =
          null;

      }

    }


    fadeFrame =
      requestAnimationFrame(step);

  }


  /* ========================================================
     START
  ======================================================== */

  async function start() {

    if (hasStarted) return;


    try {

      await audio.play();


      hasStarted =
        true;


      fadeIn();


      removeInteractionListeners();

    } catch (error) {

      /*
        Playback may still be blocked if the browser does not
        consider the event a valid user gesture.

        Keep listeners active so another interaction can retry.
      */

    }

  }


  /* ========================================================
     INTERACTION
  ======================================================== */

  const interactionEvents = [
    'pointerdown',
    'touchstart',
    'keydown'
  ];


  function addInteractionListeners() {

    interactionEvents.forEach(
      eventName => {

        document.addEventListener(
          eventName,
          start,
          {
            passive: true
          }
        );

      }
    );

  }


  function removeInteractionListeners() {

    interactionEvents.forEach(
      eventName => {

        document.removeEventListener(
          eventName,
          start
        );

      }
    );

  }


  /* ========================================================
     PAGE VISIBILITY
  ======================================================== */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (!hasStarted) return;


      if (document.hidden) {

        cancelFade();

        audio.pause();

        return;

      }


      audio.play()
        .then(fadeIn)
        .catch(() => {});

    }
  );


  /* ========================================================
     INITIALIZE
  ======================================================== */

  addInteractionListeners();


  /* ========================================================
     PUBLIC API

     Exposed now so other GGG components can communicate
     with the ambient layer later without owning it.

     Future use:
     • insignia audio ducking
     • mute controls
     • page transitions
  ======================================================== */

  window.GGG_AMBIENT_AUDIO_PLAYER = {

    audio,

    config:
      CONFIG,

    play:
      start,

    pause() {

      cancelFade();

      audio.pause();

    }

  };


})();
