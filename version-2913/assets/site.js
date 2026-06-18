(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  var carousel = document.querySelector('[data-hero-carousel]');

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dot'));
    var previous = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide')) || 0);
        restart();
      });
    });

    if (previous) {
      previous.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    restart();
  }

  function normalize(text) {
    return String(text || '').trim().toLowerCase();
  }

  function applyFilter(root, text, category) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card'));
    var value = normalize(text);
    var selected = category || 'all';

    cards.forEach(function (card) {
      var content = normalize(card.getAttribute('data-search'));
      var cardCategory = card.getAttribute('data-category') || '';
      var matchedText = !value || content.indexOf(value) !== -1;
      var matchedCategory = selected === 'all' || cardCategory === selected;
      card.classList.toggle('is-filtered-out', !(matchedText && matchedCategory));
    });
  }

  var searchInput = document.getElementById('siteSearch');
  var lists = Array.prototype.slice.call(document.querySelectorAll('.searchable-list'));
  var activeCategory = 'all';

  if (searchInput && lists.length) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    searchInput.value = query;
    lists.forEach(function (list) {
      applyFilter(list, query, activeCategory);
    });

    searchInput.addEventListener('input', function () {
      lists.forEach(function (list) {
        applyFilter(list, searchInput.value, activeCategory);
      });
    });
  }

  var inlineInputs = Array.prototype.slice.call(document.querySelectorAll('.inline-filter'));

  inlineInputs.forEach(function (input) {
    var section = input.closest('.filter-section') || document;
    var list = section.querySelector('.searchable-list');

    if (!list) {
      return;
    }

    input.addEventListener('input', function () {
      applyFilter(list, input.value, 'all');
    });
  });

  var filterChips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));

  filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filterChips.forEach(function (item) {
        item.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      activeCategory = chip.getAttribute('data-filter-category') || 'all';
      lists.forEach(function (list) {
        applyFilter(list, searchInput ? searchInput.value : '', activeCategory);
      });
    });
  });

  function preparePlayer(shell) {
    var video = shell.querySelector('video');
    var cover = shell.querySelector('.player-cover');
    var stream = shell.getAttribute('data-player-stream');
    var hlsInstance = null;

    if (!video || !stream) {
      return;
    }

    function loadAndPlay() {
      if (!video.dataset.ready) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else {
          video.src = stream;
        }
        video.dataset.ready = 'true';
      }

      if (cover) {
        cover.classList.add('is-hidden');
      }

      var started = video.play();

      if (started && typeof started.catch === 'function') {
        started.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', loadAndPlay);
    }

    video.addEventListener('click', function () {
      if (!video.dataset.ready || video.paused) {
        loadAndPlay();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('.player-shell')).forEach(preparePlayer);
})();
