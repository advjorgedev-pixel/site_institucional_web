(function () {
    const collapseToggleSelector = "[data-bs-toggle='collapse']";
    const modalToggleSelector = "[data-bs-toggle='modal']";
    const modalDismissSelector = "[data-bs-dismiss='modal']";
    const focusableSelector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    let activeModal = null;
    let lastFocusedElement = null;

    const getTargetElement = (trigger) => {
        if (!trigger) return null;
        const targetSelector = trigger.getAttribute("data-bs-target") || trigger.getAttribute("href");
        if (!targetSelector || !targetSelector.startsWith("#")) return null;
        return document.querySelector(targetSelector);
    };

    const getCollapseTriggers = (collapseEl) => {
        if (!collapseEl || !collapseEl.id) return [];
        return Array.from(
            document.querySelectorAll(
                `${collapseToggleSelector}[data-bs-target="#${collapseEl.id}"]`
            )
        );
    };

    const updateTriggerState = (trigger, expanded) => {
        if (!trigger) return;
        trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
        trigger.classList.toggle("collapsed", !expanded);
    };

    const setCollapseState = (collapseEl, expanded) => {
        if (!collapseEl) return;

        collapseEl.classList.toggle("show", expanded);

        if (expanded) {
            collapseEl.removeAttribute("hidden");
        } else {
            collapseEl.setAttribute("hidden", "");
        }
    };

    const closeCollapseSiblings = (collapseEl) => {
        const parentSelector = collapseEl.getAttribute("data-bs-parent");
        if (!parentSelector) return;
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        parent.querySelectorAll(".collapse.show").forEach((openEl) => {
            if (openEl === collapseEl) return;
            setCollapseState(openEl, false);
            getCollapseTriggers(openEl).forEach((trigger) => {
                updateTriggerState(trigger, false);
            });
        });
    };

    const initCollapseState = () => {
        document.querySelectorAll(".collapse").forEach((collapseEl) => {
            const expanded = collapseEl.classList.contains("show");
            setCollapseState(collapseEl, expanded);
            getCollapseTriggers(collapseEl).forEach((trigger) => {
                updateTriggerState(trigger, expanded);
            });
        });
    };

    const getFocusableElements = (container) => {
        return Array.from(container.querySelectorAll(focusableSelector)).filter((el) => {
            return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        });
    };

    const openModal = (modal) => {
        if (!modal) return;
        if (activeModal && activeModal !== modal) {
            closeModal(activeModal, false);
        }

        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        modal.setAttribute("aria-modal", "true");

        if (modal.getAttribute("data-bs-scroll") !== "true") {
            document.body.classList.add("modal-open");
        }

        const focusable = getFocusableElements(modal);
        const focusTarget = focusable[0] || modal;
        focusTarget.focus({ preventScroll: true });

        activeModal = modal;
    };

    const closeModal = (modal, restoreFocus = true) => {
        if (!modal) return;
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        modal.removeAttribute("aria-modal");
        document.body.classList.remove("modal-open");

        if (restoreFocus && lastFocusedElement) {
            lastFocusedElement.focus({ preventScroll: true });
        }

        activeModal = null;
        lastFocusedElement = null;
    };

    const trapFocus = (event) => {
        if (!activeModal || event.key !== "Tab") return;
        const focusable = getFocusableElements(activeModal);

        if (!focusable.length) {
            event.preventDefault();
            activeModal.focus({ preventScroll: true });
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const isShift = event.shiftKey;

        if (isShift && document.activeElement === first) {
            event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!isShift && document.activeElement === last) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    };

    document.addEventListener("click", (event) => {
        const modalTrigger = event.target.closest(modalToggleSelector);
        if (modalTrigger) {
            event.preventDefault();
            const modal = getTargetElement(modalTrigger);
            openModal(modal);
            return;
        }

        const dismissTrigger = event.target.closest(modalDismissSelector);
        if (dismissTrigger) {
            event.preventDefault();
            const modal = dismissTrigger.closest(".modal");
            closeModal(modal);
            return;
        }

        if (activeModal && event.target === activeModal) {
            closeModal(activeModal);
        }

        const collapseTrigger = event.target.closest(collapseToggleSelector);
        if (collapseTrigger) {
            event.preventDefault();
            const collapseEl = getTargetElement(collapseTrigger);
            if (!collapseEl) return;
            const isExpanded = collapseEl.classList.contains("show");

            if (isExpanded) {
                setCollapseState(collapseEl, false);
                updateTriggerState(collapseTrigger, false);
            } else {
                closeCollapseSiblings(collapseEl);
                setCollapseState(collapseEl, true);
                updateTriggerState(collapseTrigger, true);
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        if (activeModal) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeModal(activeModal);
                return;
            }
            trapFocus(event);
        }

        const collapseTrigger = event.target.closest(collapseToggleSelector);
        if (collapseTrigger && collapseTrigger.tagName !== "BUTTON") {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                collapseTrigger.click();
            }
        }
    });

    document.addEventListener("click", (event) => {
        const navbar = event.target.closest(".navbar-collapse.show");
        const link = event.target.closest(".navbar-collapse.show a");
        if (!navbar || !link) return;
        if (window.matchMedia("(min-width: 768px)").matches) return;

        setCollapseState(navbar, false);
        getCollapseTriggers(navbar).forEach((trigger) => {
            updateTriggerState(trigger, false);
        });
    });

    initCollapseState();
})();
