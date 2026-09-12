/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v2.0 — Countdown Ring + Signal + Echo + Analog Noise

   PURPOSE
   Turns the Guild insignia into a discreet audio control.

   INTERACTION
   • click pin = play / pause
   • full countdown ring appears at playback start
   • one continuous ring depletes as playback progresses
   • pause freezes the ring
   • end depletes ring completely, then hides it
   • while audio is playing, the pin may subtly drift,
     rotate, and scale at irregular intervals
   • occasional contamination may create:
       - displaced horizontal pin fragments
       - faint analog registration echoes
       - brief monochrome static inside the pin silhouette

   MICRO-MOVEMENT
   • no repeating CSS animation
   • movement is generated at irregular intervals
   • some intervals intentionally contain no movement
   • first movement is delayed after playback begins
   • pause / end returns the pin quietly to rest

   SIGNAL CONTAMINATION
   • signal events begin only after playback has established
   • events occur at irregular intervals
   • some intervals intentionally contain no event
   • each event generates new slice positions
   • each event generates new horizontal displacement

   ANALOG ECHO
   • echo may occur independently or with signal contamination
   • two faint pin duplicates are displaced independently
   • echo duration is brief and irregular
   • no RGB separation
   • no glow
   • no looping animation

   ANALOG NOISE
   • noise is rendered into a low-resolution canvas
   • noise appears only during some contamination events
   • each frame contains fresh monochrome noise
   • CSS masks the canvas to the pin silhouette

   CLEANUP
   • pause / end immediately clears:
       - movement
       - signal slices
       - echo
       - analog noise
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


        const noiseContext =
          noise.getContext(
            '2d',
            {
              alpha:
                true
            }
          );


        if (
          !noiseContext
        ) {

          console.warn(
            '[GGG] Insignia audio player could not create analog noise canvas.'
          );

          return;

        }


        player.dataset.gggAudioReady =
          'true';


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
           CONFIG — SIGNAL CONTAMINATION
        ==================================================== */

        const signalConfig = {

          firstDelayMin:
            8000,

          firstDelayMax:
            14000,

          minDelay:
            12000,

          maxDelay:
            28000,

          eventChance:
            0.65,

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
           CONFIG — ANALOG ECHO
        ==================================================== */

        const echoConfig = {

          independentChance:
            0.55,

          signalCompanionChance:
            0.55,

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
           CONFIG — ANALOG NOISE
        ==================================================== */

        const noiseConfig = {

          eventChance:
            0.38,

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
           STATE
        ==================================================== */

        let movementTimer =
          null;


        let movementActive =
          false;


        let signalTimer =
          null;


        let signalEndTimer =
          null;


        let signalActive =
          false;


        let echoEndTimer =
          null;


        let noiseEndTimer =
          null;


        let noiseFrameTimer =
          null;


        let noiseActive =
          false;


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
           COUNTDOWN RING
        ==================================================== */

        function setRingProgress(
          remaining
        ) {

          const clamped =
            Math.min(
              Math.max(
                remaining,
                0
              ),
              1
            );


          const angle =
            clamped * 360;


          progress.style.setProperty(
            '--ggg-audio-angle',
            angle + 'deg'
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


          const ratio =
            audio.currentTime /
            audio.duration;


          setRingProgress(
            1 - ratio
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
            !movementActive
          ) {
            return;
          }


          window.clearTimeout(
            movementTimer
          );


          const delay =
            randomBetween(
              movementConfig.minDelay,
              movementConfig.maxDelay
            );


          movementTimer =
            window.setTimeout(
              movePin,
              delay
            );

        }


        function movePin() {

          if (
            !movementActive
          ) {
            return;
          }


          const remainStill =
            Math.random() <
            movementConfig.stillnessChance;


          if (
            !remainStill
          ) {

            const x =
              randomBetween(
                -movementConfig.maxX,
                movementConfig.maxX
              );


            const y =
              randomBetween(
                -movementConfig.maxY,
                movementConfig.maxY
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
            prefersReducedMotion()
          ) {
            return;
          }


          if (
            movementActive
          ) {
            return;
          }


          movementActive =
            true;


          window.clearTimeout(
            movementTimer
          );


          const firstDelay =
            randomBetween(
              movementConfig.firstDelayMin,
              movementConfig.firstDelayMax
            );


          movementTimer =
            window.setTimeout(
              movePin,
              firstDelay
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
           ANALOG ECHO
        ==================================================== */

        function randomizeEcho() {

          const x1 =
            randomBetween(
              echoConfig.minX,
              echoConfig.maxX
            ) *
            randomSign();


          const y1 =
            randomBetween(
              -echoConfig.maxY,
              echoConfig.maxY
            );


          /*
            The second copy usually falls on the opposite side
            of the original image.

            This creates a registration error rather than a
            simple shadow.
          */

          const x2 =
            randomBetween(
              echoConfig.minX * 0.5,
              echoConfig.maxX * 0.7
            ) *
            (
              x1 > 0
                ? -1
                : 1
            );


          const y2 =
            randomBetween(
              -echoConfig.maxY,
              echoConfig.maxY
            );


          const opacity1 =
            randomBetween(
              echoConfig.minOpacity1,
              echoConfig.maxOpacity1
            );


          const opacity2 =
            randomBetween(
              echoConfig.minOpacity2,
              echoConfig.maxOpacity2
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
            opacity1.toFixed(2)
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
            opacity2.toFixed(2)
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
            prefersReducedMotion() ||
            audio.paused ||
            audio.ended
          ) {
            return;
          }


          clearEchoEvent();


          randomizeEcho();


          player.classList.add(
            'is-echo-contaminated'
          );


          const duration =
            randomBetween(
              echoConfig.minDuration,
              echoConfig.maxDuration
            );


          echoEndTimer =
            window.setTimeout(
              clearEchoEvent,
              duration
            );

        }


        /* ====================================================
           ANALOG NOISE
        ==================================================== */

        function drawNoiseFrame() {

          if (
            !noiseActive
          ) {
            return;
          }


          const width =
            noise.width;


          const height =
            noise.height;


          const imageData =
            noiseContext.createImageData(
              width,
              height
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


            const alpha =
              randomInteger(
                noiseConfig.minAlpha,
                noiseConfig.maxAlpha
              );


            pixels[index] =
              value;


            pixels[index + 1] =
              value;


            pixels[index + 2] =
              value;


            pixels[index + 3] =
              alpha;

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
            prefersReducedMotion() ||
            audio.paused ||
            audio.ended
          ) {
            return;
          }


          clearNoiseEvent();


          const opacity =
            randomBetween(
              noiseConfig.minOpacity,
              noiseConfig.maxOpacity
            );


          noise.style.setProperty(
            '--ggg-noise-opacity',
            opacity.toFixed(2)
          );


          const duration =
            randomBetween(
              noiseConfig.minDuration,
              noiseConfig.maxDuration
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
              duration
            );

        }


        /* ====================================================
           SIGNAL CONTAMINATION
        ==================================================== */

        function setSignalSlice(
          sliceNumber,
          top,
          height,
          displacement
        ) {

          const bottom =
            Math.max(
              0,
              100 - top - height
            );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            sliceNumber +
            '-top',
            top.toFixed(2) +
            '%'
          );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            sliceNumber +
            '-bottom',
            bottom.toFixed(2) +
            '%'
          );


          signal.style.setProperty(
            '--ggg-signal-slice-' +
            sliceNumber +
            '-x',
            displacement.toFixed(2) +
            'px'
          );

        }


        function randomizeSignal() {

          const slice1Height =
            randomBetween(
              signalConfig.minSliceHeight,
              signalConfig.maxSliceHeight
            );


          const slice2Height =
            randomBetween(
              signalConfig.minSliceHeight,
              signalConfig.maxSliceHeight
            );


          const slice1Top =
            randomBetween(
              18,
              72 - slice1Height
            );


          let slice2Top =
            randomBetween(
              24,
              82 - slice2Height
            );


          if (
            Math.abs(
              slice2Top -
              slice1Top
            ) < 10
          ) {

            slice2Top +=
              12;

          }


          slice2Top =
            Math.min(
              slice2Top,
              92 - slice2Height
            );


          const displacement1 =
            randomBetween(
              signalConfig.minDisplacement,
              signalConfig.maxDisplacement
            ) *
            randomSign();


          const displacement2 =
            randomBetween(
              signalConfig.minDisplacement,
              signalConfig.maxDisplacement
            ) *
            randomSign();


          const opacity =
            randomBetween(
              signalConfig.minOpacity,
              signalConfig.maxOpacity
            );


          setSignalSlice(
            1,
            slice1Top,
            slice1Height,
            displacement1
          );


          setSignalSlice(
            2,
            slice2Top,
            slice2Height,
            displacement2
          );


          signal.style.setProperty(
            '--ggg-signal-opacity',
            opacity.toFixed(2)
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
            !signalActive ||
            audio.paused ||
            audio.ended
          ) {
            return;
          }


          const shouldTriggerSignal =
            Math.random() <
            signalConfig.eventChance;


          /*
            Even when the horizontal slice event does not fire,
            there is a small chance of an isolated registration
            echo.

            This prevents all anomalies from sharing the same
            visual signature.
          */

          if (
            !shouldTriggerSignal
          ) {

            const isolatedEcho =
              Math.random() <
              echoConfig.independentChance;


            if (
              isolatedEcho
            ) {

              triggerEchoEvent();

            }


            scheduleNextSignalEvent();

            return;

          }


          randomizeSignal();


          player.classList.add(
            'is-signal-contaminated'
          );


          const signalDuration =
            randomBetween(
              signalConfig.minDuration,
              signalConfig.maxDuration
            );


          window.clearTimeout(
            signalEndTimer
          );


          signalEndTimer =
            window.setTimeout(
              clearSignalEvent,
              signalDuration
            );


          /*
            The echo may accompany the signal displacement,
            but it is not guaranteed.
          */

          const includeEcho =
            Math.random() <
            echoConfig.signalCompanionChance;


          if (
            includeEcho
          ) {

            triggerEchoEvent();

          }


          /*
            Analog noise remains the rarest contamination
            element.
          */

          const includeNoise =
            Math.random() <
            noiseConfig.eventChance;


          if (
            includeNoise
          ) {

            triggerNoiseEvent();

          }


          scheduleNextSignalEvent();

        }


        function scheduleNextSignalEvent() {

          if (
            !signalActive
          ) {
            return;
          }


          window.clearTimeout(
            signalTimer
          );


          const delay =
            randomBetween(
              signalConfig.minDelay,
              signalConfig.maxDelay
            );


          signalTimer =
            window.setTimeout(
              triggerSignalEvent,
              delay
            );

        }


        function startSignalContamination() {

          if (
            prefersReducedMotion()
          ) {
            return;
          }


          if (
            signalActive
          ) {
            return;
          }


          signalActive =
            true;


          window.clearTimeout(
            signalTimer
          );


          clearSignalEvent();


          clearEchoEvent();


          clearNoiseEvent();


          const firstDelay =
            randomBetween(
              signalConfig.firstDelayMin,
              signalConfig.firstDelayMax
            );


          signalTimer =
            window.setTimeout(
              triggerSignalEvent,
              firstDelay
            );

        }


        function stopSignalContamination() {

          signalActive =
            false;


          window.clearTimeout(
            signalTimer
          );


          window.clearTimeout(
            signalEndTimer
          );


          signalTimer =
            null;


          signalEndTimer =
            null;


          player.classList.remove(
            'is-signal-contaminated'
          );


          clearEchoEvent();


          clearNoiseEvent();

        }


        /* ====================================================
           PLAY / PAUSE
        ==================================================== */

        function togglePlayback() {

          if (
            audio.paused
          ) {

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


              setRingProgress(
                1
              );

            }


            showRing();


            const playPromise =
              audio.play();


            if (
              playPromise &&
              typeof playPromise.catch ===
              'function'
            ) {

              playPromise.catch(
                function (error) {

                  hideRing();


                  stopPinMovement();


                  stopSignalContamination();


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
           EVENTS
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


            startPinMovement();


            startSignalContamination();

          }
        );


        audio.addEventListener(
          'pause',
          function () {

            setPlayingState(
              false
            );


            stopPinMovement();


            stopSignalContamination();

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


            stopPinMovement();


            stopSignalContamination();


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


        /* ====================================================
           INITIAL STATE
        ==================================================== */

        setPlayingState(
          false
        );


        hideRing();


        setRingProgress(
          1
        );


        resetPinMovement();


        stopSignalContamination();

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
