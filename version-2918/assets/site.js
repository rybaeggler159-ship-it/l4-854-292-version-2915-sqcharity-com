(function () {
    "use strict";

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var button = qs("[data-menu-button]");
        var panel = qs("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
            button.textContent = panel.classList.contains("is-open") ? "×" : "☰";
        });
    }

    function setupHeaderSearch() {
        qsa("[data-site-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = qs("input[name='q']", form);
                var query = input ? input.value.trim() : "";
                var url = form.getAttribute("data-search-url") || "search.html";
                window.location.href = query ? url + "?q=" + encodeURIComponent(query) : url;
            });
        });
    }

    function setupHero() {
        var carousel = qs("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = qsa("[data-hero-slide]", carousel);
        var dots = qsa("[data-hero-dot]", carousel);
        var prev = qs("[data-hero-prev]", carousel);
        var next = qs("[data-hero-next]", carousel);
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                restart();
            });
        }

        restart();
    }

    function setupLocalFilter() {
        qsa("[data-filter-panel]").forEach(function (panel) {
            var section = panel.closest(".content-section") || document;
            var input = qs("[data-filter-input]", panel);
            var region = qs("[data-filter-region]", panel);
            var type = qs("[data-filter-type]", panel);
            var cards = qsa(".movie-card", section);
            var count = qs("[data-filter-count]", panel);
            var emptyTip = qs("[data-empty-tip]", section);

            function valueOf(element) {
                return element ? element.value.trim().toLowerCase() : "";
            }

            function update() {
                var keyword = valueOf(input);
                var regionValue = valueOf(region);
                var typeValue = valueOf(type);
                var visible = 0;

                cards.forEach(function (card) {
                    var text = [
                        card.getAttribute("data-title"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-genre"),
                        card.getAttribute("data-category")
                    ].join(" ").toLowerCase();

                    var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
                    var matchesRegion = !regionValue || (card.getAttribute("data-region") || "").toLowerCase().indexOf(regionValue) !== -1;
                    var matchesType = !typeValue || (card.getAttribute("data-type") || "").toLowerCase().indexOf(typeValue) !== -1;
                    var isVisible = matchesKeyword && matchesRegion && matchesType;

                    card.style.display = isVisible ? "" : "none";
                    if (isVisible) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = "当前显示 " + visible + " / " + cards.length + " 部";
                }
                if (emptyTip) {
                    emptyTip.classList.toggle("is-visible", visible === 0);
                }
            }

            [input, region, type].forEach(function (element) {
                if (element) {
                    element.addEventListener("input", update);
                    element.addEventListener("change", update);
                }
            });

            update();
        });
    }

    function movieCardTemplate(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");

        return [
            "<article class='movie-card compact-card'>",
            "<a class='poster-link' href='" + movie.url + "'>",
            "<img src='" + movie.thumbnail + "' alt='" + escapeHtml(movie.title) + " 海报' loading='lazy'>",
            "<span class='poster-shade'></span>",
            "<span class='card-score'>" + movie.score + "</span>",
            "<span class='play-mark'>▶</span>",
            "</a>",
            "<div class='card-body'>",
            "<a class='card-title' href='" + movie.url + "'>" + escapeHtml(movie.title) + "</a>",
            "<p class='card-desc'>" + escapeHtml(movie.oneLine || "") + "</p>",
            "<div class='card-meta'><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span><span>" + escapeHtml(movie.year) + "</span></div>",
            "<div class='tag-row'>" + tags + "</div>",
            "</div>",
            "</article>"
        ].join("");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setupSearchPage() {
        var page = qs("[data-search-page]");
        if (!page) {
            return;
        }
        var input = qs("[data-global-search-input]", page);
        var button = qs("[data-global-search-button]", page);
        var summary = qs("[data-search-summary]", page);
        var results = qs("[data-search-results]", page);
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";
        var catalog = [];

        if (input) {
            input.value = initialQuery;
        }

        function render() {
            var query = input ? input.value.trim().toLowerCase() : "";
            var matches = catalog.filter(function (movie) {
                var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.categoryName, (movie.tags || []).join(" "), movie.oneLine].join(" ").toLowerCase();
                return !query || haystack.indexOf(query) !== -1;
            }).slice(0, 120);

            if (summary) {
                summary.textContent = query ? "找到 " + matches.length + " 条相关结果（最多显示 120 条）。" : "请输入关键词，或浏览下方推荐内容。";
            }
            if (results) {
                results.innerHTML = matches.map(movieCardTemplate).join("");
            }
        }

        if (button) {
            button.addEventListener("click", render);
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

        fetch("assets/catalog.json")
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                catalog = Array.isArray(data) ? data : [];
                render();
            })
            .catch(function () {
                if (summary) {
                    summary.textContent = "搜索索引加载失败，请返回分类页浏览。";
                }
            });
    }

    function setupPlayers() {
        qsa("[data-hls-player]").forEach(function (shell) {
            var source = shell.getAttribute("data-src");
            var video = qs("video", shell);
            var start = qs("[data-player-start]", shell);
            var error = qs("[data-player-error]", shell);
            var hls = null;
            var ready = false;

            function showError(message) {
                if (error) {
                    error.textContent = message;
                    error.classList.add("is-visible");
                }
            }

            function init() {
                if (ready || !video || !source) {
                    return;
                }
                ready = true;

                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            showError("网络错误，正在尝试重新连接播放源。\n" + source);
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            showError("媒体错误，正在尝试恢复播放。\n" + source);
                            hls.recoverMediaError();
                        } else {
                            showError("无法播放当前 HLS 视频源。\n" + source);
                            hls.destroy();
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                } else {
                    showError("当前浏览器不支持 HLS 播放，或 HLS 播放库加载失败。\n" + source);
                }
            }

            function play() {
                init();
                if (!video) {
                    return;
                }
                var promise = video.play();
                if (promise && promise.catch) {
                    promise.catch(function () {
                        showError("浏览器阻止了自动播放，请再次点击播放器或使用原生控制栏播放。");
                    });
                }
            }

            if (start) {
                start.addEventListener("click", play);
            }
            if (video) {
                video.addEventListener("click", function () {
                    if (video.paused) {
                        play();
                    } else {
                        video.pause();
                    }
                });
                video.addEventListener("play", function () {
                    shell.classList.add("is-playing");
                });
                video.addEventListener("pause", function () {
                    shell.classList.remove("is-playing");
                });
            }

            window.addEventListener("pagehide", function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileMenu();
        setupHeaderSearch();
        setupHero();
        setupLocalFilter();
        setupSearchPage();
        setupPlayers();
    });
})();
