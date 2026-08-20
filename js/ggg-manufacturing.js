(function () {

  /* ========================================================
     GGG MANUFACTURING ENGINE v2
     Reliable DOM registry + compact SVG process library
  ======================================================== */


  /* ========================================================
     PROCESS REGISTRY
  ======================================================== */

  const PROCESS_MAP = [

    {
      selector:
        '.entry-title, .ggg-page-title, .ggg-document-title',
      process:
        'letterpress'
    },

    {
      selector:
        '.ggg-record-id, .ggg-record__id, .ggg-index-id',
      process:
        'offset'
    },

    {
      selector:
        '.ggg-dateline, .ggg-byline, .ggg-record-type',
      process:
        'typewriter'
    },

    {
      selector:
        '.ggg-status-stamp, .ggg-stamp',
      process:
        'stamp'
    }

  ];


  /* ========================================================
     SVG PROCESS LIBRARY
     Keep SVG focused on actual physical distortion only.
  ======================================================== */

  const svgMarkup = `
  <svg
    aria-hidden="true"
    width="0"
    height="0"
    style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;"
  >
    <defs>

      <filter
        id="ggg-process-letterpress"
        x="-15%"
        y="-20%"
        width="130%"
        height="140%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".018 .38"
          numOctaves="2"
          seed="17"
          result="grain"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="grain"
          scale=".72"
          xChannelSelector="R"
          yChannelSelector="G"
          result="distorted"
        />

        <feMorphology
          in="SourceAlpha"
          operator="dilate"
          radius=".22"
          result="gain"
        />

        <feGaussianBlur
          in="gain"
          stdDeviation=".10"
          result="gainSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".13"
          result="gainColor"
        />

        <feComposite
          in="gainColor"
          in2="gainSoft"
          operator="in"
          result="inkGain"
        />

        <feMerge>
          <feMergeNode in="inkGain"/>
          <feMergeNode in="distorted"/>
        </feMerge>

      </filter>


      <filter
        id="ggg-process-offset"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        color-interpolation-filters="sRGB"
      >

        <feOffset
          in="SourceAlpha"
          dx=".28"
          dy=".05"
          result="registration"
        />

        <feGaussianBlur
          in="registration"
          stdDeviation=".08"
          result="registrationSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".08"
          result="registrationInk"
        />

        <feComposite
          in="registrationInk"
          in2="registrationSoft"
          operator="in"
          result="ghost"
        />

        <feMerge>
          <feMergeNode in="ghost"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>

      </filter>


      <filter
        id="ggg-process-typewriter"
        x="-15%"
        y="-15%"
        width="130%"
        height="130%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".030 .62"
          numOctaves="1"
          seed="23"
          result="ribbon"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="ribbon"
          scale=".34"
        />

      </filter>


      <filter
        id="ggg-process-stamp"
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
        color-interpolation-filters="sRGB"
      >

        <feTurbulence
          type="fractalNoise"
          baseFrequency=".050 .46"
          numOctaves="3"
          seed="77"
          result="stampNoise"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="stampNoise"
          scale="1.65"
          xChannelSelector="R"
          yChannelSelector="G"
          result="distorted"
        />

        <feMorphology
          in="SourceAlpha"
          operator="dilate"
          radius=".42"
          result="gain"
        />

        <feGaussianBlur
          in="gain"
          stdDeviation=".18"
          result="gainSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".18"
          result="gainColor"
        />

        <feComposite
          in="gainColor"
          in2="gainSoft"
          operator="in"
          result="inkGain"
        />

        <feOffset
          in="SourceAlpha"
          dx=".75"
          dy=".10"
          result="drag"
        />

        <feGaussianBlur
          in="drag"
          stdDeviation=".24"
          result="dragSoft"
        />

        <feFlood
          flood-color="#241A12"
          flood-opacity=".08"
          result="dragInk"
        />

        <feComposite
          in="dragInk"
          in2="dragSoft"
          operator="in"
          result="smear"
        />

        <feMerge>
          <feMergeNode in="inkGain"/>
          <feMergeNode in="smear"/>
          <feMergeNode in="distorted"/>
        </feMerge>

      </filter>

    </defs>
  </svg>
  `;


  /* ========================================================
     REGISTER ONE PROCESS
  ======================================================== */

  function registerProcess(
    selector,
    process
  ) {

    document
      .querySelectorAll(selector)
      .forEach(function (element) {

        element.classList.add(
          'ggg-process',
          'ggg-process-' + process
        );

        element.setAttribute(
          'data-ggg-process',
          process
        );

        element.setAttribute(
          'data-ggg-print-text',
          String(element.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
        );

      });

  }


  /* ========================================================
     INITIALIZE
  ======================================================== */

  function initGGGManufacturing() {

    if (
      document.documentElement.dataset.gggManufacturingV2 ===
      'true'
    ) {
      return;
    }


    document.documentElement.dataset.gggManufacturingV2 =
      'true';


    document.body.insertAdjacentHTML(
      'beforeend',
      svgMarkup
    );


    PROCESS_MAP.forEach(function (entry) {

      registerProcess(
        entry.selector,
        entry.process
      );

    });


    document.documentElement.classList.add(
      'ggg-loaded'
    );


    console.log(
      'GGG MANUFACTURING v2: READY'
    );

    console.log(
      'GGG EXTERNAL JS: LOADED'
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
      initGGGManufacturing,
      {
        once: true
      }
    );

  } else {

    initGGGManufacturing();

  }

})();
