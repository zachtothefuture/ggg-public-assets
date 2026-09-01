/* ==========================================================
   GGG LIGHTING SYSTEM
   v1.2.0

   PERFORMANCE PASS 03
   + ARCHIVE INDEX PROFILE CONSOLIDATION
   + HIDDEN CHARACTER REVEAL

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
   • Active responsive-material Set
   • WeakMap material lookup
   • Cached viewport / scroll state
   • Cached footer geometry
   • Deduplicated CSS variable writes
   • Single bound animation callback
   • Animation pauses when disabled
   • Animation pauses in hidden tabs
   • ResizeObserver-driven geometry invalidation
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

     Archive Home now receives its moving illumination from
     the global flashlight.

     Only metal retains full per-element material response.

     Character-reveal elements are also registered when
     necessary so they retain geometry / visibility tracking.
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
      .62

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
     ENGINE
  ======================================================== */

  class GGGLightingEngine {

    constructor() {


      /* ====================================================
         ENGINE STATE
      ==================================================== */

      this.enabled =
        true;


      this.running =
        false;


      this.rafId =
        null;


      this.mobile =
        window.matchMedia(
          '(hover: none), (pointer: coarse)'
        ).matches;


      this.reducedMotion =
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;


      /* ====================================================
         CACHED VIEWPORT STATE
      ==================================================== */

      this.viewportWidth =
        window.innerWidth;


      this.viewportHeight =
        window.innerHeight;


      this.scrollX =
        window.scrollX;


      this.scrollY =
        window.scrollY;


      /* ====================================================
         LIGHT STATE
      ==================================================== */

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


      /* ====================================================
         MOBILE STATE
      ==================================================== */

      this.lastScrollY =
        this.scrollY;


      this.scrollVelocity =
        0;


      this.mobileOffsetY =
        0;


      /* ====================================================
         BATTERY / EXPOSURE
      ==================================================== */

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


      /* ====================================================
         MATERIAL FRAME CACHE
      ==================================================== */

      this.lastMaterialLightX =
        NaN;


      this.lastMaterialLightY =
        NaN;


      this.lastMaterialExposure =
        NaN;


      this.lastMaterialBattery =
        NaN;


      this.lastMaterialActive =
        NaN;


      /* ====================================================
         MATERIAL COLLECTIONS

         materials
         All runtime-registered materials. This includes
         responsive materials and any non-responsive element
         required for hidden-reveal geometry tracking.

         activeMaterials
         Only visible materials that actually consume live
         lighting response.
      ==================================================== */

      this.materials =
        [];


      this.activeMaterials =
        new Set();


      this.materialElements =
        new WeakSet();


      this.materialMap =
        new WeakMap();


      /* ====================================================
         GENERATED EFFECTS
      ==================================================== */

      this.dust =
        [];


      /* ====================================================
         HIDDEN LIGHT REVEALS
      ==================================================== */

      this.lightReveals =
        [];


      /* ====================================================
         CSS VARIABLE CACHES
      ==================================================== */

      this.lightVars =
        Object.create(
          null
        );


      /* ====================================================
         OBSERVERS
      ==================================================== */

      this.intersectionObserver =
        null;


      this.resizeObserver =
        null;


      /* ====================================================
         FOOTER GEOMETRY
      ==================================================== */

      this.footer =
        document.querySelector(
          CONFIG.footerSelector
        );


      this.footerGeometryDirty =
        true;


      this.footerDocTop =
        0;


      /* ====================================================
         DOCUMENT STATE CACHE
      ==================================================== */

      this.documentLightingState =
        null;


      this.documentFooterState =
        null;


      /* ====================================================
         BATTERY TIMER
      ==================================================== */

      this.batteryTimer =
        null;


      /* ====================================================
         BIND RAF ONCE
      ==================================================== */

      this.animate =
        this.animate.bind(
          this
        );

    }


    /* ======================================================
       INITIALIZATION
    ====================================================== */

    init() {

      this.cleanupGenerated();


      document.body.classList.toggle(
        'ggg-lighting-profile-archive-index',
        ARCHIVE_INDEX
      );


      this.createLight();

      this.createObservers();

      this.discoverMaterials();

      this.prepareLightReveals();

      this.measureFooter();

      this.createDust();

      this.bindEvents();

      this.scheduleBatteryEvent();


      this.running =
        true;


      this.updateDocumentState();


      this.emitState();


      this.requestFrame();

    }


    /* ======================================================
       GENERATED DOM CLEANUP
    ====================================================== */

    cleanupGenerated() {

      document.querySelectorAll(
        [
          '.ggg-light',
          '.ggg-metal-bloom',
          '.ggg-metal-bevel',
          '.ggg-photo-sheen'
        ].join(', ')
      ).forEach(
        element => {

          element.remove();

        }
      );

    }


    /* ======================================================
       FRAME CONTROL
    ====================================================== */

    requestFrame() {

      if (
        !this.running ||
        !this.enabled ||
        document.hidden ||
        this.rafId !== null
      ) {

        return;

      }


      this.rafId =
        requestAnimationFrame(
          this.animate
        );

    }


    cancelFrame() {

      if (
        this.rafId === null
      ) {

        return;

      }


      cancelAnimationFrame(
        this.rafId
      );


      this.rafId =
        null;

    }


    /* ======================================================
       RUNTIME ENABLE / DISABLE
    ====================================================== */

    setEnabled(
      enabled
    ) {

      const next =
        enabled === true;


      if (
        this.enabled === next
      ) {

        this.updateDocumentState();

        this.emitState();

        return;

      }


      this.enabled =
        next;


      if (
        !this.enabled
      ) {

        clearTimeout(
          this.batteryTimer
        );


        this.batteryTimer =
          null;


        this.batteryStrength =
          1;


        this.setVar(
          this.light,
          this.lightVars,
          '--ggg-battery-strength',
          '1'
        );


        this.light.classList.remove(
          'is-active'
        );


        this.light.style.display =
          'none';


        this.cancelFrame();


        this.resetMaterialEffects();

      } else {

        this.light.style.removeProperty(
          'display'
        );


        this.light.classList.add(
          'is-active'
        );


        this.previousX =
          this.targetX;


        this.previousY =
          this.targetY;


        this.velocityX =
          0;


        this.velocityY =
          0;


        this.resetMaterialFrameCache();


        this.invalidateGeometry();


        this.scheduleBatteryEvent();


        this.requestFrame();

      }


      this.updateDocumentState();


      this.emitState();

    }


    toggleEnabled() {

      this.setEnabled(
        !this.enabled
      );

    }


    emitState() {

      window.dispatchEvent(
        new CustomEvent(
          'ggg:lighting-state',
          {

            detail: {

              enabled:
                this.enabled

            }

          }
        )
      );

    }


    /* ======================================================
       DOCUMENT STATE
    ====================================================== */

    updateDocumentState() {

      if (
        !document.body
      ) {

        return;

      }


      if (
        this.documentLightingState !==
        this.enabled
      ) {

        document.body.classList.toggle(
          'ggg-lighting-enabled',
          this.enabled
        );


        document.body.classList.toggle(
          'ggg-lighting-disabled',
          !this.enabled
        );


        this.documentLightingState =
          this.enabled;

      }


      const footerRevealed =
        this.footerReveal >=
        .98;


      if (
        this.documentFooterState !==
        footerRevealed
      ) {

        document.body.classList.toggle(
          'ggg-footer-revealed',
          footerRevealed
        );


        this.documentFooterState =
          footerRevealed;

      }

    }


    /* ======================================================
       MATERIAL FRAME CACHE RESET
    ====================================================== */

    resetMaterialFrameCache() {

      this.lastMaterialLightX =
        NaN;


      this.lastMaterialLightY =
        NaN;


      this.lastMaterialExposure =
        NaN;


      this.lastMaterialBattery =
        NaN;


      this.lastMaterialActive =
        NaN;

    }


    /* ======================================================
       MATERIAL EFFECT RESET
    ====================================================== */

    resetMaterialEffects() {

      this.materials.forEach(
        material => {

          if (
            !material.respondsToLight
          ) {

            return;

          }


          this.deactivateMaterial(
            material
          );

        }
      );


      this.lightReveals.forEach(
        reveal => {

          reveal.characters.forEach(
            character => {

              character.visible =
                false;


              character.element
                .classList.remove(
                  'is-visible'
                );

            }
          );


          reveal.state =
            'waiting';


          reveal.armed =
            true;


          reveal.phaseStart =
            0;

        }
      );


      this.dust.forEach(
        particle => {

          if (
            particle.opacity !==
            '0'
          ) {

            particle.opacity =
              '0';


            particle.element.style.opacity =
              '0';

          }

        }
      );

    }


    /* ======================================================
       CSS VARIABLE WRITERS
    ====================================================== */

    setVar(
      element,
      cache,
      property,
      value
    ) {

      if (
        cache[property] ===
        value
      ) {

        return;

      }


      cache[property] =
        value;


      element.style.setProperty(
        property,
        value
      );

    }


    setMaterialVar(
      material,
      property,
      value
    ) {

      this.setVar(
        material.element,
        material.vars,
        property,
        value
      );

    }


    /* ======================================================
       LIGHT DOM
    ====================================================== */

    createLight() {

      this.light =
        document.createElement(
          'div'
        );


      this.light.className =
        'ggg-light';


      this.light.setAttribute(
        'aria-hidden',
        'true'
      );


      document.body.appendChild(
        this.light
      );


      document.documentElement.classList.remove(
        'ggg-lighting-boot'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-header-reveal',
        '0'
      );


      const coarse =
        document.createElement(
          'div'
        );


      coarse.className =
        'ggg-light__noise ggg-light__noise--coarse';


      this.light.appendChild(
        coarse
      );


      const fine =
        document.createElement(
          'div'
        );


      fine.className =
        'ggg-light__noise ggg-light__noise--fine';


      this.light.appendChild(
        fine
      );


      this.dustLayer =
        document.createElement(
          'div'
        );


      this.dustLayer.className =
        'ggg-light__dust';


      this.light.appendChild(
        this.dustLayer
      );


      if (
        this.mobile
      ) {

        this.light.classList.add(
          'is-active'
        );

      }

    }


    /* ======================================================
       OBSERVERS
    ====================================================== */

    createObservers() {

      if (
        'IntersectionObserver'
        in window
      ) {

        this.intersectionObserver =
          new IntersectionObserver(

            entries => {

              entries.forEach(
                entry => {

                  const material =
                    this.materialMap.get(
                      entry.target
                    );


                  if (
                    !material
                  ) {

                    return;

                  }


                  this.cacheMaterialRect(
                    material,
                    entry.boundingClientRect
                  );


                  if (
                    entry.isIntersecting
                  ) {

                    material.visible =
                      true;


                    if (
                      material.respondsToLight
                    ) {

                      this.activeMaterials.add(
                        material
                      );

                    }

                  } else {

                    material.visible =
                      false;


                    if (
                      material.respondsToLight
                    ) {

                      this.activeMaterials.delete(
                        material
                      );


                      this.deactivateMaterial(
                        material
                      );

                    }

                  }

                }
              );

            },

            {

              rootMargin:
                CONFIG.materialRootMargin

            }

          );

      }


      if (
        'ResizeObserver'
        in window
      ) {

        this.resizeObserver =
          new ResizeObserver(
            entries => {

              let documentChanged =
                false;


              entries.forEach(
                entry => {

                  if (
                    entry.target ===
                    document.body
                  ) {

                    documentChanged =
                      true;

                    return;

                  }


                  if (
                    entry.target ===
                    this.footer
                  ) {

                    this.footerGeometryDirty =
                      true;

                  }


                  const material =
                    this.materialMap.get(
                      entry.target
                    );


                  if (
                    material
                  ) {

                    material.geometryDirty =
                      true;

                  }

                }
              );


              if (
                documentChanged
              ) {

                this.invalidateGeometry();

              }

            }
          );


        if (
          document.body
        ) {

          this.resizeObserver.observe(
            document.body
          );

        }


        if (
          this.footer
        ) {

          this.resizeObserver.observe(
            this.footer
          );

        }

      }

    }


    /* ======================================================
       GEOMETRY INVALIDATION
    ====================================================== */

    invalidateGeometry() {

      this.footerGeometryDirty =
        true;


      this.materials.forEach(
        material => {

          material.geometryDirty =
            true;

        }
      );


      this.resetMaterialFrameCache();

    }


    cacheMaterialRect(
      material,
      rect
    ) {

      if (
        !rect
      ) {

        return;

      }


      material.geometry.docLeft =
        rect.left +
        this.scrollX;


      material.geometry.docTop =
        rect.top +
        this.scrollY;


      material.geometry.width =
        rect.width;


      material.geometry.height =
        rect.height;


      if (
        material.dynamicPosition
      ) {

        material.geometry.viewportLeft =
          rect.left;


        material.geometry.viewportTop =
          rect.top;

      }


      material.geometryDirty =
        false;

    }


    measureMaterial(
      material
    ) {

      const rect =
        material.element
          .getBoundingClientRect();


      this.cacheMaterialRect(
        material,
        rect
      );

    }


    getMaterialRect(
      material
    ) {

      if (
        material.dynamicPosition ||
        material.geometryDirty
      ) {

        this.measureMaterial(
          material
        );

      }


      const geometry =
        material.geometry;


      const frameRect =
        material.frameRect;


      if (
        material.dynamicPosition
      ) {

        frameRect.left =
          geometry.viewportLeft;


        frameRect.top =
          geometry.viewportTop;

      } else {

        frameRect.left =
          geometry.docLeft -
          this.scrollX;


        frameRect.top =
          geometry.docTop -
          this.scrollY;

      }


      frameRect.width =
        geometry.width;


      frameRect.height =
        geometry.height;


      return frameRect;

    }


    /* ======================================================
       MATERIAL PROFILE HELPERS
    ====================================================== */

    materialRespondsToLight(
      type
    ) {

      if (
        !ARCHIVE_INDEX
      ) {

        return true;

      }


      return ARCHIVE_INDEX_RESPONSIVE_TYPES.has(
        type
      );

    }


    materialNeedsRevealTracking(
      element
    ) {

      return element.classList.contains(
        'ggg-light-reveal--characters'
      );

    }


    /* ======================================================
       MATERIAL DISCOVERY
    ====================================================== */

    discoverMaterials() {

      document
        .querySelectorAll(
          '[data-ggg-material]'
        )
        .forEach(
          element => {

            this.registerMaterial(
              element,
              element.getAttribute(
                'data-ggg-material'
              )
            );

          }
        );


      CLASS_RULES.forEach(
        ([selector, type]) => {

          document
            .querySelectorAll(
              selector
            )
            .forEach(
              element => {

                this.registerMaterial(
                  element,
                  type
                );

              }
            );

        }
      );

    }


    registerMaterial(
      element,
      type
    ) {

      if (
        !element ||
        this.materialElements.has(
          element
        ) ||
        !VALID_TYPES.has(
          type
        )
      ) {

        return;

      }


      /* ====================================================
         EXPLICIT STATIC SUBTREE

         Anything inside data-ggg-light-static is completely
         excluded from runtime material behavior.
      ==================================================== */

      if (
        element.closest(
          '[data-ggg-light-static]'
        )
      ) {

        return;

      }


      this.materialElements.add(
        element
      );


      /* ====================================================
         CANONICAL MATERIAL CONTRACT

         These remain present even when Archive Home chooses
         not to register the element for live calculations.
         Component CSS may depend on them.
      ==================================================== */

      element.classList.add(
        'ggg-light-material'
      );


      element.setAttribute(
        'data-ggg-light-type',
        type
      );


      const respondsToLight =
        this.materialRespondsToLight(
          type
        );


      const needsRevealTracking =
        this.materialNeedsRevealTracking(
          element
        );


      /* ====================================================
         ARCHIVE INDEX FAST PATH

         Static Archive Home materials keep their semantic
         material class/type but never enter the runtime
         geometry, observer or animation systems.

         A hidden character reveal is the exception because
         it still requires geometry and visibility tracking.
      ==================================================== */

      if (
        !respondsToLight &&
        !needsRevealTracking
      ) {

        return;

      }


      const position =
        window.getComputedStyle(
          element
        ).position;


      const material = {

        element,

        type,

        profile:
          PROFILES[type],


        respondsToLight,

        needsRevealTracking,


        visible:
          !this.intersectionObserver,


        dynamicPosition:
          position === 'fixed' ||
          position === 'sticky',


        geometryDirty:
          true,


        geometry: {

          docLeft:
            0,

          docTop:
            0,

          viewportLeft:
            0,

          viewportTop:
            0,

          width:
            0,

          height:
            0

        },


        frameRect: {

          left:
            0,

          top:
            0,

          width:
            0,

          height:
            0

        },


        vars:
          Object.create(
            null
          ),


        bloomVars:
          Object.create(
            null
          ),


        bevelVars:
          Object.create(
            null
          ),


        sheenVars:
          Object.create(
            null
          ),


        strength:
          0,


        bevelStrength:
          0,


        hovered:
          false,


        bloom:
          null,


        bevel:
          null,


        sheen:
          null

      };


      this.materials.push(
        material
      );


      this.materialMap.set(
        element,
        material
      );


      this.measureMaterial(
        material
      );


      if (
        this.intersectionObserver
      ) {

        this.intersectionObserver.observe(
          element
        );

      } else if (
        material.respondsToLight
      ) {

        this.activeMaterials.add(
          material
        );

      }


      if (
        this.resizeObserver
      ) {

        this.resizeObserver.observe(
          element
        );

      }


      /* ====================================================
         GENERATED MATERIAL EFFECTS
      ==================================================== */

      if (
        type ===
        'metal' &&
        respondsToLight
      ) {

        this.prepareMetal(
          material
        );

      }


      if (
        type ===
        'photo' &&
        respondsToLight
      ) {

        this.preparePhoto(
          material
        );

      }


      /* ====================================================
         GLASS POINTER RESPONSE
      ==================================================== */

      if (
        type ===
        'glass' &&
        respondsToLight &&
        !this.mobile
      ) {

        element.addEventListener(
          'pointerenter',
          () => {

            material.hovered =
              true;

          }
        );


        element.addEventListener(
          'pointerleave',
          () => {

            material.hovered =
              false;

          }
        );

      }

    }


    /* ======================================================
       MATERIAL DEACTIVATION
    ====================================================== */

    deactivateMaterial(
      material
    ) {

      if (
        !material ||
        !material.respondsToLight
      ) {

        return;

      }


      material.hovered =
        false;


      material.strength =
        0;


      material.bevelStrength =
        0;


      this.setMaterialVar(
        material,
        '--ggg-light-shadow-opacity',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-proximity',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-glass',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-left',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-right',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-top',
        '0'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-bottom',
        '0'
      );


      if (
        material.bloom
      ) {

        this.setVar(
          material.bloom,
          material.bloomVars,
          '--ggg-metal-opacity',
          '0'
        );

      }


      if (
        material.bevel
      ) {

        this.setVar(
          material.bevel,
          material.bevelVars,
          '--ggg-metal-bevel-opacity',
          '0'
        );

      }


      if (
        material.sheen
      ) {

        this.setVar(
          material.sheen,
          material.sheenVars,
          '--ggg-photo-opacity',
          '0'
        );

      }

    }


    /* ======================================================
       HIDDEN LIGHT REVEALS
    ====================================================== */

    prepareLightReveals() {

      document
        .querySelectorAll(
          '.ggg-light-reveal--characters'
        )
        .forEach(
          element => {

            const text =
              element.textContent
                .trim();


            if (
              !text
            ) {

              return;

            }


            element.setAttribute(
              'aria-label',
              text
            );


            element.textContent =
              '';


            const characters =
              [];


            Array.from(
              text
            ).forEach(
              character => {

                if (
                  character === ' '
                ) {

                  const space =
                    document.createElement(
                      'span'
                    );


                  space.className =
                    'ggg-light-reveal__space';


                  space.setAttribute(
                    'aria-hidden',
                    'true'
                  );


                  space.textContent =
                    ' ';


                  element.appendChild(
                    space
                  );


                  return;

                }


                const span =
                  document.createElement(
                    'span'
                  );


                span.className =
                  'ggg-light-reveal__char';


                span.setAttribute(
                  'aria-hidden',
                  'true'
                );


                span.textContent =
                  character;


                element.appendChild(
                  span
                );


                characters.push({

                  element:
                    span,

                  revealDelay:
                    Math.random() *
                    CONFIG.revealDuration,

                  hideDelay:
                    Math.random() *
                    CONFIG.revealHideDuration,

                  visible:
                    false

                });

              }
            );


            const material =
              this.materialMap.get(
                element
              ) ||
              null;


            this.lightReveals.push({

              element,

              material,

              characters,

              state:
                'waiting',

              armed:
                true,

              phaseStart:
                0

            });

          }
        );

    }


    /* ======================================================
       LIGHT REVEAL STATE
    ====================================================== */

    updateLightReveals(
      timestamp
    ) {

      if (
        !this.lightReveals.length
      ) {

        return;

      }


      this.lightReveals.forEach(
        reveal => {

          const material =
            reveal.material;


          if (
            !material ||
            !material.visible
          ) {

            return;

          }


          const rect =
            this.getMaterialRect(
              material
            );


          if (
            !rect.width ||
            !rect.height
          ) {

            return;

          }


          const centerX =
            rect.left +
            rect.width /
            2;


          const centerY =
            rect.top +
            rect.height /
            2;


          const dx =
            centerX -
            this.lightX;


          const dy =
            centerY -
            this.lightY;


          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );


          let proximity =
            this.clamp(
              1 -
              distance /
              CONFIG.revealRadius,
              0,
              1
            );


          proximity *=
            this.frameExposure *
            this.frameActive *
            this.batteryStrength;


          const lightIsOn =
            proximity >=
            CONFIG.revealTriggerProximity;


          const lightIsAway =
            proximity <=
            CONFIG.revealResetProximity;


          if (
            reveal.state ===
            'timed-out'
          ) {

            if (
              lightIsAway
            ) {

              reveal.state =
                'waiting';


              reveal.armed =
                true;


              reveal.phaseStart =
                0;

            }


            return;

          }


          if (
            lightIsOn &&
            reveal.armed
          ) {

            if (
              reveal.state !==
              'revealing' &&
              reveal.state !==
              'holding'
            ) {

              reveal.state =
                'revealing';


              reveal.phaseStart =
                timestamp;


              reveal.characters.forEach(
                character => {

                  if (
                    !character.visible
                  ) {

                    character.revealDelay =
                      this.reducedMotion
                        ? 0
                        : Math.random() *
                          CONFIG.revealDuration;

                  }

                }
              );

            }

          }


          if (
            lightIsAway &&
            (
              reveal.state ===
              'revealing' ||
              reveal.state ===
              'holding'
            )
          ) {

            reveal.state =
              'hiding';


            reveal.phaseStart =
              timestamp;


            reveal.characters.forEach(
              character => {

                if (
                  character.visible
                ) {

                  character.hideDelay =
                    this.reducedMotion
                      ? 0
                      : Math.random() *
                        CONFIG.revealHideDuration;

                }

              }
            );

          }


          if (
            reveal.state ===
            'waiting'
          ) {

            return;

          }


          if (
            reveal.state ===
            'revealing'
          ) {

            const elapsed =
              timestamp -
              reveal.phaseStart;


            reveal.characters.forEach(
              character => {

                if (
                  !character.visible &&
                  elapsed >=
                  character.revealDelay
                ) {

                  character.visible =
                    true;


                  character.element
                    .classList.add(
                      'is-visible'
                    );

                }

              }
            );


            const allVisible =
              reveal.characters.every(
                character =>
                  character.visible
              );


            if (
              allVisible
            ) {

              reveal.state =
                'holding';


              reveal.phaseStart =
                timestamp;

            }


            return;

          }


          if (
            reveal.state ===
            'holding'
          ) {

            if (
              timestamp -
              reveal.phaseStart >=
              CONFIG.revealHoldDuration
            ) {

              reveal.state =
                'hiding';


              reveal.armed =
                false;


              reveal.phaseStart =
                timestamp;


              reveal.characters.forEach(
                character => {

                  if (
                    character.visible
                  ) {

                    character.hideDelay =
                      this.reducedMotion
                        ? 0
                        : Math.random() *
                          CONFIG.revealHideDuration;

                  }

                }
              );

            }


            return;

          }


          if (
            reveal.state ===
            'hiding'
          ) {

            if (
              lightIsOn &&
              reveal.armed
            ) {

              reveal.state =
                'revealing';


              reveal.phaseStart =
                timestamp;


              reveal.characters.forEach(
                character => {

                  if (
                    !character.visible
                  ) {

                    character.revealDelay =
                      this.reducedMotion
                        ? 0
                        : Math.random() *
                          CONFIG.revealDuration;

                  }

                }
              );


              return;

            }


            const elapsed =
              timestamp -
              reveal.phaseStart;


            reveal.characters.forEach(
              character => {

                if (
                  character.visible &&
                  elapsed >=
                  character.hideDelay
                ) {

                  character.visible =
                    false;


                  character.element
                    .classList.remove(
                      'is-visible'
                    );

                }

              }
            );


            const allHidden =
              reveal.characters.every(
                character =>
                  !character.visible
              );


            if (
              allHidden
            ) {

              reveal.phaseStart =
                0;


              if (
                reveal.armed
              ) {

                reveal.state =
                  'waiting';

              } else {

                reveal.state =
                  'timed-out';

              }

            }

          }

        }
      );

    }


    /* ======================================================
       METAL PREPARATION
    ====================================================== */

    prepareMetal(
      material
    ) {

      material.bloom =
        document.createElement(
          'div'
        );


      material.bloom.className =
        'ggg-metal-bloom';


      document.body.appendChild(
        material.bloom
      );


      material.bevel =
        document.createElement(
          'div'
        );


      material.bevel.className =
        'ggg-metal-bevel';


      document.body.appendChild(
        material.bevel
      );


      const applyMask = () => {

        const element =
          material.element;


        const image =
          element.matches(
            'img'
          )
            ? element
            : element.querySelector(
                'img'
              );


        if (
          !image
        ) {

          return;

        }


        const url =
          image.currentSrc ||
          image.src;


        if (
          !url
        ) {

          return;

        }


        const mask =
          'url("' +
          url +
          '")';


        this.setVar(
          material.bloom,
          material.bloomVars,
          '--ggg-metal-mask',
          mask
        );


        this.setVar(
          material.bevel,
          material.bevelVars,
          '--ggg-metal-mask',
          mask
        );

      };


      applyMask();


      const image =
        material.element.matches(
          'img'
        )
          ? material.element
          : material.element.querySelector(
              'img'
            );


      if (
        image &&
        !image.complete
      ) {

        image.addEventListener(
          'load',
          () => {

            applyMask();


            material.geometryDirty =
              true;


            this.footerGeometryDirty =
              true;

          },

          {
            once:
              true
          }
        );

      }

    }


    /* ======================================================
       PHOTO PREPARATION

       Archive Home never reaches this method because photos
       are non-responsive under the archive-index profile.
    ====================================================== */

    preparePhoto(
      material
    ) {

      material.sheen =
        document.createElement(
          'div'
        );


      material.sheen.className =
        'ggg-photo-sheen';


      document.body.appendChild(
        material.sheen
      );

    }


    /* ======================================================
       EVENTS
    ====================================================== */

    bindEvents() {

      window.addEventListener(
        'ggg:lighting-toggle',

        () => {

          this.toggleEnabled();

        }
      );


      if (
        !this.mobile
      ) {

        window.addEventListener(
          'pointermove',

          event => {

            if (
              event.pointerType ===
              'touch'
            ) {

              return;

            }


            this.targetX =
              event.clientX;


            this.targetY =
              event.clientY;


            if (
              this.enabled
            ) {

              this.light.classList.add(
                'is-active'
              );


              this.requestFrame();

            }

          },

          {
            passive:
              true
          }
        );


        document.documentElement.addEventListener(
          'mouseleave',

          () => {

            this.light.classList.remove(
              'is-active'
            );


            this.materials.forEach(
              material => {

                material.hovered =
                  false;

              }
            );


            this.setBatteryStrength(
              1
            );

          }
        );

      }


      window.addEventListener(
        'scroll',

        () => {

          const currentX =
            window.scrollX;


          const currentY =
            window.scrollY;


          if (
            this.mobile
          ) {

            const delta =
              currentY -
              this.lastScrollY;


            this.lastScrollY =
              currentY;


            this.scrollVelocity +=
              (
                delta -
                this.scrollVelocity
              ) *
              .18;

          }


          this.scrollX =
            currentX;


          this.scrollY =
            currentY;


          this.resetMaterialFrameCache();


          this.requestFrame();

        },

        {
          passive:
            true
        }
      );


      window.addEventListener(
        'resize',

        () => {

          this.viewportWidth =
            window.innerWidth;


          this.viewportHeight =
            window.innerHeight;


          this.scrollX =
            window.scrollX;


          this.scrollY =
            window.scrollY;


          this.lastScrollY =
            this.scrollY;


          if (
            this.mobile
          ) {

            this.targetX =
              this.viewportWidth *
              .5;

          }


          this.invalidateGeometry();


          this.requestFrame();

        },

        {
          passive:
            true
        }
      );


      window.addEventListener(
        'load',

        () => {

          this.invalidateGeometry();

          this.requestFrame();

        },

        {
          once:
            true,

          passive:
            true
        }
      );


      if (
        document.fonts &&
        document.fonts.ready
      ) {

        document.fonts.ready.then(
          () => {

            if (
              !this.running
            ) {

              return;

            }


            this.invalidateGeometry();

            this.requestFrame();

          }
        );

      }


      document.addEventListener(
        'visibilitychange',

        () => {

          if (
            document.hidden
          ) {

            this.cancelFrame();

            return;

          }


          this.viewportWidth =
            window.innerWidth;


          this.viewportHeight =
            window.innerHeight;


          this.scrollX =
            window.scrollX;


          this.scrollY =
            window.scrollY;


          this.lastScrollY =
            this.scrollY;


          this.previousX =
            this.targetX;


          this.previousY =
            this.targetY;


          this.velocityX =
            0;


          this.velocityY =
            0;


          this.invalidateGeometry();


          this.requestFrame();

        }
      );

    }


    /* ======================================================
       UTILITIES
    ====================================================== */

    clamp(
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


    random(
      min,
      max
    ) {

      return (
        min +
        Math.random() *
        (
          max -
          min
        )
      );

    }


    centerWeightedOffset(
      velocity
    ) {

      const normalized =
        this.clamp(
          -velocity *
          .018,
          -1,
          1
        );


      return (
        Math.sign(
          normalized
        ) *
        Math.pow(
          Math.abs(
            normalized
          ),
          1.8
        ) *
        CONFIG.maxOpticalOffset
      );

    }


    /* ======================================================
       CONE PROJECTION
    ====================================================== */

    getConeProjection() {

      if (
        this.mobile
      ) {

        return {

          x:
            0,

          y:
            14,

          midX:
            0,

          midY:
            7

        };

      }


      const centerX =
        this.viewportWidth /
        2;


      const centerY =
        this.viewportHeight /
        2;


      const normalizedX =
        this.clamp(
          (
            this.lightX -
            centerX
          ) /
          centerX,
          -1,
          1
        );


      const normalizedY =
        this.clamp(
          (
            this.lightY -
            centerY
          ) /
          centerY,
          -1,
          1
        );


      const x =
        normalizedX *
        CONFIG.maxConeX;


      const y =
        normalizedY *
        CONFIG.maxConeY;


      return {

        x,

        y,

        midX:
          x *
          .48,

        midY:
          y *
          .48

      };

    }


    /* ======================================================
       MOBILE ENTRANCE PROGRESS
    ====================================================== */

    getHeaderProgress() {

      const scrollY =
        Math.max(
          this.scrollY,
          0
        );


      return this.clamp(
        scrollY /
        CONFIG.headerTravelDistance,
        0,
        1
      );

    }


    /* ======================================================
       FOOTER GEOMETRY
    ====================================================== */

    measureFooter() {

      if (
        !this.footer
      ) {

        this.footerGeometryDirty =
          false;

        return;

      }


      const rect =
        this.footer
          .getBoundingClientRect();


      this.footerDocTop =
        rect.top +
        this.scrollY;


      this.footerGeometryDirty =
        false;

    }


    /* ======================================================
       FOOTER EXPOSURE HANDOFF
    ====================================================== */

    getFooterReveal() {

      if (
        !this.footer
      ) {

        return 0;

      }


      if (
        this.footerGeometryDirty
      ) {

        this.measureFooter();

      }


      const footerTop =
        this.footerDocTop -
        this.scrollY;


      const viewport =
        this.viewportHeight;


      const start =
        viewport *
        CONFIG.footerRevealStart;


      const finish =
        viewport *
        CONFIG.footerRevealEnd;


      return this.clamp(
        (
          start -
          footerTop
        ) /
        (
          start -
          finish
        ),
        0,
        1
      );

    }


    /* ======================================================
       MATERIAL UPDATE GATE
    ====================================================== */

    shouldUpdateMaterials() {

      if (
        !this.activeMaterials.size
      ) {

        return false;

      }


      const positionChanged =
        !Number.isFinite(
          this.lastMaterialLightX
        ) ||
        Math.abs(
          this.lightX -
          this.lastMaterialLightX
        ) >= .35 ||
        Math.abs(
          this.lightY -
          this.lastMaterialLightY
        ) >= .35;


      const exposureChanged =
        !Number.isFinite(
          this.lastMaterialExposure
        ) ||
        Math.abs(
          this.frameExposure -
          this.lastMaterialExposure
        ) >= .002;


      const batteryChanged =
        this.batteryStrength !==
        this.lastMaterialBattery;


      const activeChanged =
        this.frameActive !==
        this.lastMaterialActive;


      if (
        !positionChanged &&
        !exposureChanged &&
        !batteryChanged &&
        !activeChanged
      ) {

        return false;

      }


      this.lastMaterialLightX =
        this.lightX;


      this.lastMaterialLightY =
        this.lightY;


      this.lastMaterialExposure =
        this.frameExposure;


      this.lastMaterialBattery =
        this.batteryStrength;


      this.lastMaterialActive =
        this.frameActive;


      return true;

    }


    /* ======================================================
       MATERIAL BASE RESPONSE
    ====================================================== */

    updateMaterialBase(
      material
    ) {

      if (
        !material.respondsToLight
      ) {

        return;

      }


      const rect =
        this.getMaterialRect(
          material
        );


      if (
        !rect.width ||
        !rect.height
      ) {

        return;

      }


      const centerX =
        rect.left +
        rect.width /
        2;


      const centerY =
        rect.top +
        rect.height /
        2;


      const dx =
        centerX -
        this.lightX;


      const dy =
        centerY -
        this.lightY;


      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );


      const maxOffset =
        20 *
        material.profile.depth;


      const softenedDistance =
        Math.sqrt(
          distance *
          distance +
          CONFIG.materialDirectionSoftness *
          CONFIG.materialDirectionSoftness
        );


      const shadowX =
        dx /
        softenedDistance *
        maxOffset;


      const shadowY =
        dy /
        softenedDistance *
        maxOffset;


      const directionX =
        dx /
        softenedDistance;


      const directionY =
        dy /
        softenedDistance;


      const lightFromLeft =
        Math.max(
          directionX,
          0
        );


      const lightFromRight =
        Math.max(
          -directionX,
          0
        );


      const lightFromTop =
        Math.max(
          directionY,
          0
        );


      const lightFromBottom =
        Math.max(
          -directionY,
          0
        );


      const blur =
        this.clamp(
          4 +
          distance *
          .016,
          4,
          18
        ) *
        material.profile.blurScale *
        Math.max(
          material.profile.depth,
          .18
        );


      const proximity =
        this.clamp(
          1 -
          distance /
          800,
          0,
          1
        );


      const active =
        this.frameActive;


      const exposure =
        this.frameExposure;


      const opacity =
        this.clamp(

          proximity *
          this.batteryStrength *
          material.profile.maxOpacity *
          active *
          exposure,

          0,

          material.profile.maxOpacity

        );


      const localX =
        this.clamp(
          (
            this.lightX -
            rect.left
          ) /
          rect.width,
          0,
          1
        );


      const localY =
        this.clamp(
          (
            this.lightY -
            rect.top
          ) /
          rect.height,
          0,
          1
        );


      this.setMaterialVar(
        material,
        '--ggg-light-shadow-x',
        shadowX.toFixed(2) +
        'px'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-shadow-y',
        shadowY.toFixed(2) +
        'px'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-shadow-blur',
        blur.toFixed(2) +
        'px'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-shadow-opacity',
        opacity.toFixed(3)
      );


      this.setMaterialVar(
        material,
        '--ggg-light-proximity',
        (
          proximity *
          exposure
        ).toFixed(3)
      );


      this.setMaterialVar(
        material,
        '--ggg-light-local-x',
        (
          localX *
          100
        ).toFixed(2) +
        '%'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-local-y',
        (
          localY *
          100
        ).toFixed(2) +
        '%'
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-left',
        (
          lightFromLeft *
          proximity *
          exposure *
          active
        ).toFixed(3)
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-right',
        (
          lightFromRight *
          proximity *
          exposure *
          active
        ).toFixed(3)
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-top',
        (
          lightFromTop *
          proximity *
          exposure *
          active
        ).toFixed(3)
      );


      this.setMaterialVar(
        material,
        '--ggg-light-from-bottom',
        (
          lightFromBottom *
          proximity *
          exposure *
          active
        ).toFixed(3)
      );


      if (
        material.type ===
        'metal'
      ) {

        this.updateMetal(
          material,
          rect,
          distance
        );

      }


      if (
        material.type ===
        'photo'
      ) {

        this.updatePhoto(
          material,
          rect,
          distance
        );

      }


      if (
        material.type ===
        'glass'
      ) {

        this.updateGlass(
          material,
          distance
        );

      }

    }


    /* ======================================================
       METAL RESPONSE
    ====================================================== */

    updateMetal(
      material,
      rect,
      distance
    ) {

      if (
        !material.bloom ||
        !material.bevel
      ) {

        return;

      }


      const centerX =
        rect.left +
        rect.width /
        2;


      const centerY =
        rect.top +
        rect.height /
        2;


      const dx =
        this.lightX -
        centerX;


      const dy =
        this.lightY -
        centerY;


      const safeDistance =
        Math.max(
          distance,
          1
        );


      const directionX =
        dx /
        safeDistance;


      const directionY =
        dy /
        safeDistance;


      const exposure =
        this.frameExposure;


      const active =
        this.frameActive;


      let target =
        this.clamp(
          1 -
          distance /
          420,
          0,
          1
        );


      target =
        Math.pow(
          target,
          1.35
        ) *
        this.batteryStrength *
        .72 *
        exposure *
        active;


      material.strength +=
        (
          target -
          material.strength
        ) *
        .16;


      const localX =
        this.clamp(
          (
            this.lightX -
            rect.left
          ) /
          rect.width,
          0,
          1
        );


      const localY =
        this.clamp(
          (
            this.lightY -
            rect.top
          ) /
          rect.height,
          0,
          1
        );


      const leftValue =
        rect.left.toFixed(2) +
        'px';


      const topValue =
        rect.top.toFixed(2) +
        'px';


      const widthValue =
        rect.width.toFixed(2) +
        'px';


      const heightValue =
        rect.height.toFixed(2) +
        'px';


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-left',
        leftValue
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-top',
        topValue
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-width',
        widthValue
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-height',
        heightValue
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-left',
        leftValue
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-top',
        topValue
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-width',
        widthValue
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-height',
        heightValue
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-x',
        (
          20 +
          localX *
          60
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-y',
        (
          20 +
          localY *
          60
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.bloom,
        material.bloomVars,
        '--ggg-metal-opacity',
        material.strength.toFixed(
          3
        )
      );


      let bevelTarget =
        this.clamp(
          1 -
          distance /
          420,
          0,
          1
        );


      bevelTarget =
        Math.pow(
          bevelTarget,
          1.15
        ) *
        this.batteryStrength *
        .52 *
        exposure *
        active;


      const radius =
        Math.max(
          Math.min(
            rect.width,
            rect.height
          ) *
          .5,
          1
        );


      bevelTarget *=
        this.clamp(
          distance /
          radius,
          .18,
          1
        );


      material.bevelStrength +=
        (
          bevelTarget -
          material.bevelStrength
        ) *
        .18;


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-bevel-x',
        (
          50 -
          directionX *
          78
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-bevel-y',
        (
          50 -
          directionY *
          78
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.bevel,
        material.bevelVars,
        '--ggg-metal-bevel-opacity',
        material.bevelStrength.toFixed(
          3
        )
      );

    }


    /* ======================================================
       PHOTO RESPONSE
    ====================================================== */

    updatePhoto(
      material,
      rect,
      distance
    ) {

      if (
        !material.sheen
      ) {

        return;

      }


      const exposure =
        this.frameExposure;


      const active =
        this.frameActive;


      let target =
        this.clamp(
          1 -
          distance /
          320,
          0,
          1
        );


      target =
        Math.pow(
          target,
          1.65
        ) *
        this.batteryStrength *
        .50 *
        exposure *
        active;


      material.strength +=
        (
          target -
          material.strength
        ) *
        .17;


      const localX =
        this.clamp(
          (
            this.lightX -
            rect.left
          ) /
          rect.width,
          0,
          1
        );


      const localY =
        this.clamp(
          (
            this.lightY -
            rect.top
          ) /
          rect.height,
          0,
          1
        );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-left',
        rect.left.toFixed(2) +
        'px'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-top',
        rect.top.toFixed(2) +
        'px'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-width',
        rect.width.toFixed(2) +
        'px'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-height',
        rect.height.toFixed(2) +
        'px'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-x',
        (
          localX *
          100
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-y',
        (
          localY *
          100
        ).toFixed(2) +
        '%'
      );


      this.setVar(
        material.sheen,
        material.sheenVars,
        '--ggg-photo-opacity',
        material.strength.toFixed(
          3
        )
      );

    }


    /* ======================================================
       GLASS RESPONSE
    ====================================================== */

    updateGlass(
      material,
      distance
    ) {

      const exposure =
        this.frameExposure;


      const proximity =
        Math.pow(

          this.clamp(
            1 -
            distance /
            340,
            0,
            1
          ),

          1.18

        );


      let target =
        0;


      if (
        this.mobile
      ) {

        target =
          proximity *
          this.batteryStrength *
          .72 *
          exposure;

      } else if (
        material.hovered &&
        this.frameActive
      ) {

        target =
          proximity *
          this.batteryStrength *
          exposure;

      }


      const response =
        target >
        material.strength
          ? .34
          : .13;


      material.strength +=
        (
          target -
          material.strength
        ) *
        response;


      this.setMaterialVar(
        material,
        '--ggg-light-glass',
        material.strength.toFixed(
          3
        )
      );

    }


    /* ======================================================
       DUST CREATION
    ====================================================== */

    createDust() {

      if (
        this.reducedMotion
      ) {

        return;

      }


      const count =
        this.mobile
          ? CONFIG.mobileDustCount
          : CONFIG.desktopDustCount;


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const element =
          document.createElement(
            'span'
          );


        element.className =
          'ggg-light__particle';


        const depth =
          this.random(
            .35,
            1.55
          );


        const size =
          this.random(
            .65,
            1.95
          ) *
          depth;


        element.style.setProperty(
          '--ggg-particle-size',
          size.toFixed(2) +
          'px'
        );


        element.style.setProperty(
          '--ggg-particle-glow',
          (
            size *
            this.random(
              2.8,
              5.6
            ) *
            depth
          ).toFixed(2) +
          'px'
        );


        this.dustLayer.appendChild(
          element
        );


        this.dust.push({

          element,


          x:
            Math.random() *
            this.viewportWidth,


          y:
            Math.random() *
            this.viewportHeight,


          depth,


          driftX:
            this.random(
              -.055,
              .055
            ) *
            depth,


          driftY:
            this.random(
              -.075,
              -.018
            ) *
            depth,


          phase:
            Math.random() *
            Math.PI *
            2,


          shimmer:
            this.random(
              .0007,
              .0018
            ),


          brightness:
            this.random(
              .16,
              .78
            ),


          transform:
            '',


          opacity:
            ''

        });

      }

    }


    /* ======================================================
       DUST UPDATE
    ====================================================== */

    updateDust(
      cone,
      beamWidth,
      beamHeight,
      timestamp
    ) {

      if (
        !this.dust.length
      ) {

        return;

      }


      const beamX =
        this.lightX +
        cone.x;


      const beamY =
        this.lightY +
        cone.y;


      const radiusX =
        beamWidth *
        .52;


      const radiusY =
        beamHeight *
        .52;


      const exposure =
        this.frameExposure;


      const active =
        this.frameActive;


      this.dust.forEach(
        particle => {

          particle.x +=
            particle.driftX;


          particle.y +=
            particle.driftY;


          if (
            particle.x <
            -20
          ) {

            particle.x =
              this.viewportWidth +
              20;

          }


          if (
            particle.x >
            this.viewportWidth +
            20
          ) {

            particle.x =
              -20;

          }


          if (
            particle.y <
            -20
          ) {

            particle.y =
              this.viewportHeight +
              20;

          }


          if (
            particle.y >
            this.viewportHeight +
            20
          ) {

            particle.y =
              -20;

          }


          const renderX =
            particle.x +
            cone.x *
            (
              particle.depth -
              .75
            ) *
            .11;


          const renderY =
            particle.y +
            cone.y *
            (
              particle.depth -
              .75
            ) *
            .11;


          const nx =
            (
              renderX -
              beamX
            ) /
            radiusX;


          const ny =
            (
              renderY -
              beamY
            ) /
            radiusY;


          const beamDistance =
            Math.sqrt(
              nx * nx +
              ny * ny
            );


          const intensity =
            this.clamp(
              1 -
              beamDistance,
              0,
              1
            );


          const shimmer =
            .78 +
            Math.sin(
              timestamp *
              particle.shimmer +
              particle.phase
            ) *
            .22;


          let opacity =

            Math.pow(
              intensity,
              1.7
            ) *

            particle.brightness *

            Math.pow(
              particle.depth,
              1.25
            ) *

            shimmer *

            this.batteryStrength *

            exposure *

            active;


          if (
            this.mobile
          ) {

            opacity *=
              .52;

          }


          opacity =
            this.clamp(
              opacity,
              0,
              .82
            );


          const transform =
            'translate3d(' +
            renderX.toFixed(2) +
            'px,' +
            renderY.toFixed(2) +
            'px,0)';


          if (
            particle.transform !==
            transform
          ) {

            particle.transform =
              transform;


            particle.element.style.transform =
              transform;

          }


          const opacityValue =
            opacity.toFixed(
              3
            );


          if (
            particle.opacity !==
            opacityValue
          ) {

            particle.opacity =
              opacityValue;


            particle.element.style.opacity =
              opacityValue;

          }

        }
      );

    }


    /* ======================================================
       MOBILE LIGHT
    ====================================================== */

    updateMobileLight(
      headerProgress
    ) {

      const startY =
        this.viewportHeight *
        CONFIG.headerLightStartY;


      const restY =
        this.viewportHeight *
        CONFIG.mobileBaseY;


      const entranceY =
        startY +
        (
          restY -
          startY
        ) *
        headerProgress;


      const targetOffset =
        this.clamp(
          -this.scrollVelocity *
          .65,
          -CONFIG.mobileMaxLag,
          CONFIG.mobileMaxLag
        );


      const lagInfluence =
        headerProgress;


      this.mobileOffsetY +=
        (
          targetOffset -
          this.mobileOffsetY
        ) *
        .18;


      this.scrollVelocity +=
        (
          0 -
          this.scrollVelocity
        ) *
        .11;


      this.targetX =
        this.viewportWidth *
        .5;


      this.targetY =
        entranceY +
        this.mobileOffsetY *
        lagInfluence;


      this.lightX =
        this.targetX;


      const follow =
        .42 -
        headerProgress *
        .20;


      this.lightY +=
        (
          this.targetY -
          this.lightY
        ) *
        follow;

    }


    /* ======================================================
       BATTERY
    ====================================================== */

    setBatteryStrength(
      strength
    ) {

      if (
        !this.enabled &&
        strength !== 1
      ) {

        return;

      }


      this.batteryStrength =
        strength;


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-battery-strength',
        String(
          strength
        )
      );


      this.requestFrame();

    }


    wait(
      ms
    ) {

      return new Promise(
        resolve => {

          setTimeout(
            resolve,
            ms
          );

        }
      );

    }


    async batteryEvent() {

      if (
        !this.enabled
      ) {

        return;

      }


      if (
        !this.mobile &&
        !this.light.classList.contains(
          'is-active'
        )
      ) {

        this.setBatteryStrength(
          1
        );


        this.scheduleBatteryEvent();


        return;

      }


      const roll =
        Math.random();


      if (
        roll <
        .58
      ) {

        this.setBatteryStrength(
          .68
        );


        await this.wait(
          55
        );


        this.setBatteryStrength(
          1
        );


      } else if (
        roll <
        .84
      ) {

        this.setBatteryStrength(
          .48
        );


        await this.wait(
          48
        );


        this.setBatteryStrength(
          .92
        );


        await this.wait(
          60
        );


        this.setBatteryStrength(
          .38
        );


        await this.wait(
          70
        );


        this.setBatteryStrength(
          1
        );


      } else if (
        roll <
        .96
      ) {

        this.setBatteryStrength(
          .32
        );


        await this.wait(
          100
        );


        this.setBatteryStrength(
          .58
        );


        await this.wait(
          75
        );


        this.setBatteryStrength(
          .24
        );


        await this.wait(
          115
        );


        this.setBatteryStrength(
          .78
        );


        await this.wait(
          80
        );


        this.setBatteryStrength(
          1
        );


      } else {

        this.setBatteryStrength(
          .18
        );


        await this.wait(
          180
        );


        this.setBatteryStrength(
          .04
        );


        await this.wait(
          120
        );


        this.setBatteryStrength(
          .32
        );


        await this.wait(
          110
        );


        this.setBatteryStrength(
          .82
        );


        await this.wait(
          85
        );


        this.setBatteryStrength(
          1
        );

      }


      this.scheduleBatteryEvent();

    }


    scheduleBatteryEvent() {

      clearTimeout(
        this.batteryTimer
      );


      if (
        !this.enabled
      ) {

        this.batteryTimer =
          null;

        return;

      }


      this.batteryTimer =
        setTimeout(

          () => {

            this.batteryEvent();

          },

          2500 +
          Math.random() *
          5500

        );

    }


    /* ======================================================
       ANIMATION LOOP
    ====================================================== */

    animate(
      timestamp
    ) {

      this.rafId =
        null;


      if (
        !this.running ||
        !this.enabled ||
        document.hidden
      ) {

        return;

      }


      let opticalX =
        0;


      let opticalY =
        0;


      let stretch =
        0;


      /* ====================================================
         MOBILE ENTRANCE STATE
      ==================================================== */

      this.headerProgress =
        this.getHeaderProgress();


      /* ====================================================
         LIGHT POSITION
      ==================================================== */

      if (
        this.mobile
      ) {

        this.updateMobileLight(
          this.headerProgress
        );

      } else {

        const rawVX =
          this.targetX -
          this.previousX;


        const rawVY =
          this.targetY -
          this.previousY;


        this.velocityX +=
          (
            rawVX -
            this.velocityX
          ) *
          CONFIG.velocitySmoothing;


        this.velocityY +=
          (
            rawVY -
            this.velocityY
          ) *
          CONFIG.velocitySmoothing;


        this.previousX =
          this.targetX;


        this.previousY =
          this.targetY;


        this.lightX +=
          (
            this.targetX -
            this.lightX
          ) *
          CONFIG.followSpeed;


        this.lightY +=
          (
            this.targetY -
            this.lightY
          ) *
          CONFIG.followSpeed;


        opticalX =
          this.centerWeightedOffset(
            this.velocityX
          );


        opticalY =
          this.centerWeightedOffset(
            this.velocityY
          );


        const speed =
          Math.sqrt(
            this.velocityX *
            this.velocityX +
            this.velocityY *
            this.velocityY
          );


        stretch =
          this.clamp(
            speed *
            .40,
            0,
            CONFIG.maxStretch
          );

      }


      /* ====================================================
         CONE + BEAM SIZE
      ==================================================== */

      const cone =
        this.getConeProjection();


      const beamWidth =
        this.mobile
          ? 390
          : 500 +
            stretch;


      const beamHeight =
        this.mobile
          ? 360
          : 420 +
            stretch *
            .16;


      /* ====================================================
         FOOTER STATE
      ==================================================== */

      this.footerReveal =
        this.mobile
          ? this.getFooterReveal()
          : 0;


      /* ====================================================
         MASTER EXPOSURE
      ==================================================== */

      this.exposureReveal =
        this.footerReveal;


      /* ====================================================
         FRAME STATE
      ==================================================== */

      this.frameActive =
        this.light.classList.contains(
          'is-active'
        )
          ? 1
          : 0;


      this.frameExposure =
        1 -
        this.exposureReveal;


      this.updateDocumentState();


      /* ====================================================
         LIGHT CSS VARIABLES
      ==================================================== */

      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-light-x',
        this.lightX.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-light-y',
        this.lightY.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-optical-x',
        opticalX.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-optical-y',
        opticalY.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-cone-x',
        cone.x.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-cone-y',
        cone.y.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-mid-cone-x',
        cone.midX.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-mid-cone-y',
        cone.midY.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-beam-width',
        beamWidth.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-beam-height',
        beamHeight.toFixed(2) +
        'px'
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-footer-reveal',
        this.footerReveal.toFixed(
          4
        )
      );


      this.setVar(
        this.light,
        this.lightVars,
        '--ggg-exposure-reveal',
        this.exposureReveal.toFixed(
          4
        )
      );


      /* ====================================================
         RESPONSIVE MATERIALS ONLY

         On Archive Home this Set normally contains only
         visible metal materials.
      ==================================================== */

      if (
        this.shouldUpdateMaterials()
      ) {

        this.activeMaterials.forEach(
          material => {

            this.updateMaterialBase(
              material
            );

          }
        );

      }


      /* ====================================================
         HIDDEN LIGHT REVEALS
      ==================================================== */

      this.updateLightReveals(
        timestamp ||
        0
      );


      /* ====================================================
         DUST
      ==================================================== */

      this.updateDust(
        cone,
        beamWidth,
        beamHeight,
        timestamp ||
        0
      );


      /* ====================================================
         NEXT FRAME
      ==================================================== */

      this.requestFrame();

    }

  }


  /* ========================================================
     BOOT
  ======================================================== */

  function boot() {

    const engine =
      new GGGLightingEngine();


    window.GGG_LIGHTING_ENGINE =
      engine;


    engine.init();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once:
          true
      }
    );

  } else {

    boot();

  }

})();
