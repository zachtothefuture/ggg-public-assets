/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.4 — Continuous Countdown Ring
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
            '.ggg-insignia-audio__progress'
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

        function updateProgress() {

          if (
            !Number.isFinite(
              audio.duration
            ) ||
            audio.duration <= 0
          ) {

            progress.style.setProperty(
              '--ggg-audio-remaining',
              '1'
            );

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


          const remaining =
            1 - ratio;


          progress.style.setProperty(
            '--ggg-audio-remaining',
            String(remaining)
          );

        }


        /* ====================================================
           PLAY / PAUSE
        ==================================================== */

        function togglePlayback() {

          if (audio.paused) {

            /*
              Replay after completion.
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
              Force completely depleted state.
            */

            progress.style.setProperty(
              '--ggg-audio-remaining',
              '0'
            );


            window.setTimeout(
              function () {

                if (audio.ended) {

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


        progress.style.setProperty(
          '--ggg-audio-remaining',
          '1'
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
