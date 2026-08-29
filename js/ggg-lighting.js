/* ==========================================================
   GGG LIGHTING SYSTEM
   v1.0.1

   Enable per page with:

   window.GGG_LIGHTING_PAGE = { enabled: true };

   Materials are discovered automatically through:

   data-ggg-material="metal|paper|photo|glass|print|ink"

   or canonical GGG material classes.
========================================================== */

(function () {
  'use strict';

  const PAGE = window.GGG_LIGHTING_PAGE;

  if (!PAGE || PAGE.enabled !== true) {
    return;
  }

  if (window.GGG_LIGHTING_ENGINE) {
    return;
  }


  /* ========================================================
     CONFIG
  ======================================================== */

  const CONFIG = {

    /* Desktop optics */

    followSpeed: .28,
    velocitySmoothing: .18,
    maxOpticalOffset: 8,
    maxStretch: 18,
    maxConeX: 145,
    maxConeY: 105,


    /* Dust */

    desktopDustCount: 42,
    mobileDustCount: 20,


    /* Mobile resting behavior */

    mobileBaseY: .43,
    mobileMaxLag: 12,


    /* ======================================================
       HEADER ENTRANCE

       At the very top:
       - flashlight is already partially present
       - mobile flashlight begins high in viewport

       During initial scroll:
       - ambient darkness increases
       - mobile flashlight descends

       After travel distance:
       - full examination mode
    ====================================================== */

    headerSelector:
      '.ggg-site-header, #header, header.Header',

    headerTopReveal: .68,

    headerLightStartY: .10,

    headerTravelDistance: 220,


    /* ======================================================
       FOOTER EXIT
    ====================================================== */

    footerSelector:
      '.ggg-site-footer',

    footerRevealStart: .95,
    footerRevealEnd: .62

  };


  /* ========================================================
     MATERIAL DEPTH PROFILES
  ======================================================== */

  const PROFILES = {

    metal: {
      depth: 1,
      maxOpacity: .62,
      blurScale: 1
    },

    glass: {
      depth: .48,
      maxOpacity: .46,
      blurScale: .90
    },

    paper: {
      depth: .28,
      maxOpacity: .36,
      blurScale: .85
    },

    photo: {
      depth: .34,
      maxOpacity: .40,
      blurScale: .88
    },

    print: {
      depth: .14,
      maxOpacity: .24,
      blurScale: .65
    },

    ink: {
      depth: .025,
      maxOpacity: .09,
      blurScale: .34
    }

  };


  const VALID_TYPES =
    new Set(
      Object.keys(PROFILES)
    );


  /* ========================================================
     AUTOMATIC MATERIAL DISCOVERY
  ======================================================== */

  const CLASS_RULES = [

    ['.ggg-material-metal', 'metal'],
    ['.ggg-material-paper', 'paper'],
    ['.ggg-material-photo', 'photo'],
    ['.ggg-material-glass', 'glass'],
    ['.ggg-material-print', 'print'],
    ['.ggg-material-ink', 'ink'],

    /* Existing reusable GGG components */

    ['.ggg-attachment', 'paper'],
    ['.ggg-evidence-photo img', 'photo']

  ];


  /* ========================================================
     ENGINE
  ======================================================== */

  class GGGLightingEngine {

    constructor() {

      this.mobile =
        window.matchMedia(
          '(hover: none), (pointer: coarse)'
        ).matches;


      this.reducedMotion =
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;


      this.targetX =
        window.innerWidth / 2;


      this.targetY =
        this.mobile
          ? window.innerHeight *
            CONFIG.headerLightStartY
          : window.innerHeight / 2;


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
        window.scrollY;


      this.scrollVelocity =
        0;


      this.mobileOffsetY =
        0;


      this.batteryStrength =
        1;


      this.headerProgress =
        0;


      this.headerReveal =
        0;


      this.footerReveal =
        0;


      this.exposureReveal =
        0;


      this.materials =
        [];


      this.materialElements =
        new WeakSet();


      this.dust =
        [];


      this.running =
        false;


      this.batteryTimer =
        null;


      this.header =
        document.querySelector(
          CONFIG.headerSelector
        );


      this.footer =
        document.querySelector(
          CONFIG.footerSelector
        );

    }


    /* ======================================================
       INITIALIZATION
    ====================================================== */

    init() {

      this.cleanupGenerated();

      this.createLight();

      this.discoverMaterials();

      this.createDust();

      this.bindEvents();

      this.scheduleBatteryEvent();

      this.running =
        true;


      requestAnimationFrame(
        this.animate.bind(this)
      );

    }


    cleanupGenerated() {

      document.querySelectorAll(
        '.ggg-light, .ggg-metal-bloom, .ggg-metal-bevel, .ggg-photo-sheen'
      ).forEach(
        element =>
          element.remove()
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


      this.materialElements.add(
        element
      );


      element.classList.add(
        'ggg-light-material'
      );


      element.setAttribute(
        'data-ggg-light-type',
        type
      );


      const material = {

        element,
        type,

        profile:
          PROFILES[type],

        visible:
          true,

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


      if (
        'IntersectionObserver'
        in window
      ) {

        if (
          !this.intersectionObserver
        ) {

          this.intersectionObserver =
            new IntersectionObserver(

              entries => {

                entries.forEach(
                  entry => {

                    const found =
                      this.materials.find(
                        item =>
                          item.element ===
                          entry.target
                      );


                    if (
                      found
                    ) {

                      found.visible =
                        entry.isIntersecting;

                    }

                  }
                );

              },

              {
                rootMargin:
                  '300px'
              }

            );

        }


        this.intersectionObserver.observe(
          element
        );

      }


      if (
        type ===
        'metal'
      ) {

        this.prepareMetal(
          material
        );

      }


      if (
        type ===
        'photo'
      ) {

        this.preparePhoto(
          material
        );

      }


      if (
        type ===
        'glass' &&
        !this.mobile
      ) {

        element.addEventListener(
          'pointerenter',
          () =>
            material.hovered = true
        );


        element.addEventListener(
          'pointerleave',
          () =>
            material.hovered = false
        );

      }


      this.materials.push(
        material
      );

    }


    /* ======================================================
       METAL PREPARATION
    ====================================================== */

    prepareMetal(
      material
    ) {

      const applyMask = () => {

        const element =
          material.element;


        const image =
          element.matches('img')
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


        material.bloom.style.setProperty(
          '--ggg-metal-mask',
          mask
        );


        material.bevel.style.setProperty(
          '--ggg-metal-mask',
          mask
        );

      };


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
          applyMask,
          {
            once: true
          }
        );

      }

    }


    /* ======================================================
       PHOTO PREPARATION
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


            this.light.classList.add(
              'is-active'
            );

          },

          {
            passive: true
          }

        );


        document.documentElement.addEventListener(
          'mouseleave',

          () => {

            this.light.classList.remove(
              'is-active'
            );


            this.materials.forEach(
              material =>
                material.hovered = false
            );


            this.setBatteryStrength(
              1
            );

          }

        );

      }


      if (
        this.mobile
      ) {

        window.addEventListener(
          'scroll',

          () => {

            const current =
              window.scrollY;


            const delta =
              current -
              this.lastScrollY;


            this.lastScrollY =
              current;


            this.scrollVelocity +=
              (
                delta -
                this.scrollVelocity
              ) *
              .18;

          },

          {
            passive: true
          }

        );

      }


      window.addEventListener(
        'resize',

        () => {

          if (
            this.mobile
          ) {

            this.targetX =
              window.innerWidth *
              .5;

          }

        },

        {
          passive: true
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
          x: 0,
          y: 14,
          midX: 0,
          midY: 7
        };

      }


      const centerX =
        window.innerWidth /
        2;


      const centerY =
        window.innerHeight /
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


      /*
        Preserve approved 21B direction exactly.
      */

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
          x * .48,

        midY:
          y * .48

      };

    }


    /* ======================================================
       HEADER ENTRANCE PROGRESS

       0 = absolute top of page
       1 = full examination mode
    ====================================================== */

    getHeaderProgress() {

      const scrollY =
        Math.max(
          window.scrollY,
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
       HEADER EXPOSURE

       At top:
         partially suppressed lighting

       As page enters:
         suppression fades away

       After entrance:
         full lighting environment
    ====================================================== */

    getHeaderReveal(
      progress
    ) {

      return (
        CONFIG.headerTopReveal *
        (
          1 -
          progress
        )
      );

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


      const rect =
        this.footer
          .getBoundingClientRect();


      const viewport =
        window.innerHeight;


      const start =
        viewport *
        CONFIG.footerRevealStart;


      const finish =
        viewport *
        CONFIG.footerRevealEnd;


      return this.clamp(
        (
          start -
          rect.top
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
       MATERIAL BASE RESPONSE
    ====================================================== */

    updateMaterialBase(
      material
    ) {

      if (
        !material.visible
      ) {

        return;

      }


      const rect =
        material.element
          .getBoundingClientRect();


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


      const offset =
        20 *
        material.profile.depth;


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
        this.light.classList.contains(
          'is-active'
        )
          ? 1
          : 0;


      const exposure =
        1 -
        this.exposureReveal;


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


      material.element.style.setProperty(
        '--ggg-light-shadow-x',
        (
          directionX *
          offset
        ).toFixed(2) +
        'px'
      );


      material.element.style.setProperty(
        '--ggg-light-shadow-y',
        (
          directionY *
          offset
        ).toFixed(2) +
        'px'
      );


      material.element.style.setProperty(
        '--ggg-light-shadow-blur',
        blur.toFixed(2) +
        'px'
      );


      material.element.style.setProperty(
        '--ggg-light-shadow-opacity',
        opacity.toFixed(3)
      );


      material.element.style.setProperty(
        '--ggg-light-proximity',
        (
          proximity *
          exposure
        ).toFixed(3)
      );


      material.element.style.setProperty(
        '--ggg-light-local-x',
        (
          localX *
          100
        ).toFixed(2) +
        '%'
      );


      material.element.style.setProperty(
        '--ggg-light-local-y',
        (
          localY *
          100
        ).toFixed(2) +
        '%'
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
          rect,
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
        1 -
        this.exposureReveal;


      const active =
        this.light.classList.contains(
          'is-active'
        )
          ? 1
          : 0;


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


      [
        material.bloom,
        material.bevel

      ].forEach(
        layer => {

          layer.style.setProperty(
            '--ggg-metal-left',
            rect.left +
            'px'
          );


          layer.style.setProperty(
            '--ggg-metal-top',
            rect.top +
            'px'
          );


          layer.style.setProperty(
            '--ggg-metal-width',
            rect.width +
            'px'
          );


          layer.style.setProperty(
            '--ggg-metal-height',
            rect.height +
            'px'
          );

        }
      );


      material.bloom.style.setProperty(
        '--ggg-metal-x',
        (
          20 +
          localX *
          60
        ) +
        '%'
      );


      material.bloom.style.setProperty(
        '--ggg-metal-y',
        (
          20 +
          localY *
          60
        ) +
        '%'
      );


      material.bloom.style.setProperty(
        '--ggg-metal-opacity',
        material.strength.toFixed(3)
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


      /*
        Approved directional rim position.
      */

      material.bevel.style.setProperty(
        '--ggg-metal-bevel-x',
        (
          50 -
          directionX *
          78
        ) +
        '%'
      );


      material.bevel.style.setProperty(
        '--ggg-metal-bevel-y',
        (
          50 -
          directionY *
          78
        ) +
        '%'
      );


      material.bevel.style.setProperty(
        '--ggg-metal-bevel-opacity',
        material.bevelStrength.toFixed(3)
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
        1 -
        this.exposureReveal;


      const active =
        this.light.classList.contains(
          'is-active'
        )
          ? 1
          : 0;


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


      material.sheen.style.setProperty(
        '--ggg-photo-left',
        rect.left +
        'px'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-top',
        rect.top +
        'px'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-width',
        rect.width +
        'px'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-height',
        rect.height +
        'px'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-x',
        (
          localX *
          100
        ) +
        '%'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-y',
        (
          localY *
          100
        ) +
        '%'
      );


      material.sheen.style.setProperty(
        '--ggg-photo-opacity',
        material.strength.toFixed(3)
      );

    }


    /* ======================================================
       GLASS RESPONSE
    ====================================================== */

    updateGlass(
      material,
      rect,
      distance
    ) {

      const exposure =
        1 -
        this.exposureReveal;


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
        this.light.classList.contains(
          'is-active'
        )
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


      material.element.style.setProperty(
        '--ggg-light-glass',
        material.strength.toFixed(3)
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
            window.innerWidth,

          y:
            Math.random() *
            window.innerHeight,

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
            )

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
        1 -
        this.exposureReveal;


      const active =
        this.light.classList.contains(
          'is-active'
        )
          ? 1
          : 0;


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
              window.innerWidth +
              20;

          }


          if (
            particle.x >
            window.innerWidth +
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
              window.innerHeight +
              20;

          }


          if (
            particle.y >
            window.innerHeight +
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


          particle.element.style.transform =
            'translate3d(' +
            renderX.toFixed(2) +
            'px,' +
            renderY.toFixed(2) +
            'px,0)';


          particle.element.style.opacity =
            opacity.toFixed(3);

        }
      );

    }


    /* ======================================================
       MOBILE LIGHT

       HEADER PHASE:
       light moves from 10vh → 43vh with scroll.

       EXAMINATION PHASE:
       light remains at 43vh with the approved subtle
       inertial scroll lag.
    ====================================================== */

    updateMobileLight(
      headerProgress
    ) {

      const startY =
        window.innerHeight *
        CONFIG.headerLightStartY;


      const restY =
        window.innerHeight *
        CONFIG.mobileBaseY;


      /*
        Entrance position is directly tied to page scroll.
      */

      const entranceY =
        startY +
        (
          restY -
          startY
        ) *
        headerProgress;


      /*
        Preserve the subtle M1 inertial lag, but gradually
        introduce it as the flashlight reaches its resting
        position so it does not fight the entrance movement.
      */

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
        window.innerWidth *
        .5;


      this.targetY =
        entranceY +
        this.mobileOffsetY *
        lagInfluence;


      this.lightX =
        this.targetX;


      /*
        During entrance, follow more closely so the beam feels
        attached to scrolling.

        Once settled, return to approved M1 inertia.
      */

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

      this.batteryStrength =
        strength;


      this.light.style.setProperty(
        '--ggg-battery-strength',
        strength
      );

    }


    wait(
      ms
    ) {

      return new Promise(
        resolve =>
          setTimeout(
            resolve,
            ms
          )
      );

    }


    async batteryEvent() {

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


      this.batteryTimer =
        setTimeout(

          () =>
            this.batteryEvent(),

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

      if (
        !this.running
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
         HEADER STATE
      ==================================================== */

      this.headerProgress =
        this.getHeaderProgress();


      this.headerReveal =
        this.getHeaderReveal(
          this.headerProgress
        );


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
        this.getFooterReveal();


      /* ====================================================
         MASTER EXPOSURE

         Whichever edge needs normal exposure most wins.
      ==================================================== */

      this.exposureReveal =
        Math.max(
          this.headerReveal,
          this.footerReveal
        );


      /* ====================================================
         CSS VARIABLES
      ==================================================== */

      this.light.style.setProperty(
        '--ggg-light-x',
        this.lightX +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-light-y',
        this.lightY +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-optical-x',
        opticalX +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-optical-y',
        opticalY +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-cone-x',
        cone.x +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-cone-y',
        cone.y +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-mid-cone-x',
        cone.midX +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-mid-cone-y',
        cone.midY +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-beam-width',
        beamWidth +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-beam-height',
        beamHeight +
        'px'
      );


      this.light.style.setProperty(
        '--ggg-header-reveal',
        this.headerReveal.toFixed(4)
      );


      this.light.style.setProperty(
        '--ggg-footer-reveal',
        this.footerReveal.toFixed(4)
      );


      this.light.style.setProperty(
        '--ggg-exposure-reveal',
        this.exposureReveal.toFixed(4)
      );


      /* ====================================================
         MATERIALS
      ==================================================== */

      this.materials.forEach(
        material =>
          this.updateMaterialBase(
            material
          )
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


      requestAnimationFrame(
        this.animate.bind(this)
      );

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
        once: true
      }
    );

  } else {

    boot();

  }

})();
