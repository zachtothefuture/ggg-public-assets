/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.6 — Continuous Orange Countdown Ring
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


        if (
          !button ||
          !audio ||
          !progress
        ) {

          console.warn(
            '[GGG] Insignia audio player is missing required markup.'
          );

          return;

        }


        player.dataset.gggAudioReady =
          'true';


        /* ====================================================
           STATE
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

          }
        );


        audio.addEventListener(
          'pause',
          function () {

            setPlayingState(
              false
            );

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
