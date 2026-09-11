/* ==========================================================
   GGG DESIGN SYSTEM
   COMPONENT — INSIGNIA AUDIO PLAYER

   VERSION
   v1.0 — Artifact Audio Control
========================================================== */

(function () {

  'use strict';


  /* ========================================================
     INIT
  ======================================================== */

  function initInsigniaAudioPlayers() {

    const players = document.querySelectorAll(
      '[data-ggg-audio-player]'
    );

    if (!players.length) return;


    players.forEach(function (player) {

      if (player.dataset.gggAudioReady === 'true') {
        return;
      }

      player.dataset.gggAudioReady = 'true';


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

      const progressSVG =
        player.querySelector(
          '.ggg-insignia-audio__progress'
        );


      if (
        !button ||
        !audio ||
        !progress ||
        !progressSVG
      ) {
        return;
      }


      let isSeeking =
        false;


      /* ====================================================
         STATE
      ==================================================== */

      function setPlayingState(isPlaying) {

        player.classList.toggle(
          'is-playing',
          isPlaying
        );

        player.classList.add(
          'is-active'
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
         PROGRESS
      ==================================================== */

      function updateProgress() {

        if (
          !Number.isFinite(audio.duration) ||
          audio.duration <= 0
        ) {

          progress.style.strokeDashoffset =
            '100';

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


        const offset =
          100 - (ratio * 100);


        progress.style.strokeDashoffset =
          String(offset);

      }


      /* ====================================================
         PLAY / PAUSE
      ==================================================== */

      function togglePlayback() {

        if (audio.paused) {

          audio.play()
            .then(function () {

              setPlayingState(true);

            })
            .catch(function (error) {

              console.warn(
                '[GGG] Unable to play teaser audio:',
                error
              );

            });

        } else {

          audio.pause();

        }

      }


      button.addEventListener(
        'click',
        togglePlayback
      );


      audio.addEventListener(
        'play',
        function () {

          setPlayingState(true);

        }
      );


      audio.addEventListener(
        'pause',
        function () {

          setPlayingState(false);

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

          setPlayingState(false);

          audio.currentTime =
            0;

          updateProgress();


          window.setTimeout(
            function () {

              if (
                audio.paused &&
                audio.currentTime === 0
              ) {

                player.classList.remove(
                  'is-active'
                );

              }

            },
            1000
          );

        }
      );


      /* ====================================================
         RADIAL SEEKING
      ==================================================== */

      function seekFromPointer(event) {

        if (
          !Number.isFinite(audio.duration) ||
          audio.duration <= 0
        ) {
          return;
        }


        const rect =
          progressSVG.getBoundingClientRect();


        const centerX =
          rect.left +
          (rect.width / 2);

        const centerY =
          rect.top +
          (rect.height / 2);


        const x =
          event.clientX -
          centerX;

        const y =
          event.clientY -
          centerY;


        let angle =
          Math.atan2(y, x) *
          (180 / Math.PI);


        /*
          Convert:
          right = 0°
          bottom = 90°
          left = 180°
          top = 270°

          Into:
          top = 0%
          clockwise progression
        */

        angle +=
          90;


        if (angle < 0) {
          angle += 360;
        }


        const ratio =
          angle /
          360;


        audio.currentTime =
          ratio *
          audio.duration;


        player.classList.add(
          'is-active'
        );


        updateProgress();

      }


      progressSVG.addEventListener(
        'pointerdown',
        function (event) {

          /*
            Do not interpret clicks well inside the pin
            as seek commands.

            Those belong to the play/pause button.
          */

          const rect =
            progressSVG.getBoundingClientRect();

          const centerX =
            rect.left +
            (rect.width / 2);

          const centerY =
            rect.top +
            (rect.height / 2);

          const dx =
            event.clientX -
            centerX;

          const dy =
            event.clientY -
            centerY;

          const distance =
            Math.sqrt(
              (dx * dx) +
              (dy * dy)
            );


          const radius =
            rect.width /
            2;


          /*
            Only seek in the outer radial zone.
          */

          if (
            distance <
            radius * .82
          ) {
            return;
          }


          isSeeking =
            true;


          progressSVG.setPointerCapture(
            event.pointerId
          );


          seekFromPointer(
            event
          );

        }
      );


      progressSVG.addEventListener(
        'pointermove',
        function (event) {

          if (!isSeeking) {
            return;
          }


          seekFromPointer(
            event
          );

        }
      );


      progressSVG.addEventListener(
        'pointerup',
        function (event) {

          isSeeking =
            false;


          if (
            progressSVG.hasPointerCapture(
              event.pointerId
            )
          ) {

            progressSVG.releasePointerCapture(
              event.pointerId
            );

          }

        }
      );


      progressSVG.addEventListener(
        'pointercancel',
        function () {

          isSeeking =
            false;

        }
      );


      /* ====================================================
         INITIAL STATE
      ==================================================== */

      updateProgress();

    });

  }


  /* ========================================================
     DOM READY
  ======================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initInsigniaAudioPlayers
    );

  } else {

    initInsigniaAudioPlayers();

  }

})();
