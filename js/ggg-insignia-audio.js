/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v2.4 — Visibility-Safe Disturbances

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

   DISTURBANCE SYSTEM
   Supernatural interference is composed into four profiles:

   ECHO
   • exaggerated full-image registration error
   • no signal slicing
   • no static

   FRACTURE
   • horizontal signal displacement
   • no echo
   • no static

   DISLOCATION
   • signal displacement
   • exaggerated registration echo

   FAILURE
   • signal displacement begins
   • registration echo follows
   • analog static briefly contaminates the image
   • timing is staggered across several frames

   DISTURBANCE MEMORY
   • the same profile cannot occur twice consecutively
   • intentional silent opportunities do not erase memory
   • profile selection remains weighted and irregular

   FAILURE COOLDOWN
   • normal disturbance delay = 12–28 seconds
   • after a failure = 20–38 seconds
   • prevents strong events from clustering together

   PLAYBACK PROGRESSION
   • first third favors echo and fracture
   • middle third favors dislocation
   • final third permits more severe failures
   • event timing remains random
   • nothing is synchronized to exact audio timestamps
   • visual effect strength remains unchanged

   VISIBILITY HANDLING
   • hidden tabs suspend movement and disturbances
   • audio itself is not automatically paused
   • no disturbance timers accumulate in the background
   • returning to the page resumes behavior cleanly
   • active visual contamination is cleared while hidden

   MICRO-MOVEMENT
   • no repeating CSS animation
   • movement is generated at irregular intervals
   • some intervals intentionally contain no movement
   • first movement is delayed after playback begins
   • pause / end returns the pin quietly to rest

   CLEANUP
   • pause / end / hidden-page state immediately clears:
       - movement
       - signal slices
       - echo
       - analog noise
       - pending failure sequence timers
       - pending disturbance timers
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


        if (!noiseContext) {

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
           CONFIG — SIGNAL CONTAMINATION
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
           CONFIG — ANALOG ECHO
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
           CONFIG — ANALOG NOISE
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
           CONFIG — FAILURE SEQUENCE
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
            !movementActive ||
            visibilitySuspended
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
            !movementActive ||
            visibilitySuspended
          ) {
            return;
          }


          const remainStill =
            Math.random() <
            movementConfig.stillnessChance;


          if (!remainStill) {

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
           SIGNAL
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
            !canRunVisualBehavior()
          ) {
            return;
          }


          clearSignalEvent();


          randomizeSignal();


          player.classList.add(
            'is-signal-contaminated'
          );


          const duration =
            randomBetween(
              signalConfig.minDuration,
              signalConfig.maxDuration
            );


          signalEndTimer =
            window.setTimeout(
              clearSignalEvent,
              duration
            );

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
            !canRunVisualBehavior()
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
            !noiseActive ||
            visibilitySuspended
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
            !canRunVisualBehavior()
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


          const echoDelay =
            randomBetween(
              failureConfig.echoDelayMin,
              failureConfig.echoDelayMax
            );


          const noiseDelay =
            randomBetween(
              failureConfig.noiseDelayMin,
              failureConfig.noiseDelayMax
            );


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
              echoDelay
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
              noiseDelay
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


          return Math.min(
            Math.max(
              audio.currentTime /
              audio.duration,
              0
            ),
            1
          );

        }


        function getProgressionWeights() {

          const progress =
            getPlaybackProgress();


          if (
            progress <
            progressionConfig.earlyEnd
          ) {

            return progressionConfig.early;

          }


          if (
            progress <
            progressionConfig.middleEnd
          ) {

            return progressionConfig.middle;

          }


          return progressionConfig.late;

        }


        /* ====================================================
           DISTURBANCE PROFILE SELECTION
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


          const availableProfiles =
            profiles.filter(
              function (profile) {

                return (
                  profile.name !==
                  lastDisturbanceProfile
                );

              }
            );


          const totalWeight =
            availableProfiles.reduce(
              function (
                total,
                profile
              ) {

                return (
                  total +
                  profile.weight
                );

              },
              0
            );


          let roll =
            randomBetween(
              0,
              totalWeight
            );


          for (
            let index = 0;
            index < availableProfiles.length;
            index += 1
          ) {

            const profile =
              availableProfiles[index];


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
            availableProfiles[
              availableProfiles.length - 1
            ].name
          );

        }


        /* ====================================================
           DISTURBANCE SCHEDULER
        ==================================================== */

        function scheduleNextDisturbance(
          useFailureCooldown
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


          let delay;


          if (
            useFailureCooldown
          ) {

            delay =
              randomBetween(
                disturbanceConfig.failureCooldownMin,
                disturbanceConfig.failureCooldownMax
              );

          } else {

            delay =
              randomBetween(
                disturbanceConfig.minDelay,
                disturbanceConfig.maxDelay
              );

          }


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


          const shouldTrigger =
            Math.random() <
            disturbanceConfig.eventChance;


          if (!shouldTrigger) {

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


          const firstDelay =
            randomBetween(
              disturbanceConfig.firstDelayMin,
              disturbanceConfig.firstDelayMax
            );


          disturbanceTimer =
            window.setTimeout(
              triggerDisturbance,
              firstDelay
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
           VISIBILITY HANDLING
        ==================================================== */

        function suspendVisualBehavior() {

          visibilitySuspended =
            true;


          stopPinMovement();


          stopDisturbances();

        }


        function resumeVisualBehavior() {

          visibilitySuspended =
            false;


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
