if (window.AOS) {
    window.AOS.init({
        duration: 800,
        once: true,
        easing: "ease-in-out",
        disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
}
