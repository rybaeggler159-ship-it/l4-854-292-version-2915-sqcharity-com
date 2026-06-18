(function() {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const menuButton = document.querySelector('[data-menu-toggle]');
  const siteNav = document.querySelector('.site-nav');
  if (menuButton && siteNav) {
    menuButton.addEventListener('click', function() {
      siteNav.classList.toggle('is-open');
    });
  }

  const carousel = document.querySelector('[data-hero-carousel]');
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function() {
        showSlide(current + 1);
      }, 5200);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        showSlide(index);
        startTimer();
      });
    });
    if (prev) {
      prev.addEventListener('click', function() {
        showSlide(current - 1);
        startTimer();
      });
    }
    if (next) {
      next.addEventListener('click', function() {
        showSlide(current + 1);
        startTimer();
      });
    }
    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    startTimer();
  }

  const globalSearch = document.querySelector('[data-site-search]');
  const searchPanel = document.querySelector('[data-search-panel]');
  if (globalSearch && searchPanel && Array.isArray(window.siteSearchData)) {
    globalSearch.addEventListener('input', function() {
      const query = globalSearch.value.trim().toLowerCase();
      if (!query) {
        searchPanel.classList.remove('is-open');
        searchPanel.innerHTML = '';
        return;
      }
      const results = window.siteSearchData
        .filter(function(item) {
          return item.keywords.indexOf(query) !== -1;
        })
        .slice(0, 10);
      if (!results.length) {
        searchPanel.innerHTML = '<span class="search-result">没有找到匹配内容</span>';
        searchPanel.classList.add('is-open');
        return;
      }
      searchPanel.innerHTML = results.map(function(item) {
        return '<a class="search-result" href="./' + escapeHtml(item.url) + '"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.meta) + '</small></a>';
      }).join('');
      searchPanel.classList.add('is-open');
    });
    document.addEventListener('click', function(event) {
      if (!searchPanel.contains(event.target) && event.target !== globalSearch) {
        searchPanel.classList.remove('is-open');
      }
    });
  }

  const cardList = document.querySelector('[data-card-list]');
  if (cardList) {
    const cards = Array.from(cardList.querySelectorAll('[data-movie-card]'));
    const keywordInput = document.querySelector('[data-card-search]');
    const typeFilter = document.querySelector('[data-filter-select="type"]');
    const yearFilter = document.querySelector('[data-filter-select="year"]');
    const emptyState = document.querySelector('[data-empty-state]');

    function matches(card, keyword, typeValue, yearValue) {
      const text = [
        card.dataset.title || '',
        card.dataset.region || '',
        card.dataset.type || '',
        card.dataset.genre || '',
        card.dataset.year || ''
      ].join(' ').toLowerCase();
      const keywordOk = !keyword || text.indexOf(keyword) !== -1;
      const typeOk = !typeValue || (card.dataset.type || '').indexOf(typeValue) !== -1;
      const yearOk = !yearValue || (card.dataset.year || '') === yearValue;
      return keywordOk && typeOk && yearOk;
    }

    function applyFilter() {
      const keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : '';
      const typeValue = typeFilter ? typeFilter.value : '';
      const yearValue = yearFilter ? yearFilter.value : '';
      let visible = 0;
      cards.forEach(function(card) {
        const ok = matches(card, keyword, typeValue, yearValue);
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle('is-visible', visible === 0);
      }
    }

    [keywordInput, typeFilter, yearFilter].forEach(function(control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
  }
}());
