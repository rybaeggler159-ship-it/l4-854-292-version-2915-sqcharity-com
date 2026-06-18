import { H as Hls } from "./hls-vendor-dru42stk.js";

const querySelector = (selector, root = document) => root.querySelector(selector);
const querySelectorAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setupMobileNavigation() {
  const toggle = querySelector("[data-mobile-toggle]");
  const panel = querySelector("[data-mobile-panel]");

  if (!toggle || !panel) {
    return;
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("is-open");
  });
}

function setupHeroSlider() {
  const slider = querySelector("[data-hero-slider]");

  if (!slider) {
    return;
  }

  const slides = querySelectorAll("[data-hero-slide]", slider);
  const dots = querySelectorAll("[data-hero-dot]", slider);
  let currentIndex = 0;
  let timer = null;

  const activate = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  };

  const start = () => {
    timer = window.setInterval(() => activate(currentIndex + 1), 5200);
  };

  const restart = () => {
    window.clearInterval(timer);
    start();
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      activate(Number(dot.dataset.heroDot || "0"));
      restart();
    });
  });

  activate(0);
  start();
}

function setupCardFiltering() {
  const input = querySelector("[data-filter-input]");
  const grid = querySelector("[data-card-grid]");
  const count = querySelector("[data-result-count]");
  const yearSelect = querySelector("[data-year-select]");

  if (!input || !grid) {
    return;
  }

  const cards = querySelectorAll("[data-card]", grid);
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = "没有找到匹配的内容";

  const apply = () => {
    const keyword = input.value.trim().toLowerCase();
    const selectedYear = yearSelect ? yearSelect.value : "";
    let visible = 0;

    cards.forEach((card) => {
      const haystack = (card.dataset.search || "").toLowerCase();
      const year = card.dataset.year || "";
      const matchedKeyword = !keyword || haystack.includes(keyword);
      const matchedYear = !selectedYear || year === selectedYear;
      const shouldShow = matchedKeyword && matchedYear;

      card.classList.toggle("is-hidden-card", !shouldShow);
      if (shouldShow) {
        visible += 1;
      }
    });

    if (count) {
      count.textContent = `${visible} 部`;
    }

    if (visible === 0 && !empty.parentNode) {
      grid.appendChild(empty);
    }

    if (visible > 0 && empty.parentNode) {
      empty.remove();
    }
  };

  input.addEventListener("input", apply);
  if (yearSelect) {
    yearSelect.addEventListener("change", apply);
  }
  apply();
}

function setupSearchPage() {
  const results = querySelector("#search-results");
  const input = querySelector("#search-query");
  const title = querySelector("[data-search-title]");
  const count = querySelector("[data-search-count]");

  if (!results || !input || !window.SEARCH_MOVIES) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const keyword = (params.get("q") || "").trim();
  input.value = keyword;

  const normalize = (value) => String(value || "").toLowerCase();
  const movies = window.SEARCH_MOVIES;
  const matched = keyword
    ? movies.filter((movie) => normalize(movie.search).includes(normalize(keyword))).slice(0, 120)
    : movies.slice(0, 24);

  if (title) {
    title.textContent = keyword ? `“${keyword}”的搜索结果` : "精选内容";
  }

  if (count) {
    count.textContent = keyword ? `找到 ${matched.length} 部相关内容` : `共 ${movies.length} 部内容可检索`;
  }

  results.innerHTML = matched.length
    ? matched.map(renderSearchCard).join("")
    : '<div class="empty-state">没有找到匹配的内容</div>';
}

function renderSearchCard(movie) {
  const tags = movie.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  return `
        <a class="video-card" href="${movie.url}" data-card data-search="${escapeHtml(movie.search)}" data-year="${escapeHtml(movie.year)}">
          <span class="poster-wrap">
            <img src="./${movie.image}.jpg" alt="${escapeHtml(movie.title)}" loading="lazy">
            <span class="card-badge">${escapeHtml(movie.type)}</span>
            <span class="card-score">${escapeHtml(movie.score)}</span>
          </span>
          <span class="card-body">
            <strong>${escapeHtml(movie.title)}</strong>
            <em>${escapeHtml(movie.oneLine)}</em>
            <span class="card-tags">${tags}</span>
            <span class="card-meta">
              <span>${escapeHtml(movie.year)}</span>
              <span>${escapeHtml(movie.region)}</span>
              <span>${escapeHtml(movie.duration)}</span>
            </span>
          </span>
        </a>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupPlayer() {
  const video = querySelector("[data-video-player]");
  const playButton = querySelector("[data-play-button]");
  const playControl = querySelector("[data-control-play]");
  const muteControl = querySelector("[data-control-mute]");
  const status = querySelector("[data-player-status]");

  if (!video) {
    return;
  }

  const source = video.dataset.src;
  let hls = null;
  let initialized = false;

  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const initialize = () => {
    if (initialized || !source) {
      return;
    }

    initialized = true;
    setStatus("加载中");

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStatus("可以播放"));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStatus("网络重试中");
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setStatus("媒体恢复中");
          hls.recoverMediaError();
          return;
        }

        setStatus("播放异常");
      });
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.addEventListener("loadedmetadata", () => setStatus("可以播放"), { once: true });
      return;
    }

    video.src = source;
    setStatus("尝试播放");
  };

  const togglePlay = async () => {
    initialize();

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (_error) {
      setStatus("请再次点击播放");
    }
  };

  const toggleMute = () => {
    video.muted = !video.muted;
    if (muteControl) {
      muteControl.textContent = video.muted ? "取消静音" : "静音切换";
    }
  };

  if (playButton) {
    playButton.addEventListener("click", togglePlay);
  }

  if (playControl) {
    playControl.addEventListener("click", togglePlay);
  }

  if (muteControl) {
    muteControl.addEventListener("click", toggleMute);
  }

  video.addEventListener("click", togglePlay);
  video.addEventListener("play", () => {
    setStatus("播放中");
    if (playButton) {
      playButton.classList.add("is-hidden");
    }
  });
  video.addEventListener("pause", () => {
    setStatus("已暂停");
    if (playButton) {
      playButton.classList.remove("is-hidden");
    }
  });
  video.addEventListener("waiting", () => setStatus("缓冲中"));
  video.addEventListener("playing", () => setStatus("播放中"));

  window.addEventListener("beforeunload", () => {
    if (hls) {
      hls.destroy();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNavigation();
  setupHeroSlider();
  setupCardFiltering();
  setupSearchPage();
  setupPlayer();
});
