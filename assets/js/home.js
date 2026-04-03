const VISIT_KEY = "purelux-home-first-visit-v1";

document.addEventListener("DOMContentLoaded", () => {
    const welcomeModal = document.getElementById("homeWelcomeModal");
    if (!welcomeModal) return;

    const closeWelcome = () => {
        welcomeModal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    };

    welcomeModal.querySelectorAll("[data-close-home-welcome]").forEach((btn) => {
        btn.addEventListener("click", closeWelcome);
    });

    if (!localStorage.getItem(VISIT_KEY)) {
        welcomeModal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        localStorage.setItem(VISIT_KEY, "1");
    }
});
