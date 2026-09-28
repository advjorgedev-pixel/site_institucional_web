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
