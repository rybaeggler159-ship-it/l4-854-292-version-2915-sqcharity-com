import { H as Hls } from "./video-vendor-dru42stk.js";

function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function initMobileMenu() {
  const button = document.querySelector("[data-mobile-menu-button]");
  const menu = document.querySelector("[data-mobile-menu]");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
}

function getCardText(card) {
  return [
    card.dataset.title,
    card.dataset.year,
    card.dataset.region,
    card.dataset.genre
  ].join(" ").toLowerCase();
}

function initLocalFilters() {
  const input = document.querySelector("[data-filter-input]");
  const select = document.querySelector("[data-sort-select]");
  const grid = document.querySelector("[data-card-grid]");

  if (!grid || (!input && !select)) {
    return;
  }

  const cards = Array.from(grid.querySelectorAll("[data-card]"));

  function sortCards(list) {
    const value = select ? select.value : "default";
    const sorted = [...list];

    if (value === "rating") {
      sorted.sort((a, b) => Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0));
    }

    if (value === "views") {
      sorted.sort((a, b) => Number(b.dataset.views || 0) - Number(a.dataset.views || 0));
    }

    if (value === "date") {
      sorted.sort((a, b) => String(b.dataset.date || "").localeCompare(String(a.dataset.date || "")));
    }

    if (value === "year") {
      sorted.sort((a, b) => Number(b.dataset.year || 0) - Number(a.dataset.year || 0));
    }

    return sorted;
  }

  function render() {
    const keyword = input ? input.value.trim().toLowerCase() : "";
    const filtered = cards.filter((card) => !keyword || getCardText(card).includes(keyword));

    cards.forEach((card) => {
      card.hidden = true;
    });

    sortCards(filtered).forEach((card) => {
      card.hidden = false;
      grid.appendChild(card);
    });
  }

  if (input) {
    input.addEventListener("input", render);
  }

  if (select) {
    select.addEventListener("change", render);
  }
}

function createMovieCard(movie) {
  const tags = (movie.tags || [])
    .slice(0, 3)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="video-card" data-card data-title="${escapeHtml(movie.title)}" data-year="${escapeHtml(movie.year)}" data-region="${escapeHtml(movie.region)}" data-genre="${escapeHtml(movie.genre)}" data-views="${movie.views}" data-rating="${movie.rating}" data-date="${escapeHtml(movie.date)}">
      <a href="${movie.link}" class="video-link" aria-label="观看${escapeHtml(movie.title)}">
        <div class="video-cover" style="background-image: url('${movie.cover}');">
          <span class="cover-badge">${escapeHtml(movie.category)}</span>
          <span class="cover-duration">高清</span>
          <span class="cover-play">▶</span>
        </div>
        <div class="video-body">
          <h3>${escapeHtml(movie.title)}</h3>
          <p>${escapeHtml(movie.oneLine)}</p>
          <div class="video-meta">
            <span>${escapeHtml(movie.year)}</span>
            <span>${escapeHtml(movie.region)}</span>
            <span>${escapeHtml(movie.type)}</span>
          </div>
          <div class="tag-row">${tags}</div>
        </div>
      </a>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initGlobalSearch() {
  const root = document.querySelector("[data-search-page]");

  if (!root || !window.MOVIE_DATA) {
    return;
  }

  const input = root.querySelector("[data-global-search-input]");
  const select = root.querySelector("[data-global-type-select]");
  const results = root.querySelector("[data-search-results]");
  const status = root.querySelector("[data-search-status]");
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";

  if (input) {
    input.value = initialQuery;
  }

  function render() {
    const keyword = input ? input.value.trim().toLowerCase() : "";
    const typeFilter = select ? select.value : "";
    const items = window.MOVIE_DATA.filter((movie) => {
      const haystack = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.category,
        ...(movie.tags || [])
      ].join(" ").toLowerCase();
      const matchKeyword = !keyword || haystack.includes(keyword);
      const matchType = !typeFilter || String(movie.type || "").includes(typeFilter);
      return matchKeyword && matchType;
    }).slice(0, 120);

    if (status) {
      status.textContent = keyword || typeFilter
        ? `找到 ${items.length} 条相关内容（最多显示 120 条）`
        : "热门内容推荐";
    }

    if (results) {
      results.innerHTML = items.map(createMovieCard).join("");
    }
  }

  if (input) {
    input.addEventListener("input", render);
  }

  if (select) {
    select.addEventListener("change", render);
  }

  if (initialQuery) {
    render();
  }
}

function initPlayers() {
  document.querySelectorAll("[data-player]").forEach((player) => {
    const video = player.querySelector("video");
    const button = player.querySelector("[data-player-start]");
    const message = player.querySelector("[data-player-message]");
    const source = player.dataset.hls;
    let hls = null;
    let initialized = false;

    if (!video || !button || !source) {
      return;
    }

    function setMessage(text) {
      if (message) {
        message.textContent = text;
      }
    }

    async function start() {
      if (!initialized) {
        initialized = true;
        setMessage("正在初始化高清播放源…");

        if (Hls && Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setMessage("");
            video.play().catch(() => {
              setMessage("请再次点击播放按钮启动视频。");
            });
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data && data.fatal) {
              setMessage("播放源暂时无法连接，请刷新页面后重试。");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          setMessage("");
          await video.play();
        } else {
          setMessage("当前浏览器不支持 HLS 播放。");
          return;
        }
      } else {
        await video.play();
      }

      player.classList.add("is-playing");
    }

    button.addEventListener("click", () => {
      start().catch(() => {
        setMessage("播放启动失败，请稍后重试。");
      });
    });

    video.addEventListener("play", () => {
      player.classList.add("is-playing");
    });

    window.addEventListener("beforeunload", () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

ready(() => {
  initMobileMenu();
  initLocalFilters();
  initGlobalSearch();
  initPlayers();
});
