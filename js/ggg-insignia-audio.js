/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v2.7 — Physical Press + Audio Cue State

   PURPOSE
   Turns the Guild insignia into a discreet audio control.

   ASSET SYSTEM
   • canonical artwork supplied by data-ggg-pin-image
   • visible <img> receives the canonical image automatically
   • CSS receives the same image through --ggg-pin-image
   • signal, echo and noise mask therefore remain synchronized
   • artwork can be replaced in one location

   PHYSICAL PRESS
   • pointer contact applies .is-pressed
   • mouse, touch and pen use the same physical down state
   • release / cancellation removes the state immediately
   • CSS applies the physical depression to the pin wrapper
   • supernatural drift remains independent on the pin

   AUDIO CUE STATE
   • active playback applies:
       html.ggg-audio-is-playing
   • the dedicated "touch to listen" ghost note may use this
     as a suppression state
   • pause / end removes the global playback state
   • normal flashlight / character reveal behavior resumes

   DISTURBANCE SYSTEM
   • echo
   • fracture
   • dislocation
   • failure

   DISTURBANCE MEMORY
   • same profile cannot occur twice consecutively
   • silent opportunities do not erase memory

   PLAYBACK PROGRESSION
   • early playback favors echo / fracture
   • middle playback favors dislocation
   • late playback permits stronger failure events

   VISIBILITY
   • hidden tabs suspend visual behavior
   • audio continues normally
   • visual scheduling resumes cleanly when visible

   RESPONSIVE SCALING
   • spatial displacement follows rendered pin size
   • timing and opacity remain unchanged
========================================================== */

