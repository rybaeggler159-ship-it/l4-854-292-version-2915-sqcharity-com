(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        if (slides.length < 2) {
            return;
        }
        var current = slides.findIndex(function (slide) {
            return slide.classList.contains("is-active");
        });
        if (current < 0) {
            current = 0;
        }
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
        }
        var next = document.querySelector("[data-hero-next]");
        var prev = document.querySelector("[data-hero-prev]");
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
            });
        }
        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
            });
        }
        window.setInterval(function () {
            show(current + 1);
        }, 5000);
    }

    function setupFilters() {
        var sections = Array.prototype.slice.call(document.querySelectorAll("[data-filter-section]"));
        sections.forEach(function (section) {
            var form = section.querySelector("[data-filter-form]");
            var keyword = section.querySelector("[data-filter-keyword]");
            var year = section.querySelector("[data-filter-year]");
            var type = section.querySelector("[data-filter-type]");
            var cards = Array.prototype.slice.call(section.querySelectorAll("[data-filter-card]"));
            var empty = section.querySelector("[data-empty-note]");
            if (!form || cards.length === 0) {
                return;
            }
            function apply() {
                var q = keyword ? keyword.value.trim().toLowerCase() : "";
                var y = year ? year.value : "";
                var t = type ? type.value : "";
                var visible = 0;
                cards.forEach(function (card) {
                    var text = [
                        card.getAttribute("data-title") || "",
                        card.getAttribute("data-tags") || "",
                        card.getAttribute("data-region") || "",
                        card.getAttribute("data-type") || "",
                        card.getAttribute("data-year") || ""
                    ].join(" ").toLowerCase();
                    var matchKeyword = !q || text.indexOf(q) !== -1;
                    var matchYear = !y || card.getAttribute("data-year") === y;
                    var matchType = !t || card.getAttribute("data-type") === t;
                    var show = matchKeyword && matchYear && matchType;
                    card.style.display = show ? "" : "none";
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }
            [keyword, year, type].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
        });
    }

    function createMovieCard(movie) {
        var article = document.createElement("article");
        article.className = "movie-card";
        var link = document.createElement("a");
        link.className = "movie-card-link";
        link.href = movie.href;
        var cover = document.createElement("div");
        cover.className = "card-cover";
        var image = document.createElement("img");
        image.src = "./" + movie.cover;
        image.alt = movie.title;
        image.loading = "lazy";
        var overlay = document.createElement("div");
        overlay.className = "card-overlay";
        var mark = document.createElement("span");
        mark.className = "play-mark";
        mark.textContent = "▶";
        var watch = document.createElement("span");
        watch.textContent = "立即观看";
        overlay.appendChild(mark);
        overlay.appendChild(watch);
        cover.appendChild(image);
        cover.appendChild(overlay);
        var body = document.createElement("div");
        body.className = "card-body";
        var eyebrow = document.createElement("div");
        eyebrow.className = "card-eyebrow";
        eyebrow.textContent = [movie.region, movie.type, movie.year].filter(Boolean).join(" · ");
        var title = document.createElement("h3");
        title.textContent = movie.title;
        var summary = document.createElement("p");
        summary.textContent = movie.oneLine || movie.summary || "";
        var tags = document.createElement("div");
        tags.className = "card-tags";
        [movie.genre, movie.category].filter(Boolean).slice(0, 2).forEach(function (name) {
            var span = document.createElement("span");
            span.textContent = name;
            tags.appendChild(span);
        });
        body.appendChild(eyebrow);
        body.appendChild(title);
        body.appendChild(summary);
        body.appendChild(tags);
        link.appendChild(cover);
        link.appendChild(body);
        article.appendChild(link);
        return article;
    }

    function setupSearchPage() {
        var page = document.querySelector("[data-search-page]");
        var results = document.querySelector("[data-search-results]");
        var empty = document.querySelector("[data-search-empty]");
        var input = document.querySelector("[data-search-input]");
        var button = document.querySelector("[data-search-button]");
        if (!page || !results || !Array.isArray(window.MOVIES)) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        if (input) {
            input.value = initial;
        }
        function render() {
            var q = input ? input.value.trim().toLowerCase() : "";
            var matches = window.MOVIES.filter(function (movie) {
                if (!q) {
                    return true;
                }
                var text = [
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(" "),
                    movie.oneLine,
                    movie.summary
                ].join(" ").toLowerCase();
                return text.indexOf(q) !== -1;
            }).slice(0, q ? 120 : 36);
            results.innerHTML = "";
            matches.forEach(function (movie) {
                results.appendChild(createMovieCard(movie));
            });
            if (empty) {
                empty.classList.toggle("is-visible", matches.length === 0);
            }
        }
        if (input) {
            input.addEventListener("input", render);
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    render();
                }
            });
        }
        if (button) {
            button.addEventListener("click", render);
        }
        render();
    }

    function setupPlayer() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        panels.forEach(function (panel) {
            var video = panel.querySelector("video");
            var cover = panel.querySelector("[data-play-cover]");
            var status = panel.querySelector("[data-player-status]");
            if (!video) {
                return;
            }
            var stream = video.getAttribute("data-stream");
            if (!stream) {
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal && status) {
                        status.textContent = "播放加载失败，请稍后重试。";
                    }
                });
            } else {
                video.src = stream;
            }
            function play() {
                if (cover) {
                    cover.classList.add("is-hidden");
                }
                if (status) {
                    status.textContent = "";
                }
                var attempt = video.play();
                if (attempt && typeof attempt.catch === "function") {
                    attempt.catch(function () {
                        if (status) {
                            status.textContent = "点击视频区域继续播放。";
                        }
                    });
                }
            }
            if (cover) {
                cover.addEventListener("click", play);
            }
            video.addEventListener("play", function () {
                if (cover) {
                    cover.classList.add("is-hidden");
                }
            });
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupSearchPage();
        setupPlayer();
    });
})();
