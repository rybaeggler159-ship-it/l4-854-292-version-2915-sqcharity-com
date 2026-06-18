(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function setupMobileNav() {
    var button = $('.nav-toggle');
    var menu = $('.mobile-nav');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupSearchForms() {
    $all('.site-search').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = $('input[name="q"]', form);
        var keyword = input ? input.value.trim() : '';
        var target = form.getAttribute('data-search-url') || form.getAttribute('action') || './search.html';
        var url = keyword ? target + '?q=' + encodeURIComponent(keyword) : target;
        window.location.href = url;
      });
    });
  }

  function setupHeroSlider() {
    var hero = $('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = $all('.hero-slide', hero);
    var dots = $all('.hero-dot', hero);
    if (slides.length <= 1) {
      return;
    }
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === active);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function setupLocalFilters() {
    var panels = $all('[data-filter-panel]');
    panels.forEach(function (panel) {
      var container = panel.parentElement;
      if (!container) {
        return;
      }
      var grid = $('.filter-grid', container);
      var empty = $('.empty-state', container);
      if (!grid) {
        return;
      }
      var input = $('.filter-input', panel);
      var yearSelect = $('.filter-year', panel);
      var regionSelect = $('.filter-region', panel);
      var cards = $all('.movie-card', grid);
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q') || '';
      if (input && query) {
        input.value = query;
      }

      function apply() {
        var keyword = normalize(input && input.value);
        var year = normalize(yearSelect && yearSelect.value);
        var region = normalize(regionSelect && regionSelect.value);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-type'),
            card.textContent
          ].join(' '));
          var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchYear = !year || normalize(card.getAttribute('data-year')) === year;
          var matchRegion = !region || normalize(card.getAttribute('data-region')) === region;
          var show = matchKeyword && matchYear && matchRegion;
          card.hidden = !show;
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [input, yearSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function setupPlayers() {
    $all('.js-player').forEach(function (player) {
      var video = $('.movie-video', player);
      var overlay = $('.player-overlay', player);
      var stream = player.getAttribute('data-stream');
      var attached = false;
      var hlsInstance = null;

      if (!video || !overlay || !stream) {
        return;
      }

      function attach() {
        if (attached) {
          return;
        }
        attached = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else {
          video.src = stream;
        }
      }

      function play() {
        attach();
        overlay.classList.add('is-hidden');
        video.controls = true;
        var result = video.play();
        if (result && typeof result.catch === 'function') {
          result.catch(function () {
            overlay.classList.remove('is-hidden');
          });
        }
      }

      overlay.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        overlay.classList.add('is-hidden');
      });
      video.addEventListener('error', function () {
        if (hlsInstance && hlsInstance.recoverMediaError) {
          hlsInstance.recoverMediaError();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileNav();
    setupSearchForms();
    setupHeroSlider();
    setupLocalFilters();
    setupPlayers();
  });
})();
