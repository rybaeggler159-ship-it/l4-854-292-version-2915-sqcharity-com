(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clean(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initNavigation() {
    var toggle = qs(".nav-toggle");
    var nav = qs(".site-nav");

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var expanded = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  function initHero() {
    var root = qs("[data-hero]");

    if (!root) {
      return;
    }

    var slides = qsa(".hero-slide", root);
    var dots = qsa(".hero-dot", root);
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle("active", current === index);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle("active", current === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-index") || 0));
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    qsa("[data-filter-root]").forEach(function (root) {
      var textInput = qs("[data-filter-input]", root);
      var categoryInput = qs("[data-filter-category]", root);
      var yearInput = qs("[data-filter-year]", root);
      var cards = qsa(".filter-card", root);
      var empty = qs("[data-empty-state]", root);
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";

      if (textInput && query) {
        textInput.value = query;
      }

      function apply() {
        var text = clean(textInput && textInput.value);
        var category = clean(categoryInput && categoryInput.value);
        var year = clean(yearInput && yearInput.value);
        var shown = 0;

        cards.forEach(function (card) {
          var haystack = clean([
            card.getAttribute("data-title"),
            card.getAttribute("data-category"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags")
          ].join(" "));
          var matchText = !text || haystack.indexOf(text) !== -1;
          var matchCategory = !category || clean(card.getAttribute("data-category")) === category;
          var matchYear = !year || clean(card.getAttribute("data-year")) === year;
          var visible = matchText && matchCategory && matchYear;

          card.classList.toggle("is-hidden", !visible);

          if (visible) {
            shown += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("visible", shown === 0);
        }
      }

      [textInput, categoryInput, yearInput].forEach(function (input) {
        if (input) {
          input.addEventListener("input", apply);
          input.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function initPlayers() {
    qsa(".player-shell").forEach(function (shell) {
      var video = qs("video", shell);
      var cover = qs(".player-cover", shell);
      var stream = shell.getAttribute("data-stream");
      var hls = null;
      var loaded = false;

      if (!video || !cover || !stream) {
        return;
      }

      function load() {
        if (loaded) {
          return;
        }

        loaded = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          video.load();
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          return;
        }

        video.src = stream;
        video.load();
      }

      function play() {
        load();
        cover.classList.add("is-hidden");
        video.controls = true;
        var attempt = video.play();

        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(function () {
            cover.classList.remove("is-hidden");
          });
        }
      }

      cover.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener("play", function () {
        cover.classList.add("is-hidden");
      });
      video.addEventListener("ended", function () {
        cover.classList.remove("is-hidden");
      });
      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavigation();
    initHero();
    initFilters();
    initPlayers();
  });
})();
