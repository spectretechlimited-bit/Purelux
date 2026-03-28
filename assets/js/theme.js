(function () {
    const storageKey = "purelux-theme";
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

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

    const stored = localStorage.getItem(storageKey);
    const initial = stored || (mediaQuery.matches ? "dark" : "light");
    apply(initial);

    window.pureluxToggleTheme = () => {
        const next = root.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(storageKey, next);
        apply(next);
    };

    mediaQuery.addEventListener("change", (event) => {
        if (!localStorage.getItem(storageKey)) {
            apply(event.matches ? "dark" : "light");
        }
    });
})();
