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

(() => {
    "use strict";

    const modal = document.querySelector("[data-lp-document-modal]");
    if (!modal) return;

    const frame = modal.querySelector("[data-lp-document-frame]");
    const title = modal.querySelector("[data-lp-document-title]");
    const download = modal.querySelector("[data-lp-document-download]");
    if (!frame || !title || !download) return;

    // Prepara o documento antes de o controlador de modais compartilhado abrir a janela.
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-lp-document]");
        if (!trigger) return;

        const url = trigger.dataset.lpDocumentUrl;
        const label = trigger.querySelector("[data-lp-document-label]")?.textContent.trim();
        if (!url || !label) return;

        title.textContent = label;
        frame.title = label;
        frame.src = url;
        download.href = url;
    }, true);

    // Interrompe a renderização do PDF ao fechar, inclusive por Esc ou clique no fundo.
    new MutationObserver(() => {
        if (!modal.classList.contains("show")) frame.removeAttribute("src");
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
})();

(() => {
    "use strict";

    const section = document.querySelector("[data-lp-help]");
    if (!section) return;

    const cards = Array.from(section.querySelectorAll("[data-lp-help-card]"));
    let openCard = null;

    const setCardState = (card, isOpen, restoreFocus = false) => {
        const front = card.querySelector("[data-lp-help-front]");
        const back = card.querySelector("[data-lp-help-back]");
        const openButton = card.querySelector("[data-lp-help-open]");
        const closeButton = card.querySelector("[data-lp-help-close]");

        card.classList.toggle("is-flipped", isOpen);
        front.inert = isOpen;
        back.inert = !isOpen;
        front.setAttribute("aria-hidden", String(isOpen));
        back.setAttribute("aria-hidden", String(!isOpen));
        openButton.setAttribute("aria-expanded", String(isOpen));
        openButton.tabIndex = isOpen ? -1 : 0;
        closeButton.tabIndex = isOpen ? 0 : -1;

        if (restoreFocus) {
            (isOpen ? closeButton : openButton).focus({ preventScroll: true });
        }
    };

    cards.forEach((card) => setCardState(card, false));

    section.addEventListener("click", (event) => {
        const closeButton = event.target.closest("[data-lp-help-close]");
        if (closeButton) {
            const card = closeButton.closest("[data-lp-help-card]");
            setCardState(card, false, true);
            openCard = null;
            return;
        }

        const front = event.target.closest("[data-lp-help-front]");
        if (!front) return;

        const card = front.closest("[data-lp-help-card]");
        if (openCard && openCard !== card) setCardState(openCard, false);
        setCardState(card, true, true);
        openCard = card;
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !openCard || !openCard.contains(document.activeElement)) return;
        event.preventDefault();
        setCardState(openCard, false, true);
        openCard = null;
    });

    document.addEventListener("click", (event) => {
        if (!openCard || section.contains(event.target)) return;
        setCardState(openCard, false);
        openCard = null;
    });
})();

(() => {
    "use strict";

    const section = document.querySelector("[data-lp-faq]");
    if (!section) return;

    const items = Array.from(section.querySelectorAll("[data-lp-faq-item]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new WeakMap();

    const closeImmediately = (item) => {
        animations.get(item)?.animation.cancel();
        animations.delete(item);
        item.open = false;
    };

    const setOpen = (item, shouldOpen) => {
        const answer = item.querySelector(".lp-faq__answer");
        if (!answer) return;

        const currentHeight = answer.getBoundingClientRect().height;
        animations.get(item)?.animation.cancel();
        animations.delete(item);

        if (reduceMotion.matches || typeof answer.animate !== "function") {
            item.open = shouldOpen;
            return;
        }

        if (shouldOpen) item.open = true;
        const targetHeight = shouldOpen ? answer.scrollHeight : 0;
        const startHeight = currentHeight || (shouldOpen ? 0 : answer.scrollHeight);

        if (startHeight === targetHeight) {
            item.open = shouldOpen;
            return;
        }

        const animation = answer.animate([
            { height: `${startHeight}px`, opacity: shouldOpen ? 0 : 1 },
            { height: `${targetHeight}px`, opacity: shouldOpen ? 1 : 0 }
        ], {
            duration: 240,
            easing: "ease-in-out",
            fill: "forwards"
        });

        animations.set(item, { animation, targetOpen: shouldOpen });
        animation.finished.then(() => {
            if (animations.get(item)?.animation !== animation) return;
            item.open = shouldOpen;
            animations.delete(item);
            animation.cancel();
        }).catch(() => {});
    };

    section.addEventListener("click", (event) => {
        const summary = event.target.closest(".lp-faq__question");
        if (!summary || !section.contains(summary)) return;

        event.preventDefault();
        const item = summary.closest("[data-lp-faq-item]");
        const pending = animations.get(item);
        const shouldOpen = pending ? !pending.targetOpen : !item.open;

        if (shouldOpen) {
            items.forEach((other) => {
                if (other !== item && other.open) closeImmediately(other);
            });
        }

        setOpen(item, shouldOpen);
    });

    section.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const openItem = items.find((item) => item.open && animations.get(item)?.targetOpen !== false);
        if (!openItem) return;

        event.preventDefault();
        setOpen(openItem, false);
        openItem.querySelector("summary")?.focus({ preventScroll: true });
    });
})();

(() => {
    "use strict";

    const calculator = document.querySelector("[data-lp-calculator]");
    if (!calculator || !("MutationObserver" in window)) return;

    let refreshFrame = null;
    const observer = new MutationObserver((mutations) => {
        const layoutChanged = mutations.some(({ target }) =>
            target.matches("[data-calculator-step], [data-result-content]"));
        if (!layoutChanged || refreshFrame !== null) return;

        refreshFrame = window.requestAnimationFrame(() => {
            refreshFrame = null;
            window.AOS?.refreshHard();
        });
    });

    observer.observe(calculator, { attributes: true, attributeFilter: ["hidden"], subtree: true });
})();
