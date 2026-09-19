/* ==========================================================
   GGG LIGHTING SYSTEM
   v1.4.0

   TRANSFORM-TRACKED MATERIALS
   + PERFORMANCE PASS 03
   + ARCHIVE INDEX PROFILE CONSOLIDATION
   + HIDDEN CHARACTER REVEAL
   + TEXT ENTRY LIGHTING SUSPENSION

   VISUAL BEHAVIOR

   Preserves the approved GGG flashlight system:

   • cursor-following desktop examination light
   • fixed mobile examination light
   • optical cone movement
   • atmospheric dust
   • battery flicker
   • metal bloom + bevel response
   • photo sheen on full-material pages
   • header / footer exposure behavior
   • hidden character reveals
   • automatic suspension while entering text


   TRANSFORM-TRACKED MATERIALS

   Materials whose rendered geometry changes through CSS
   transforms may opt into live geometry tracking with:

   data-ggg-light-track-transform

   This causes the lighting engine to measure the material's
   current rendered bounding box while it is active.

   Generated metal bloom, bevel and other material responses
   therefore remain registered with translated and scaled
   physical objects.

   Standard materials retain cached geometry for performance.


   TEXT ENTRY BEHAVIOR

   While a text-entry control has focus:

   • flashlight temporarily disappears
   • animation loop pauses
   • battery flicker pauses
   • material effects reset
   • dust pauses
   • mobile keyboard viewport changes are tracked

   When text entry ends:

   • mobile browser viewport is allowed to settle
   • visual viewport dimensions are remeasured
   • material geometry is invalidated
   • mobile light returns to its canonical resting position
   • flashlight resumes without changing user preference


   PERFORMANCE ARCHITECTURE

   General pages:
   • full material response
   • metal, paper, photo, glass, print and ink
   • photo sheen enabled

   Archive index:
   • full global flashlight preserved
   • full metal response preserved
   • paper is visually static
   • photo is visually static
   • glass is visually static
   • print is visually static
   • ink is visually static
   • photo sheen is not created
   • static material types receive no per-frame variables
   • reduced material observer margin
   • reduced dust count


   PERFORMANCE FEATURES

   • Cached material geometry
   • Opt-in live transform geometry tracking
   • Active responsive-material Set
   • WeakMap material lookup
   • Cached viewport / scroll state
   • Cached footer geometry
   • Deduplicated CSS variable writes
   • Single bound animation callback
   • Animation pauses when disabled
   • Animation pauses in hidden tabs
   • Animation pauses during text entry
   • ResizeObserver-driven geometry invalidation
   • VisualViewport keyboard handling
   • Font/load geometry refresh
   • Material-update motion threshold
   • Hidden reveals skip non-visible materials
   • Archive-index runtime material filtering
   • Explicit static-lighting subtree opt-out


   ENABLE PER PAGE

   Standard page:

   window.GGG_LIGHTING_PAGE = {
     enabled: true
   };


   Archive landing page:

   window.GGG_LIGHTING_PAGE = {
     enabled: true,
     performance: 'archive-index'
   };


   MATERIAL DISCOVERY

   data-ggg-material="metal|paper|photo|glass|print|ink"

   or canonical GGG material classes.


   TRANSFORM TRACKING

   data-ggg-light-track-transform

   Use only on materials that physically move, scale or
   otherwise change rendered geometry independently from
   document layout.


   STATIC SUBTREE OPT-OUT

   data-ggg-light-static

   Any material inside an element carrying this attribute
   is ignored entirely by the runtime material engine.


   CHARACTER REVEAL

   class="ggg-light-reveal ggg-light-reveal--characters"


   RUNTIME CONTROL

   window.dispatchEvent(
     new CustomEvent('ggg:lighting-toggle')
   );
========================================================== */

