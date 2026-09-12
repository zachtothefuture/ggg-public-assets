/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.3 — Continuous Orange Countdown Ring

   PURPOSE
   Turns the Guild insignia into a discreet audio control.

   INTERACTION
   • click pin = play / pause
   • playback begins with one complete orange ring
   • ring depletes clockwise as audio progresses
   • paused playback freezes ring position
   • completed playback leaves ring depleted, then hides it
   • replay restores the full ring and starts from beginning
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


        /*
          Use the circle's actual rendered path length.

          This avoids Safari interpreting normalized values
          as repeating dash patterns around the circumference.
        */

        const circumference =
          progress.getTotalLength();


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
           RING VISIBILITY
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

          /*
            Before metadata is available, render the complete
            circumference so playback can begin cleanly.
          */

          if (
            !Number.isFinite(
              audio.duration
            ) ||
            audio.duration <= 0
          ) {

            progress.style.strokeDasharray =
              circumference +
              ' ' +
              circumference;


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
            Countdown model:

            start:
              full circumference

            midpoint:
              half circumference

            end:
              zero circumference
          */

          const remaining =
            circumference *
            (1 - ratio);


          progress.style.strokeDasharray =
            remaining +
            ' ' +
            circumference;


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
              If playback has already completed,
              restore the beginning before replay.
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


        audio.addEventListener(
          'durationchange',
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
              Leave currentTime at duration.

              This keeps the ring fully depleted instead of
              snapping back to a complete circle.
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
        once:
          true
      }
    );

  } else {

    initInsigniaAudioPlayers();

  }

})();
