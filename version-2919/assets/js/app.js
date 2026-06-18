(function() {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function setupMobileMenu() {
        const button = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.mobile-nav');

        if (!button || !nav) {
            return;
        }

        button.addEventListener('click', function() {
            const isOpen = nav.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(isOpen));
        });
    }

    function setupHeroSlider() {
        const root = document.querySelector('[data-hero-slider]');

        if (!root) {
            return;
        }

        const slides = Array.from(root.querySelectorAll('.hero-slide'));
        const dots = Array.from(root.querySelectorAll('.hero-dot'));
        const prev = root.querySelector('[data-hero-prev]');
        const next = root.querySelector('[data-hero-next]');
        let active = 0;
        let timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;

            slides.forEach(function(slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });

            dots.forEach(function(dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === active);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function() {
                show(active + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function() {
                show(active - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function() {
                show(active + 1);
                start();
            });
        }

        dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                const index = Number(dot.getAttribute('data-slide'));
                show(index);
                start();
            });
        });

        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupFilters() {
        const lists = Array.from(document.querySelectorAll('[data-filter-list]'));

        lists.forEach(function(list) {
            const scope = list.getAttribute('data-filter-list');
            const input = document.querySelector('[data-filter-input="' + scope + '"]');
            const count = document.querySelector('[data-filter-count="' + scope + '"]');
            const chipsWrap = document.querySelector('[data-filter-chips="' + scope + '"]');
            const items = Array.from(list.querySelectorAll('[data-searchable]'));
            let category = 'all';

            function applyFilter() {
                const keyword = input ? input.value.trim().toLowerCase() : '';
                let visible = 0;

                items.forEach(function(item) {
                    const searchText = (item.getAttribute('data-search') || '').toLowerCase();
                    const itemCategory = item.getAttribute('data-category') || '';
                    const matchKeyword = !keyword || searchText.indexOf(keyword) !== -1;
                    const matchCategory = category === 'all' || itemCategory === category;
                    const shouldShow = matchKeyword && matchCategory;

                    item.classList.toggle('is-filtered-out', !shouldShow);

                    if (shouldShow) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '显示 ' + visible + ' 项';
                }
            }

            if (input) {
                input.addEventListener('input', applyFilter);
            }

            if (chipsWrap) {
                chipsWrap.addEventListener('click', function(event) {
                    const button = event.target.closest('[data-filter-value]');

                    if (!button) {
                        return;
                    }

                    category = button.getAttribute('data-filter-value') || 'all';
                    chipsWrap.querySelectorAll('[data-filter-value]').forEach(function(chip) {
                        chip.classList.toggle('is-active', chip === button);
                    });
                    applyFilter();
                });
            }

            applyFilter();
        });
    }

    function setupSearchQuery() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');

        if (!query) {
            return;
        }

        document.querySelectorAll('[data-filter-input]').forEach(function(input) {
            input.value = query;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    function attachHls(video, streamUrl) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            return null;
        }

        if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            return hls;
        }

        video.src = streamUrl;
        return null;
    }

    window.bindMoviePlayer = function(videoId, coverId, streamUrl) {
        const video = document.getElementById(videoId);
        const cover = document.getElementById(coverId);
        let started = false;
        let hls = null;

        if (!video || !cover || !streamUrl) {
            return;
        }

        function startPlayback() {
            if (!started) {
                hls = attachHls(video, streamUrl);
                started = true;
            }

            cover.classList.add('is-hidden');
            video.controls = true;

            const playAttempt = video.play();

            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(function() {
                    cover.classList.remove('is-hidden');
                });
            }
        }

        cover.addEventListener('click', startPlayback);
        video.addEventListener('click', function() {
            if (!started) {
                startPlayback();
            }
        });

        window.addEventListener('pagehide', function() {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
    };

    ready(function() {
        setupMobileMenu();
        setupHeroSlider();
        setupFilters();
        setupSearchQuery();
    });
})();