(function () {
  'use strict';


  /* ========================================================
     PAGE CONFIGURATION
  ======================================================== */

  const PAGE =
    window.GGG_LIGHTING_PAGE;


  if (
    !PAGE ||
    PAGE.enabled !== true
  ) {

    return;

  }


  if (
    window.GGG_LIGHTING_ENGINE
  ) {

    return;

  }


  const ARCHIVE_INDEX =
    PAGE.performance ===
    'archive-index';


  /* ========================================================
     ARCHIVE INDEX RUNTIME MATERIALS
  ======================================================== */

  const ARCHIVE_INDEX_RESPONSIVE_TYPES =
    new Set([
      'metal'
    ]);


  /* ========================================================
     CONFIG
  ======================================================== */

  const CONFIG = {

    /* Desktop optics */

    followSpeed:
      .28,

    velocitySmoothing:
      .18,

    maxOpticalOffset:
      8,

    maxStretch:
      18,

    maxConeX:
      145,

    maxConeY:
      105,


    /* Material direction */

    materialDirectionSoftness:
      110,


    /* Material observation */

    materialRootMargin:
      ARCHIVE_INDEX
        ? '80px'
        : '300px',


    /* Hidden light-reveal messages */

    revealRadius:
      280,

    revealTriggerProximity:
      .20,

    revealResetProximity:
      .08,

    revealDuration:
      1200,

    revealHoldDuration:
      5000,

    revealHideDuration:
      1200,


    /* Dust */

    desktopDustCount:
      ARCHIVE_INDEX
        ? 28
        : 54,

    mobileDustCount:
      ARCHIVE_INDEX
        ? 16
        : 26,


    /* Mobile resting behavior */

    mobileBaseY:
      .43,

    mobileMaxLag:
      12,


    /* Mobile entrance */

    headerLightStartY:
      .10,

    headerTravelDistance:
      220,


    /* Footer exit */

    footerSelector:
      '.ggg-site-footer',

    footerRevealStart:
      .95,

    footerRevealEnd:
      .62,


    /* Text-entry suspension */

    desktopInputResumeDelay:
      80,

    mobileInputResumeDelay:
      320

  };


  /* ========================================================
     MATERIAL DEPTH PROFILES
  ======================================================== */

  const PROFILES = {

    metal: {

      depth:
        1,

      maxOpacity:
        .62,

      blurScale:
        1

    },


    glass: {

      depth:
        .48,

      maxOpacity:
        .46,

      blurScale:
        .90

    },


    paper: {

      depth:
        .28,

      maxOpacity:
        .36,

      blurScale:
        .85

    },


    photo: {

      depth:
        .34,

      maxOpacity:
        .40,

      blurScale:
        .88

    },


    print: {

      depth:
        .14,

      maxOpacity:
        .24,

      blurScale:
        .65

    },


    ink: {

      depth:
        .025,

      maxOpacity:
        .09,

      blurScale:
        .34

    }

  };


  const VALID_TYPES =
    new Set(
      Object.keys(
        PROFILES
      )
    );


  /* ========================================================
     AUTOMATIC MATERIAL DISCOVERY
  ======================================================== */

  const CLASS_RULES = [

    [
      '.ggg-material-metal',
      'metal'
    ],

    [
      '.ggg-material-paper',
      'paper'
    ],

    [
      '.ggg-material-photo',
      'photo'
    ],

    [
      '.ggg-material-glass',
      'glass'
    ],

    [
      '.ggg-material-print',
      'print'
    ],

    [
      '.ggg-material-ink',
      'ink'
    ],

    [
      '.ggg-attachment',
      'paper'
    ],

    [
      '.ggg-evidence-photo img',
      'photo'
    ]

  ];


  /* ========================================================
     TEXT ENTRY LIGHTING SUSPENSION
  ======================================================== */

  const TEXT_ENTRY_SELECTOR = [

    'textarea',

    '[contenteditable="true"]',

    'input:not([type])',

    'input[type="text"]',

    'input[type="email"]',

    'input[type="tel"]',

    'input[type="url"]',

    'input[type="search"]',

    'input[type="password"]',

    'input[type="number"]',

    'input[type="date"]',

    'input[type="datetime-local"]',

    'input[type="month"]',

    'input[type="time"]',

    'input[type="week"]'

  ].join(',');


  /* ========================================================
     ENGINE
  ======================================================== */

  class GGGLightingEngine {

    constructor() {

      this.enabled =
        true;


      this.running =
        false;


      this.rafId =
        null;


      this.inputSuspended =
        false;


      this.inputResumeTimer =
        null;


      this.mobile =
        window.matchMedia(
          '(hover: none), (pointer: coarse)'
        ).matches;


      this.reducedMotion =
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;


      this.viewportWidth =
        window.visualViewport
          ? window.visualViewport.width
          : window.innerWidth;


      this.viewportHeight =
        window.visualViewport
          ? window.visualViewport.height
          : window.innerHeight;


      this.scrollX =
        window.scrollX;


      this.scrollY =
        window.scrollY;


      this.targetX =
        this.viewportWidth /
        2;


      this.targetY =
        this.mobile
          ? this.viewportHeight *
            CONFIG.headerLightStartY
          : this.viewportHeight /
            2;


      this.lightX =
        this.targetX;


      this.lightY =
        this.targetY;


      this.previousX =
        this.targetX;


      this.previousY =
        this.targetY;


      this.velocityX =
        0;


      this.velocityY =
        0;


      this.lastScrollY =
        this.scrollY;


      this.scrollVelocity =
        0;


      this.mobileOffsetY =
        0;


      this.batteryStrength =
        1;


      this.headerProgress =
        0;


      this.footerReveal =
        0;


      this.exposureReveal =
        0;


      this.frameActive =
        0;


      this.frameExposure =
        1;


      this.lastMaterialLightX =
        NaN;


      this.lastMaterialLightY =
        NaN;


      this.lastMaterialExposure =
        NaN;


      this.lastMaterialBattery =
        NaN;


      this.last
