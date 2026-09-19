/* ==========================================================

   GGG DESIGN SYSTEM
   COMPONENT — AMBIENT AUDIO

   VERSION
   v1.3 — iOS Pause Ducking

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
   • playback fades in gently
   • audio loops continuously
   • audio pauses when the page becomes hidden
   • audio resumes when the page becomes visible
   • no visible controls required

   DUCKING MODEL

   • foreground components may request duck()
   • duck state may be established before ambient playback
   • startup always honors the latest duck state
   • desktop fades ambient audio to a reduced level
   • iOS / iPadOS pauses ambient audio while foreground plays
   • restore() resumes / restores the configured ambient state
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
     PLATFORM

     iOS / iPadOS WebKit does not provide a dependable
     per-element volume ducking path across supported devices.

     On those devices, ducking uses pause / resume instead.
  ======================================================== */

  const IS_IOS_FAMILY =
    /iPad|iPhone|iPod/.test(
      navigator.userAgent
    ) ||
    (
      navigator.platform ===
        'MacIntel' &&
      navigator.maxTouchPoints >
        1
    );


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


  let wasPlayingBeforeDuck =
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


  function getVolume(value) {

    return clamp(
      Number(value) || 0,
      0,
      1
    );

  }


  function cancelFade() {

    if (fadeFrame === null) return;


    cancelAnimationFrame(
      fadeFrame
    );


    fadeFrame =
      null;

  }


  /* ========================================================
     VOLUME TRANSITION
  ======================================================== */

  function fadeTo(targetVolume, duration) {

    cancelFade();


    const target =
      getVolume(targetVolume);


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


    function step(now) {

      const progress =
        clamp(
          (now - startTime) / fadeDuration,
          0,
          1
        );


      audio.volume =
        startVolume +
        (
          target - startVolume
        ) * progress;


      if (progress < 1) {

        fadeFrame =
          requestAnimationFrame(step);

      } else {

        audio.volume =
          target;


        fadeFrame =
          null;

      }

    }


    fadeFrame =
      requestAnimationFrame(step);

  }


  /* ========================================================
     AMBIENT LEVEL
  ======================================================== */

  function getCurrentTargetVolume() {

    return isDucked
      ? getVolume(CONFIG.duckVolume)
      : getVolume(CONFIG.volume);

  }


  /* ========================================================
     START
  ======================================================== */

  async function start() {

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

        We no longer need any wake listeners.
      */

      removeInteractionListeners();

      removeScrollListener();


      /*
        Important on mobile:

        Duck state may have been established while play()
        was still resolving. Read the CURRENT state now,
        rather than assuming normal ambient volume.
      */

      if (
        IS_IOS_FAMILY &&
        isDucked
      ) {

        /*
          Foreground audio claimed the mix while ambient
          playback was still unlocking.

          Pause immediately rather than attempting a volume
          transition that iOS may ignore.
        */

        audio.pause();

        return;

      }


      fadeTo(
        getCurrentTargetVolume(),
        isDucked
          ? CONFIG.duckDuration
          : CONFIG.fadeInDuration
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

    /*
      Establish state immediately.

      This is intentionally useful before ambient playback
      has started or while its first play() request is still
      resolving on mobile browsers.
    */

    isDucked =
      true;


    if (!hasStarted) return;


    if (IS_IOS_FAMILY) {

      cancelFade();


      wasPlayingBeforeDuck =
        !audio.paused;


      if (wasPlayingBeforeDuck) {

        audio.pause();

      }


      return;

    }


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


    if (IS_IOS_FAMILY) {

      cancelFade();


      const shouldResume =
        wasPlayingBeforeDuck;


      wasPlayingBeforeDuck =
        false;


      if (
        !shouldResume ||
        document.hidden
      ) {
        return;
      }


      audio.play()
        .catch(() => {

          /*
            If a particular mobile browser rejects the
            automatic resume, leave ambience paused rather
            than interfering with foreground playback.
          */

        });


      return;

    }


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
      passive: true
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
    () => {

      if (!hasStarted) return;


      if (document.hidden) {

        cancelFade();

        audio.pause();

        return;

      }


      /*
        If foreground audio is active on iOS, ambient must
        remain paused until restore() is requested.
      */

      if (
        IS_IOS_FAMILY &&
        isDucked
      ) {
        return;
      }


      audio.play()
        .then(() => {

          /*
            Resume at whichever state is currently active.

            Desktop restores through the normal fade path.
            iOS / iPadOS simply resumes the paused ambience.
          */

          if (IS_IOS_FAMILY) {
            return;
          }


          fadeTo(
            getCurrentTargetVolume(),
            CONFIG.restoreDuration
          );

        })
        .catch(() => {});

    }
  );


  /* ========================================================
     INITIALIZE
  ======================================================== */

  addInteractionListeners();


  /* ========================================================
     PUBLIC API
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

    },

    duck,

    restore,

    get started() {

      return hasStarted;

    },

    get ducked() {

      return isDucked;

    },

    get usesPauseDucking() {

      return IS_IOS_FAMILY;

    }

  };


})();
