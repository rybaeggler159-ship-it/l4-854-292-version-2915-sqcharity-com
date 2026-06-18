(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMobileMenu() {
    var toggle = qs('[data-mobile-toggle]');
    var nav = qs('[data-mobile-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
  }

  function setupSearchForms() {
    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('input', form);
        var query = input ? input.value.trim() : '';
        if (!query) return;
        var base = form.getAttribute('data-search-base') || 'search.html';
        window.location.href = base + '?q=' + encodeURIComponent(query);
      });
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) return;
    var slides = qsa('.hero-slide', hero);
    var dots = qsa('.hero-dot', hero);
    var progress = qs('.hero-progress span', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      if (progress) {
        progress.style.width = ((index + 1) / slides.length * 100) + '%';
      }
    }

    function next() {
      show(index + 1);
    }

    function start() {
      stop();
      timer = window.setInterval(next, 5000);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    var prevButton = qs('[data-hero-prev]', hero);
    var nextButton = qs('[data-hero-next]', hero);
    if (prevButton) {
      prevButton.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupLocalFilter() {
    qsa('[data-filter-scope]').forEach(function (scope) {
      var input = qs('[data-page-filter]', scope);
      var grid = qs('[data-card-grid]', scope);
      var empty = qs('[data-empty-state]', scope);
      if (!grid) return;
      var cards = qsa('[data-movie-card]', grid);

      function applyFilter() {
        var value = normalize(input ? input.value : '');
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalize(card.getAttribute('data-title') + ' ' + card.getAttribute('data-genre') + ' ' + card.getAttribute('data-tags'));
          var matched = !value || text.indexOf(value) !== -1;
          card.style.display = matched ? '' : 'none';
          if (matched) visible += 1;
        });
        if (empty) empty.style.display = visible ? 'none' : 'block';
      }

      if (input) input.addEventListener('input', applyFilter);
      qsa('[data-sort]', scope).forEach(function (button) {
        button.addEventListener('click', function () {
          qsa('[data-sort]', scope).forEach(function (item) {
            item.classList.remove('active');
          });
          button.classList.add('active');
          var mode = button.getAttribute('data-sort');
          var sorted = cards.slice().sort(function (a, b) {
            if (mode === 'latest') return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
            if (mode === 'hot') return Number(b.getAttribute('data-hot')) - Number(a.getAttribute('data-hot'));
            return Math.random() - 0.5;
          });
          sorted.forEach(function (card) {
            grid.appendChild(card);
          });
          applyFilter();
        });
      });
      applyFilter();
    });
  }

  function cardTemplate(movie) {
    return [
      '<article class="movie-card" data-movie-card data-title="' + escapeHtml(movie.title) + '" data-genre="' + escapeHtml(movie.genre) + '" data-tags="' + escapeHtml((movie.tags || []).join(' ')) + '" data-year="' + escapeHtml(movie.year) + '" data-hot="' + escapeHtml(movie.hot || 0) + '">',
      '  <a class="poster-link" href="' + escapeHtml(movie.url) + '">',
      '    <img src="' + escapeHtml(movie.image) + '" alt="' + escapeHtml(movie.title) + '">',
      '    <span class="poster-label">' + escapeHtml(movie.category) + '</span>',
      '    <span class="poster-play"><span>▶</span></span>',
      '  </a>',
      '  <div class="card-body">',
      '    <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSearchPage() {
    var root = qs('[data-search-page]');
    if (!root || !window.MOVIE_SEARCH_DATA) return;
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var input = qs('[data-search-input]', root);
    var title = qs('[data-search-title]', root);
    var results = qs('[data-search-results]', root);
    var empty = qs('[data-search-empty]', root);
    if (input) input.value = query;

    function render(value) {
      var key = normalize(value);
      if (title) title.textContent = key ? '搜索结果：' + value : '影片搜索';
      var list = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var text = normalize([movie.title, movie.region, movie.type, movie.genre, (movie.tags || []).join(' '), movie.oneLine].join(' '));
        return !key || text.indexOf(key) !== -1;
      }).slice(0, 120);
      if (results) results.innerHTML = list.map(cardTemplate).join('');
      if (empty) empty.style.display = list.length ? 'none' : 'block';
    }

    var form = qs('[data-search-page-form]', root);
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = input ? input.value.trim() : '';
        var url = value ? 'search.html?q=' + encodeURIComponent(value) : 'search.html';
        window.history.replaceState(null, '', url);
        render(value);
      });
    }
    render(query);
  }

  window.initMoviePlayer = function (source) {
    var video = document.getElementById('videoPlayer');
    var overlay = document.getElementById('playOverlay');
    if (!video || !source) return;
    var ready = false;
    var hls = null;

    function load() {
      if (!ready) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
        ready = true;
      }
      if (overlay) overlay.classList.add('hidden');
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (overlay) overlay.addEventListener('click', load);
    video.addEventListener('click', function () {
      if (!ready || video.paused) load();
    });
    window.addEventListener('beforeunload', function () {
      if (hls) hls.destroy();
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupSearchForms();
    setupHero();
    setupLocalFilter();
    setupSearchPage();
  });
})();