(function () {

  'use strict';


  /* ========================================================
     INIT
  ======================================================== */

  function initInsigniaAudioPlayers() {

    const players =
      document.querySelectorAll(
        '[data-ggg-audio-player]'
      );


    if (!players.length) {
      return;
    }


    players.forEach(
      function (player) {

        if (
          player.dataset.gggAudioReady ===
          'true'
        ) {
          return;
        }


        const button =
          player.querySelector(
            '.ggg-insignia-audio__button'
          );


        const audio =
          player.querySelector(
            '.ggg-insignia-audio__audio'
          );


        const progress =
          player.querySelector(
            '.ggg-insignia-audio__progress'
          );


        const pin =
          player.querySelector(
            '.ggg-insignia-audio__pin'
          );


        const signal =
          player.querySelector(
            '.ggg-insignia-audio__signal'
          );


        const echo =
          player.querySelector(
            '.ggg-insignia-audio__echo'
          );


        const noise =
          player.querySelector(
            '.ggg-insignia-audio__noise'
          );


        if (
          !button ||
          !audio ||
          !progress ||
          !pin ||
          !signal ||
          !echo ||
          !noise
        ) {

          console.warn(
            '[GGG] Insignia audio player is missing required markup.'
          );

          return;

        }


        /* ====================================================
           CANONICAL PIN ASSET
        ==================================================== */

        const pinImageSource =
          player.dataset.gggPinImage;


        if (!pinImageSource) {

          console.warn(
            '[GGG] Insignia audio player has no data-ggg-pin-image.'
          );

          return;

        }


        let resolvedPinImage;


        try {

          resolvedPinImage =
            new URL(
              pinImageSource,
              document.baseURI
            ).href;

        } catch (error) {

          console.warn(
            '[GGG] Invalid insignia artwork URL:',
            pinImageSource
          );

          return;

        }


        /*
          Visible physical pin.
        */

        pin.src =
          resolvedPinImage;


        /*
          Shared CSS artwork.

          This one variable powers:
          • signal slices
          • analog echo
          • analog noise mask
        */

        const escapedPinImage =
          resolvedPinImage
            .replace(
              /\\/g,
              '\\\\'
            )
            .replace(
              /"/g,
              '\\"'
            );


        player.style.setProperty(
          '--ggg-pin-image',
          'url("' +
          escapedPinImage +
          '")'
        );


        /* ====================================================
           CANVAS
        ==================================================== */

        const noiseContext =
          noise.getContext(
            '2d',
            {
              alpha:
                true
            }
          );


        if (!noiseContext) {

          console.warn(
            '[GGG] Insignia audio player could not create analog noise canvas.'
          );

          return;

        }


        player.dataset.gggAudioReady =
          'true';


        /* ====================================================
           CONFIG — RESPONSIVE SPATIAL SCALING
        ==================================================== */

        const responsiveConfig = {

          referenceWidth:
            420,

          minScale:
            0.70,

          maxScale:
            1

        };


        /* ====================================================
           CONFIG — MICRO-MOVEMENT
        ==================================================== */

        const movementConfig = {

          maxX:
            0.9,

          maxY:
            0.7,

          maxRotation:
            0.07,

          maxScale:
            0.002,

          minDelay:
            6500,

          maxDelay:
            17000,

          firstDelayMin:
            4000,

          firstDelayMax:
            8000,

          minDuration:
            2200,

          maxDuration:
            4800,

          stillnessChance:
            0.30,

          resetDuration:
            2600

        };


        /* ====================================================
           CONFIG — DISTURBANCE SCHEDULER
        ==================================================== */

        const disturbanceConfig = {

          firstDelayMin:
            8000,

          firstDelayMax:
            14000,

          minDelay:
            12000,

          maxDelay:
            28000,

          failureCooldownMin:
            20000,

          failureCooldownMax:
            38000,

          eventChance:
            0.72

        };


        /* ====================================================
           CONFIG — PLAYBACK PROGRESSION
        ==================================================== */

        const progressionConfig = {

          earlyEnd:
            0.33,

          middleEnd:
            0.66,

          early: {

            echoWeight:
              38,

            fractureWeight:
              32,

            dislocationWeight:
              25,

            failureWeight:
              5

          },

          middle: {

            echoWeight:
              28,

            fractureWeight:
              24,

            dislocationWeight:
              36,

            failureWeight:
              12

          },

          late: {

            echoWeight:
              20,

            fractureWeight:
              18,

            dislocationWeight:
              40,

            failureWeight:
              22

          }

        };


        /* ====================================================
           CONFIG — SIGNAL
        ==================================================== */

        const signalConfig = {

          minDuration:
            80,

          maxDuration:
            180,

          minDisplacement:
            2,

          maxDisplacement:
            5,

          minSliceHeight:
            3,

          maxSliceHeight:
            9,

          minOpacity:
            0.58,

          maxOpacity:
            0.86

        };


        /* ====================================================
           CONFIG — ECHO
        ==================================================== */

        const echoConfig = {

          minDuration:
            300,

          maxDuration:
            500,

          minX:
            6,

          maxX:
            12,

          maxY:
            3,

          minOpacity1:
            0.16,

          maxOpacity1:
            0.30,

          minOpacity2:
            0.07,

          maxOpacity2:
            0.16

        };


        /* ====================================================
           CONFIG — NOISE
        ==================================================== */

        const noiseConfig = {

          minDuration:
            55,

          maxDuration:
            120,

          frameInterval:
            32,

          minValue:
            25,

          maxValue:
            235,

          minAlpha:
            145,

          maxAlpha:
            255,

          minOpacity:
            0.22,

          maxOpacity:
            0.38

        };


        /* ====================================================
           CONFIG — FAILURE
        ==================================================== */

        const failureConfig = {

          echoDelayMin:
            25,

          echoDelayMax:
            70,

          noiseDelayMin:
            85,

          noiseDelayMax:
            150

        };


        /* ====================================================
           STATE
        ==================================================== */

        let movementTimer =
          null;


        let movementActive =
          false;


        let disturbanceTimer =
          null;


        let disturbanceActive =
          false;


        let lastDisturbanceProfile =
          null;


        let signalEndTimer =
          null;


        let echoEndTimer =
          null;


        let noiseEndTimer =
          null;


        let noiseFrameTimer =
          null;


        let noiseActive =
          false;


        let failureEchoTimer =
          null;


        let failureNoiseTimer =
          null;


        let visibilitySuspended =
          document.hidden;


        let spatialScale =
          1;


        /* ====================================================
           GENERAL HELPERS
        ==================================================== */

        function randomBetween(
          min,
          max
        ) {

          return (
            Math.random() *
            (max - min)
          ) + min;

        }


        function randomInteger(
          min,
          max
        ) {

          return Math.floor(
            randomBetween(
              min,
              max + 1
            )
          );

        }


        function randomSign() {

          return Math.random() < 0.5
            ? -1
            : 1;

        }


        function prefersReducedMotion() {

          return window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          ).matches;

        }


        function canRunVisualBehavior() {

          return (
            !visibilitySuspended &&
            !prefersReducedMotion() &&
            !audio.paused &&
            !audio.ended
          );

        }


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


        /* ====================================================
           RESPONSIVE SPATIAL SCALING
        ==================================================== */

        function updateSpatialScale() {

          const rect =
            pin.getBoundingClientRect();


          const renderedWidth =
            rect.width;


          if (
            !Number.isFinite(
              renderedWidth
            ) ||
            renderedWidth <= 0
          ) {

            spatialScale =
              responsiveConfig.maxScale;

            return;

          }


          const proportionalScale =
            renderedWidth /
            responsiveConfig.referenceWidth;


          spatialScale =
            clamp(
              proportionalScale,
              responsiveConfig.minScale,
              responsiveConfig.maxScale
            );

        }


        function scaleSpatialValue(
          value
        ) {

          return (
            value *
            spatialScale
          );

        }


        if (
          typeof ResizeObserver ===
          'function'
        ) {

          const resizeObserver =
            new ResizeObserver(
              updateSpatialScale
            );


          resizeObserver.observe(
            pin
          );

        } else {

          window.addEventListener(
            'resize',
            updateSpatialScale
          );

        }


        updateSpatialScale();


        /* ====================================================
           GLOBAL AUDIO CUE STATE

           The HTML-level class acts only as an audio-state
           signal. Individual ghost notes choose whether they
           respond to it through their own modifier class.
        ==================================================== */

        function updateGlobalAudioState() {

          const anyPlaying =
            document.querySelector(
              '.ggg-insignia-audio.is-playing'
            );


          document.documentElement.classList.toggle(
            'ggg-audio-is-playing',
            Boolean(
              anyPlaying
            )
          );

        }


        /* ====================================================
           PLAYER STATE
        ==================================================== */

        function setPlayingState(
          isPlaying
        ) {

          player.classList.toggle(
            'is-playing',
            isPlaying
          );


          button.setAttribute(
            'aria-pressed',
            String(isPlaying)
          );


          button.setAttribute(
            'aria-label',
            isPlaying
              ? 'Pause The Guild of Ghostly Grounds podcast teaser'
              : 'Play The Guild of Ghostly Grounds podcast teaser'
          );


          updateGlobalAudioState();

        }


        function showRing() {

          player.classList.add(
            'is-active'
          );

        }


        function hideRing() {

          player.classList.remove(
            'is-active'
          );

        }


        /* ====================================================
           PHYSICAL PRESS STATE

           Pointer Events provide one interaction model for:
           • mouse
           • touch
           • pen

           Pointer capture keeps the physical press engaged
           until the initiating contact actually ends.
        ==================================================== */

        function beginPress(
          event
        ) {

          if (
            event.isPrimary ===
            false
          ) {
            return;
          }


          if (
            event.pointerType ===
            'mouse' &&
            event.button !==
            0
          ) {
            return;
          }


          player.classList.add(
            'is-pressed'
          );


          if (
            typeof button.setPointerCapture ===
            'function'
          ) {

            try {

              button.setPointerCapture(
                event.pointerId
              );

            } catch (error) {

              /*
                Pointer capture is enhancement only.
                Native pointer events still provide the
                fallback interaction state.
              */

            }

          }

        }


        function endPress(
          event
        ) {

          player.classList.remove(
            'is-pressed'
          );


          if (
            event &&
            typeof button.hasPointerCapture ===
              'function' &&
            typeof button.releasePointerCapture ===
              'function'
          ) {

            try {

              if (
                button.hasPointerCapture(
                  event.pointerId
                )
              ) {

                button.releasePointerCapture(
                  event.pointerId
                );

              }

            } catch (error) {

              /*
                Nothing further is required if pointer capture
                has already been released by the browser.
              */

            }

          }

        }


        function cancelPress() {

          player.classList.remove(
            'is-pressed'
          );

        }


        /* ====================================================
           COUNTDOWN RING
        ==================================================== */

        function setRingProgress(
          remaining
        ) {

          const clamped =
            clamp(
              remaining,
              0,
              1
            );


          progress.style.setProperty(
            '--ggg-audio-angle',
            (
              clamped *
              360
            ) +
            'deg'
          );

        }


        function updateProgress() {

          if (
            !Number.isFinite(
              audio.duration
            ) ||
            audio.duration <= 0
          ) {

            setRingProgress(
              1
            );

            return;

          }


          setRingProgress(
            1 -
            (
              audio.currentTime /
              audio.duration
            )
          );

        }


        /* ====================================================
           MICRO-MOVEMENT
        ==================================================== */

        function resetPinMovement() {

          pin.style.setProperty(
            '--ggg-pin-drift-x',
            '0px'
          );


          pin.style.setProperty(
            '--ggg-pin-drift-y',
            '0px'
          );


          pin.style.setProperty(
            '--ggg-pin-drift-rotate',
            '0deg'
          );


          pin.style.setProperty(
            '--ggg-pin-drift-scale',
            '1'
          );


          pin.style.setProperty(
            '--ggg-pin-drift-duration',
            movementConfig.resetDuration +
            'ms'
          );

        }


        function scheduleNextMovement() {

          if (
            !movementActive ||
            visibilitySuspended
          ) {
            return;
          }


          window.clearTimeout(
            movementTimer
          );


          movementTimer =
            window.setTimeout(
              movePin,
              randomBetween(
                movementConfig.minDelay,
                movementConfig.maxDelay
              )
            );

        }


        function movePin() {

          if (
            !movementActive ||
            visibilitySuspended
          ) {
            return;
          }


          const remainStill =
            Math.random() <
            movementConfig.stillnessChance;


          if (!remainStill) {

            const maxX =
              scaleSpatialValue(
                movementConfig.maxX
              );


            const maxY =
              scaleSpatialValue(
                movementConfig.maxY
              );


            const x =
              randomBetween(
                -maxX,
                maxX
              );


            const y =
              randomBetween(
                -maxY,
                maxY
              );


            const rotation =
              randomBetween(
                -movementConfig.maxRotation,
                movementConfig.maxRotation
              );


            const scale =
              1 +
              randomBetween(
                0,
                movementConfig.maxScale
              );


            const duration =
              randomBetween(
                movementConfig.minDuration,
                movementConfig.maxDuration
              );


            pin.style.setProperty(
              '--ggg-pin-drift-x',
              x.toFixed(3) +
              'px'
            );


            pin.style.setProperty(
              '--ggg-pin-drift-y',
              y.toFixed(3) +
              'px'
            );


            pin.style.setProperty(
              '--ggg-pin-drift-rotate',
              rotation.toFixed(4) +
              'deg'
            );


            pin.style.setProperty(
              '--ggg-pin-drift-scale',
              scale.toFixed(5)
            );


            pin.style.setProperty(
              '--ggg-pin-drift-duration',
              Math.round(
                duration
              ) +
              'ms'
            );

          }


          scheduleNextMovement();

        }


        function startPinMovement() {

          if (
            !canRunVisualBehavior() ||
            movementActive
          ) {
            return;
          }


          movementActive =
            true;


          window.clearTimeout(
            movementTimer
          );


          movementTimer =
            window.setTimeout(
              movePin,
              randomBetween(
                movementConfig.firstDelayMin,
                movementConfig.firstDelayMax
              )
            );

        }


        function stopPinMovement() {

          movementActive =
            false;


          window.clearTimeout(
            movementTimer
          );


          movementTimer =
            null;


          resetPinMovement();

        }


        /* ====================================================
           SIGNAL
        ==================================================== */

        function setSignalSlice(
          number,
          top,
          height,
          displacement
        ) {

          const bottom =
            Math.max(
              0,
              100 -
              top -
              height
            );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            number +
            '-top',
            top.toFixed(2) +
            '%'
          );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            number +
            '-bottom',
            bottom.toFixed(2) +
            '%'
          );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            number +
            '-x',
            displacement.toFixed(2) +
            'px'
          );

        }


        function randomizeSignal() {

          const height1 =
            randomBetween(
              signalConfig.minSliceHeight,
              signalConfig.maxSliceHeight
            );


          const height2 =
            randomBetween(
              signalConfig.minSliceHeight,
              signalConfig.maxSliceHeight
            );


          const top1 =
            randomBetween(
              18,
              72 - height1
            );


          let top2 =
            randomBetween(
              24,
              82 - height2
            );


          if (
            Math.abs(
              top2 -
              top1
            ) < 10
          ) {

            top2 +=
              12;

          }


          top2 =
            Math.min(
              top2,
              92 - height2
            );


          const minDisplacement =
            scaleSpatialValue(
              signalConfig.minDisplacement
            );


          const maxDisplacement =
            scaleSpatialValue(
              signalConfig.maxDisplacement
            );


          setSignalSlice(
            1,
            top1,
            height1,
            randomBetween(
              minDisplacement,
              maxDisplacement
            ) *
            randomSign()
          );


          setSignalSlice(
            2,
            top2,
            height2,
            randomBetween(
              minDisplacement,
              maxDisplacement
            ) *
            randomSign()
          );


          signal.style.setProperty(
            '--ggg-signal-opacity',
            randomBetween(
              signalConfig.minOpacity,
              signalConfig.maxOpacity
            ).toFixed(2)
          );

        }


        function clearSignalEvent() {

          window.clearTimeout(
            signalEndTimer
          );


          signalEndTimer =
            null;


          player.classList.remove(
            'is-signal-contaminated'
          );

        }


        function triggerSignalEvent() {

          if (
            !canRunVisualBehavior()
          ) {
            return;
          }


          clearSignalEvent();


          randomizeSignal();


          player.classList.add(
            'is-signal-contaminated'
          );


          signalEndTimer =
            window.setTimeout(
              clearSignalEvent,
              randomBetween(
                signalConfig.minDuration,
                signalConfig.maxDuration
              )
            );

        }


        /* ====================================================
           ECHO
        ==================================================== */

        function randomizeEcho() {

          const minX =
            scaleSpatialValue(
              echoConfig.minX
            );


          const maxX =
            scaleSpatialValue(
              echoConfig.maxX
            );


          const maxY =
            scaleSpatialValue(
              echoConfig.maxY
            );


          const x1 =
            randomBetween(
              minX,
              maxX
            ) *
            randomSign();


          const y1 =
            randomBetween(
              -maxY,
              maxY
            );


          const x2 =
            randomBetween(
              minX * .5,
              maxX * .7
            ) *
            (
              x1 > 0
                ? -1
                : 1
            );


          const y2 =
            randomBetween(
              -maxY,
              maxY
            );


          echo.style.setProperty(
            '--ggg-echo-1-x',
            x1.toFixed(2) +
            'px'
          );


          echo.style.setProperty(
            '--ggg-echo-1-y',
            y1.toFixed(2) +
            'px'
          );


          echo.style.setProperty(
            '--ggg-echo-1-opacity',
            randomBetween(
              echoConfig.minOpacity1,
              echoConfig.maxOpacity1
            ).toFixed(2)
          );


          echo.style.setProperty(
            '--ggg-echo-2-x',
            x2.toFixed(2) +
            'px'
          );


          echo.style.setProperty(
            '--ggg-echo-2-y',
            y2.toFixed(2) +
            'px'
          );


          echo.style.setProperty(
            '--ggg-echo-2-opacity',
            randomBetween(
              echoConfig.minOpacity2,
              echoConfig.maxOpacity2
            ).toFixed(2)
          );

        }


        function clearEchoEvent() {

          window.clearTimeout(
            echoEndTimer
          );


          echoEndTimer =
            null;


          player.classList.remove(
            'is-echo-contaminated'
          );

        }


        function triggerEchoEvent() {

          if (
            !canRunVisualBehavior()
          ) {
            return;
          }


          clearEchoEvent();


          randomizeEcho();


          player.classList.add(
            'is-echo-contaminated'
          );


          echoEndTimer =
            window.setTimeout(
              clearEchoEvent,
              randomBetween(
                echoConfig.minDuration,
                echoConfig.maxDuration
              )
            );

        }


        /* ====================================================
           NOISE
        ==================================================== */

        function drawNoiseFrame() {

          if (
            !noiseActive ||
            visibilitySuspended
          ) {
            return;
          }


          const imageData =
            noiseContext.createImageData(
              noise.width,
              noise.height
            );


          const pixels =
            imageData.data;


          for (
            let index = 0;
            index < pixels.length;
            index += 4
          ) {

            const value =
              randomInteger(
                noiseConfig.minValue,
                noiseConfig.maxValue
              );


            pixels[index] =
              value;

            pixels[index + 1] =
              value;

            pixels[index + 2] =
              value;

            pixels[index + 3] =
              randomInteger(
                noiseConfig.minAlpha,
                noiseConfig.maxAlpha
              );

          }


          noiseContext.putImageData(
            imageData,
            0,
            0
          );


          window.clearTimeout(
            noiseFrameTimer
          );


          noiseFrameTimer =
            window.setTimeout(
              drawNoiseFrame,
              noiseConfig.frameInterval
            );

        }


        function clearNoiseEvent() {

          noiseActive =
            false;


          window.clearTimeout(
            noiseEndTimer
          );


          window.clearTimeout(
            noiseFrameTimer
          );


          noiseEndTimer =
            null;


          noiseFrameTimer =
            null;


          player.classList.remove(
            'is-noise-contaminated'
          );


          noiseContext.clearRect(
            0,
            0,
            noise.width,
            noise.height
          );

        }


        function triggerNoiseEvent() {

          if (
            !canRunVisualBehavior()
          ) {
            return;
          }


          clearNoiseEvent();


          noise.style.setProperty(
            '--ggg-noise-opacity',
            randomBetween(
              noiseConfig.minOpacity,
              noiseConfig.maxOpacity
            ).toFixed(2)
          );


          noiseActive =
            true;


          drawNoiseFrame();


          player.classList.add(
            'is-noise-contaminated'
          );


          noiseEndTimer =
            window.setTimeout(
              clearNoiseEvent,
              randomBetween(
                noiseConfig.minDuration,
                noiseConfig.maxDuration
              )
            );

        }


        /* ====================================================
           FAILURE SEQUENCE
        ==================================================== */

        function clearFailureSequence() {

          window.clearTimeout(
            failureEchoTimer
          );


          window.clearTimeout(
            failureNoiseTimer
          );


          failureEchoTimer =
            null;


          failureNoiseTimer =
            null;

        }


        function triggerFailureEvent() {

          triggerSignalEvent();


          failureEchoTimer =
            window.setTimeout(
              function () {

                if (
                  disturbanceActive &&
                  canRunVisualBehavior()
                ) {

                  triggerEchoEvent();

                }

              },
              randomBetween(
                failureConfig.echoDelayMin,
                failureConfig.echoDelayMax
              )
            );


          failureNoiseTimer =
            window.setTimeout(
              function () {

                if (
                  disturbanceActive &&
                  canRunVisualBehavior()
                ) {

                  triggerNoiseEvent();

                }

              },
              randomBetween(
                failureConfig.noiseDelayMin,
                failureConfig.noiseDelayMax
              )
            );

        }


        /* ====================================================
           PLAYBACK PROGRESSION
        ==================================================== */

        function getPlaybackProgress() {

          if (
            !Number.isFinite(
              audio.duration
            ) ||
            audio.duration <= 0
          ) {

            return 0;

          }


          return clamp(
            audio.currentTime /
            audio.duration,
            0,
            1
          );

        }


        function getProgressionWeights() {

          const ratio =
            getPlaybackProgress();


          if (
            ratio <
            progressionConfig.earlyEnd
          ) {

            return progressionConfig.early;

          }


          if (
            ratio <
            progressionConfig.middleEnd
          ) {

            return progressionConfig.middle;

          }


          return progressionConfig.late;

        }


        /* ====================================================
           DISTURBANCE SELECTION
        ==================================================== */

        function chooseDisturbanceProfile() {

          const weights =
            getProgressionWeights();


          const profiles = [

            {
              name:
                'echo',

              weight:
                weights.echoWeight
            },

            {
              name:
                'fracture',

              weight:
                weights.fractureWeight
            },

            {
              name:
                'dislocation',

              weight:
                weights.dislocationWeight
            },

            {
              name:
                'failure',

              weight:
                weights.failureWeight
            }

          ];


          const available =
            profiles.filter(
              function (profile) {

                return (
                  profile.name !==
                  lastDisturbanceProfile
                );

              }
            );


          const total =
            available.reduce(
              function (
                sum,
                profile
              ) {

                return (
                  sum +
                  profile.weight
                );

              },
              0
            );


          let roll =
            randomBetween(
              0,
              total
            );


          for (
            let index = 0;
            index < available.length;
            index += 1
          ) {

            const profile =
              available[index];


            if (
              roll <
              profile.weight
            ) {

              return profile.name;

            }


            roll -=
              profile.weight;

          }


          return (
            available[
              available.length - 1
            ].name
          );

        }


        /* ====================================================
           DISTURBANCE SCHEDULER
        ==================================================== */

        function scheduleNextDisturbance(
          failureCooldown
        ) {

          if (
            !disturbanceActive ||
            visibilitySuspended
          ) {
            return;
          }


          window.clearTimeout(
            disturbanceTimer
          );


          const delay =
            failureCooldown
              ? randomBetween(
                  disturbanceConfig.failureCooldownMin,
                  disturbanceConfig.failureCooldownMax
                )
              : randomBetween(
                  disturbanceConfig.minDelay,
                  disturbanceConfig.maxDelay
                );


          disturbanceTimer =
            window.setTimeout(
              triggerDisturbance,
              delay
            );

        }


        function triggerDisturbance() {

          if (
            !disturbanceActive ||
            !canRunVisualBehavior()
          ) {
            return;
          }


          clearFailureSequence();


          if (
            Math.random() >=
            disturbanceConfig.eventChance
          ) {

            scheduleNextDisturbance(
              false
            );

            return;

          }


          const profile =
            chooseDisturbanceProfile();


          lastDisturbanceProfile =
            profile;


          switch (profile) {

            case 'echo':

              triggerEchoEvent();

              scheduleNextDisturbance(
                false
              );

              break;


            case 'fracture':

              triggerSignalEvent();

              scheduleNextDisturbance(
                false
              );

              break;


            case 'dislocation':

              triggerSignalEvent();

              triggerEchoEvent();

              scheduleNextDisturbance(
                false
              );

              break;


            case 'failure':

              triggerFailureEvent();

              scheduleNextDisturbance(
                true
              );

              break;

          }

        }


        function startDisturbances() {

          if (
            !canRunVisualBehavior() ||
            disturbanceActive
          ) {
            return;
          }


          disturbanceActive =
            true;


          window.clearTimeout(
            disturbanceTimer
          );


          clearFailureSequence();

          clearSignalEvent();

          clearEchoEvent();

          clearNoiseEvent();


          disturbanceTimer =
            window.setTimeout(
              triggerDisturbance,
              randomBetween(
                disturbanceConfig.firstDelayMin,
                disturbanceConfig.firstDelayMax
              )
            );

        }


        function stopDisturbances() {

          disturbanceActive =
            false;


          window.clearTimeout(
            disturbanceTimer
          );


          disturbanceTimer =
            null;


          clearFailureSequence();

          clearSignalEvent();

          clearEchoEvent();

          clearNoiseEvent();

        }


        /* ====================================================
           VISIBILITY
        ==================================================== */

        function suspendVisualBehavior() {

          visibilitySuspended =
            true;


          cancelPress();

          stopPinMovement();

          stopDisturbances();

        }


        function resumeVisualBehavior() {

          visibilitySuspended =
            false;


          updateSpatialScale();


          if (
            audio.paused ||
            audio.ended ||
            prefersReducedMotion()
          ) {
            return;
          }


          startPinMovement();

          startDisturbances();

        }


        function handleVisibilityChange() {

          if (
            document.hidden
          ) {

            suspendVisualBehavior();

          } else {

            resumeVisualBehavior();

          }

        }


        /* ====================================================
           PLAY / PAUSE
        ==================================================== */

        function togglePlayback() {

          if (audio.paused) {

            if (
              audio.ended ||
              (
                Number.isFinite(
                  audio.duration
                ) &&
                audio.duration > 0 &&
                audio.currentTime >=
                  audio.duration - .05
              )
            ) {

              audio.currentTime =
                0;


              lastDisturbanceProfile =
                null;


              setRingProgress(
                1
              );

            }


            showRing();


            const promise =
              audio.play();


            if (
              promise &&
              typeof promise.catch ===
              'function'
            ) {

              promise.catch(
                function (error) {

                  setPlayingState(
                    false
                  );


                  hideRing();

                  stopPinMovement();

                  stopDisturbances();


                  console.warn(
                    '[GGG] Unable to play teaser audio:',
                    error
                  );

                }
              );

            }

          } else {

            audio.pause();

          }

        }


        /* ====================================================
           EVENTS — PHYSICAL PRESS
        ==================================================== */

        button.addEventListener(
          'pointerdown',
          beginPress
        );


        button.addEventListener(
          'pointerup',
          endPress
        );


        button.addEventListener(
          'pointercancel',
          cancelPress
        );


        button.addEventListener(
          'lostpointercapture',
          cancelPress
        );


        button.addEventListener(
          'blur',
          cancelPress
        );


        /* ====================================================
           EVENTS — PLAYBACK
        ==================================================== */

        button.addEventListener(
          'click',
          togglePlayback,
          {
            capture:
              true
          }
        );


        audio.addEventListener(
          'play',
          function () {

            showRing();


            setPlayingState(
              true
            );


            updateSpatialScale();


            if (
              !document.hidden
            ) {

              startPinMovement();

              startDisturbances();

            }

          }
        );


        audio.addEventListener(
          'pause',
          function () {

            setPlayingState(
              false
            );


            cancelPress();

            stopPinMovement();

            stopDisturbances();

          }
        );


        audio.addEventListener(
          'timeupdate',
          updateProgress
        );


        audio.addEventListener(
          'loadedmetadata',
          updateProgress
        );


        audio.addEventListener(
          'durationchange',
          updateProgress
        );


        audio.addEventListener(
          'ended',
          function () {

            setPlayingState(
              false
            );


            cancelPress();

            stopPinMovement();

            stopDisturbances();


            lastDisturbanceProfile =
              null;


            setRingProgress(
              0
            );


            window.setTimeout(
              function () {

                if (
                  audio.ended
                ) {

                  hideRing();

                }

              },
              400
            );

          }
        );


        document.addEventListener(
          'visibilitychange',
          handleVisibilityChange
        );


        /* ====================================================
           INITIAL STATE
        ==================================================== */

        updateSpatialScale();


        cancelPress();


        setPlayingState(
          false
        );


        hideRing();


        setRingProgress(
          1
        );


        resetPinMovement();


        stopDisturbances();

      }
    );

  }


  /* ========================================================
     SQUARESPACE-SAFE START
  ======================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initInsigniaAudioPlayers,
      {
        once:
          true
      }
    );

  } else {

    initInsigniaAudioPlayers();

  }

})();
