/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.7 — Countdown Ring + Supernatural Micro-Movement

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

   MICRO-MOVEMENT
   • no repeating CSS animation
   • movement is generated at irregular intervals
   • some intervals intentionally contain no movement
   • first movement is delayed after playback begins
   • pause / end returns the pin quietly to rest
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


        if (
          !button ||
          !audio ||
          !progress ||
          !pin
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
           STATE
        ==================================================== */

        let movementTimer =
          null;


        let movementActive =
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


          /*
            Some intervals deliberately contain
            no visible movement.

            This prevents the effect from developing
            an obvious animation rhythm.
          */

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


          /*
            Playback begins normally.

            The anomaly waits before doing
            anything visibly unusual.
          */

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

          }
        );


        audio.addEventListener(
          'pause',
          function () {

            setPlayingState(
              false
            );


            stopPinMovement();

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
