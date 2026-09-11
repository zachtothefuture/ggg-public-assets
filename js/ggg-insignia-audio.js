/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.2 — Orange Countdown Time Loop

   PURPOSE
   Turns the Guild insignia into a discreet audio control.

   INTERACTION
   • click pin = play / pause
   • playback begins with a full orange ring
   • ring depletes clockwise as audio progresses
   • paused playback freezes ring position
   • completed playback leaves ring depleted, then hides it
   • replay restores the full ring and starts from the beginning
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


        player.dataset.gggAudioReady =
          'true';


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
            '.ggg-insignia-audio__elapsed'
          );


        if (
          !button ||
          !audio ||
          !progress
        ) {
          return;
        }


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


        /* ====================================================
           ACTIVE STATE
        ==================================================== */

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
           COUNTDOWN PROGRESS
        ==================================================== */

        function updateProgress() {

          if (
            !Number.isFinite(
              audio.duration
            ) ||
            audio.duration <= 0
          ) {

            progress.style.strokeDasharray =
              '100 100';

            progress.style.strokeDashoffset =
              '0';

            return;

          }


          const ratio =
            Math.min(
              Math.max(
                audio.currentTime /
                audio.duration,
                0
              ),
              1
            );


          /*
            Remaining-time model:

            start:
              100

            midpoint:
              50

            end:
              0
          */

          const remaining =
            (1 - ratio) *
            100;


          progress.style.strokeDasharray =
            remaining +
            ' 100';


          progress.style.strokeDashoffset =
            '0';

        }


        /* ====================================================
           PLAY / PAUSE
        ==================================================== */

        function togglePlayback() {

          if (
            audio.paused
          ) {

            /*
              If playback already completed,
              reset to the beginning before replay.
            */

            if (
              Number.isFinite(
                audio.duration
              ) &&
              audio.duration > 0 &&
              audio.currentTime >=
                audio.duration - .05
            ) {

              audio.currentTime =
                0;


              updateProgress();

            }


            showRing();


            audio
              .play()
              .catch(
                function (error) {

                  hideRing();


                  console.warn(
                    '[GGG] Unable to play teaser audio:',
                    error
                  );

                }
              );

          } else {

            audio.pause();

          }

        }


        /* ====================================================
           BUTTON
        ==================================================== */

        button.addEventListener(
          'click',
          togglePlayback
        );


        /* ====================================================
           AUDIO EVENTS
        ==================================================== */

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


        /* ====================================================
           COMPLETE
        ==================================================== */

        audio.addEventListener(
          'ended',
          function () {

            setPlayingState(
              false
            );


            /*
              Do not reset currentTime here.

              Keeping currentTime at duration ensures the
              countdown ring reaches zero rather than
              jumping back to a complete circumference.
            */

            updateProgress();


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


        updateProgress();

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
        once: true
      }
    );

  } else {

    initInsigniaAudioPlayers();

  }

})();
