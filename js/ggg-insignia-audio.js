/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.8 — Countdown Ring + Supernatural Signal Contamination

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
   • occasional brief signal contamination creates displaced
     horizontal fragments of the pin

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
   • events last only a fraction of a second
   • pause / end immediately clears contamination
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


        if (
          !button ||
          !audio ||
          !progress ||
          !pin ||
          !signal
        ) {

          console.warn(
            '[GGG] Insignia audio player is missing required markup.'
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
            2000,

          firstDelayMax:
            3000,

          minDuration:
            3000,

          maxDuration:
            5000,

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
            1,

          minDuration:
            250,

          maxDuration:
            400,

          minDisplacement:
            8,

          maxDisplacement:
            15,

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


          /*
            Try to keep the second slice from landing
            directly on top of the first.
          */

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


          const shouldTrigger =
            Math.random() <
            signalConfig.eventChance;


          if (
            shouldTrigger
          ) {

            randomizeSignal();


            player.classList.add(
              'is-signal-contaminated'
            );


            const duration =
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
                duration
              );

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


          /*
            Let the teaser establish itself before the first
            possible interference event.
          */

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

        }


        /* ====================================================
           PLAY / PAUSE
        ==================================================== */

        function togglePlayback() {

          if (
            audio.paused
          ) {

            /*
              Restart after completed playback.
            */

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
