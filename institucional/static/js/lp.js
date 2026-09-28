(function () {
    "use strict";

    const header = document.querySelector("[data-lp-header]");

    if (!header) return;

    const menu = header.querySelector("[data-lp-menu]");
    const menuToggle = header.querySelector("[data-lp-menu-toggle]");
    const navigationLinks = Array.from(header.querySelectorAll("[data-lp-nav-link]"));
    const backToTop = document.querySelector("[data-lp-back-to-top]");
    const desktopQuery = window.matchMedia("(min-width: 1200px)");
    let scrollFrame = null;

    if (!menu || !menuToggle) return;

    const setMenuState = (isOpen, options = {}) => {
        const { restoreFocus = false } = options;
        const openLabel = menuToggle.dataset.openLabel || "Abrir menu";
        const closeLabel = menuToggle.dataset.closeLabel || "Fechar menu";

        menu.classList.toggle("is-open", isOpen);
        header.classList.toggle("is-menu-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);

        if (restoreFocus) menuToggle.focus();
    };

    const updateHeaderOnScroll = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 20);
        if (backToTop) backToTop.hidden = window.scrollY < 300;
        scrollFrame = null;
    };

    const requestHeaderUpdate = () => {
        if (scrollFrame !== null) return;
        scrollFrame = window.requestAnimationFrame(updateHeaderOnScroll);
    };

    const setActiveLink = (activeLink) => {
        navigationLinks.forEach((link) => {
            const isActive = link === activeLink;
            link.classList.toggle("is-active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const observeSections = () => {
        if (!("IntersectionObserver" in window)) return;

        const sectionLinks = navigationLinks
            .map((link) => {
                const sectionId = link.hash.slice(1);
                const isCurrentPage = link.pathname === window.location.pathname;
                const section = sectionId && isCurrentPage ? document.getElementById(sectionId) : null;
                return section ? { link, section } : null;
            })
            .filter(Boolean);

        if (!sectionLinks.length) return;

        const visibleSections = new Set();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    visibleSections.add(entry.target);
                } else {
                    visibleSections.delete(entry.target);
                }
            });

            const headerBottom = header.getBoundingClientRect().bottom;
            const closestSection = Array.from(visibleSections)
                .sort((first, second) =>
                    Math.abs(first.getBoundingClientRect().top - headerBottom)
                    - Math.abs(second.getBoundingClientRect().top - headerBottom))[0];

            if (!closestSection) return;

            const activeItem = sectionLinks.find(({ section }) => section === closestSection);
            if (activeItem) setActiveLink(activeItem.link);
        }, {
            rootMargin: "-25% 0px -60%",
            threshold: 0
        });

        sectionLinks.forEach(({ section }) => observer.observe(section));
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        setMenuState(!isOpen);
    });

    navigationLinks.forEach((link) => {
        link.addEventListener("click", () => {
            setActiveLink(link);
            if (!desktopQuery.matches) setMenuState(false);

            if (link.hash && link.pathname === window.location.pathname) {
                const target = document.getElementById(link.hash.slice(1));
                if (target) {
                    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
                    window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
                }
            }
        });
    });

    document.addEventListener("click", (event) => {
        if (desktopQuery.matches || !menu.classList.contains("is-open")) return;
        if (!header.contains(event.target)) setMenuState(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
        event.preventDefault();
        setMenuState(false, { restoreFocus: true });
    });

    desktopQuery.addEventListener("change", () => setMenuState(false));
    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });

    backToTop?.addEventListener("click", () => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        window.scrollTo({ top: 0, behavior });
        header.querySelector(".lp-brand")?.focus({ preventScroll: true });
    });

    header.classList.add("is-ready");
    updateHeaderOnScroll();
    observeSections();
})();

(() => {
    "use strict";

    const section = document.querySelector("[data-lp-reviews]");
    if (!section) return;

    const track = section.querySelector("[data-lp-reviews-track]");
    const controls = section.querySelector("[data-lp-reviews-controls]");
    const previousButton = section.querySelector("[data-lp-reviews-prev]");
    const nextButton = section.querySelector("[data-lp-reviews-next]");
    if (!track || !controls || !previousButton || !nextButton) return;

    const cards = Array.from(track.querySelectorAll(".lp-reviews__card"));
    if (cards.length < 2) return;

    let scrollFrame = null;

    const updateControls = () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const canScroll = maxScroll > 2;

        if (!canScroll && controls.contains(document.activeElement)) {
            track.focus({ preventScroll: true });
        }

        controls.hidden = !canScroll;
        previousButton.disabled = !canScroll || track.scrollLeft <= 2;
        nextButton.disabled = !canScroll || track.scrollLeft >= maxScroll - 2;
    };

    const requestControlUpdate = () => {
        if (scrollFrame !== null) return;
        scrollFrame = window.requestAnimationFrame(() => {
            scrollFrame = null;
            updateControls();
        });
    };

    const moveByCard = (direction) => {
        const step = cards[1].offsetLeft - cards[0].offsetLeft;
        if (step <= 0) return;

        const currentIndex = Math.round(track.scrollLeft / step);
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
        track.scrollTo({ left: (currentIndex + direction) * step, behavior });
    };

    previousButton.addEventListener("click", () => moveByCard(-1));
    nextButton.addEventListener("click", () => moveByCard(1));
    track.addEventListener("scroll", requestControlUpdate, { passive: true });
    window.addEventListener("resize", requestControlUpdate);

    updateControls();
})();
