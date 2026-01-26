(function () {
    const headerEl = document.querySelector(".page-home .site-header");
    const heroEl = document.querySelector(".page-home .hero-home");

    if (!headerEl || !heroEl) return;

    const setState = (isOnHero) => {
        headerEl.classList.toggle("is-transparent", isOnHero);
        headerEl.classList.toggle("is-solid", !isOnHero);
    };

    // inicial
    setState(true);

    // troca ao sair do hero
    const io = new IntersectionObserver(
        ([entry]) => setState(entry.isIntersecting),
        { threshold: 0.05 }
    );

    io.observe(heroEl);
})();
