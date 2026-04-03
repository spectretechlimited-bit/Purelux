(function () {
    const storageKey = "purelux-theme";
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const formatDate = (date) => {
        const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
        const day = new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(date);
        const month = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(date);
        const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(date);
        return `${weekday} ${day} ${month} ${year}`;
    };

    const apply = (theme) => {
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
            const isDark = theme === "dark";
            btn.setAttribute("aria-pressed", isDark ? "true" : "false");
            const icon = btn.querySelector("[data-theme-icon]");
            const label = btn.querySelector("[data-theme-label]");
            if (icon) icon.textContent = isDark ? "dark_mode" : "light_mode";
            if (label) label.textContent = isDark ? "Dark" : "Light";
        });
    };

    const syncToggleControls = () => {
        document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
            const isDark = root.classList.contains("dark");
            btn.setAttribute("aria-pressed", isDark ? "true" : "false");
            const icon = btn.querySelector("[data-theme-icon]");
            const label = btn.querySelector("[data-theme-label]");
            if (icon) icon.textContent = isDark ? "dark_mode" : "light_mode";
            if (label) label.textContent = isDark ? "Dark" : "Light";
        });
    };

    const syncFooterDate = () => {
        const currentDateText = formatDate(new Date());
        document.querySelectorAll("[data-current-date]").forEach((node) => {
            node.textContent = currentDateText;
        });
    };

    const closeMobileMenu = () => {
        const drawer = document.querySelector("[data-mobile-menu]");
        const backdrop = document.querySelector("[data-mobile-menu-backdrop]");
        const toggle = document.querySelector("[data-mobile-menu-toggle]");
        if (!drawer || !backdrop || !toggle) {
            return;
        }

        drawer.classList.add("-translate-x-full");
        drawer.classList.remove("translate-x-0");
        backdrop.classList.add("opacity-0", "pointer-events-none");
        backdrop.classList.remove("opacity-100", "pointer-events-auto");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("overflow-hidden");
    };

    const openMobileMenu = () => {
        const drawer = document.querySelector("[data-mobile-menu]");
        const backdrop = document.querySelector("[data-mobile-menu-backdrop]");
        const toggle = document.querySelector("[data-mobile-menu-toggle]");
        if (!drawer || !backdrop || !toggle) {
            return;
        }

        drawer.classList.remove("-translate-x-full");
        drawer.classList.add("translate-x-0");
        backdrop.classList.remove("opacity-0", "pointer-events-none");
        backdrop.classList.add("opacity-100", "pointer-events-auto");
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("overflow-hidden");
    };

    const stored = localStorage.getItem(storageKey);
    const initial = stored || (mediaQuery.matches ? "dark" : "light");
    apply(initial);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncToggleControls, { once: true });
        document.addEventListener("DOMContentLoaded", syncFooterDate, { once: true });
    } else {
        syncToggleControls();
        syncFooterDate();
    }

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.querySelector("[data-mobile-menu-toggle]");
        const backdrop = document.querySelector("[data-mobile-menu-backdrop]");
        const drawer = document.querySelector("[data-mobile-menu]");

        if (toggle) {
            toggle.addEventListener("click", () => {
                const isOpen = toggle.getAttribute("aria-expanded") === "true";
                if (isOpen) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            });
        }

        if (backdrop) {
            backdrop.addEventListener("click", closeMobileMenu);
        }

        if (drawer) {
            drawer.querySelectorAll("a, [data-mobile-menu-close]").forEach((item) => {
                item.addEventListener("click", closeMobileMenu);
            });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMobileMenu();
            }
        });
    });

    window.pureluxToggleTheme = () => {
        const next = root.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(storageKey, next);
        apply(next);
        syncToggleControls();
    };

    window.pureluxOpenMobileMenu = openMobileMenu;
    window.pureluxCloseMobileMenu = closeMobileMenu;

    mediaQuery.addEventListener("change", (event) => {
        if (!localStorage.getItem(storageKey)) {
            apply(event.matches ? "dark" : "light");
            syncToggleControls();
        }
    });
})();
