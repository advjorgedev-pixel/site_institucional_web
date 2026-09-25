(function () {
    "use strict";

    const header = document.querySelector("[data-lp-header]");

    if (!header) return;

    const menu = header.querySelector("[data-lp-menu]");
    const menuToggle = header.querySelector("[data-lp-menu-toggle]");
    const navigationLinks = Array.from(header.querySelectorAll("[data-lp-nav-link]"));
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
        header.classList.toggle("is-scrolled", window.scrollY > 8);
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

    header.classList.add("is-ready");
    updateHeaderOnScroll();
    observeSections();
})();
