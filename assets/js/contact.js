import { db } from "../../src/database/firebase.js";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const form = document.querySelector("[data-contact-form]");

if (form) {
    const submitButton = form.querySelector("button[type='submit']");
    const feedback = document.getElementById("contactFormFeedback");
    const successModal = document.getElementById("contactSuccessModal");
    const successText = document.getElementById("contactSuccessText");
    const successIcon = document.getElementById("contactSuccessIcon");
    const closeButtons = successModal ? successModal.querySelectorAll("[data-close-contact-modal]") : [];

    const closeModal = () => {
        if (!successModal) return;
        successModal.classList.add("hidden");
        successModal.setAttribute("aria-hidden", "true");
    };

    const openModal = () => {
        if (!successModal) return;
        successModal.classList.remove("hidden");
        successModal.setAttribute("aria-hidden", "false");

        if (successIcon) {
            successIcon.classList.remove("contact-success-play");
            void successIcon.offsetWidth;
            successIcon.classList.add("contact-success-play");
        }
    };

    closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));
    if (successModal) {
        successModal.addEventListener("click", (event) => {
            if (event.target === successModal) {
                closeModal();
            }
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70", "cursor-not-allowed");
        }

        if (feedback) {
            feedback.classList.add("hidden");
            feedback.textContent = "";
        }

        const formData = new FormData(form);
        const payload = {
            name: (formData.get("name") || "").trim(),
            email: (formData.get("email") || "").trim(),
            phone: (formData.get("phone") || "").trim(),
            subject: formData.get("subject") || "General",
            message: (formData.get("message") || "").trim(),
            status: "new",
            createdAt: serverTimestamp(),
            source: "website-contact-form",
        };

        try {
            await addDoc(collection(db, "messages"), payload);
            form.reset();

            if (successText) {
                successText.textContent = "Your message has been sent and is under review. We will get back to you shortly.";
            }
            openModal();

            if (feedback) {
                feedback.textContent = "Message sent and under review.";
                feedback.className = "mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300";
            } else {
                alert("Message sent successfully.");
            }
        } catch (error) {
            console.error("Contact message failed", error);
            if (feedback) {
                feedback.textContent = "We could not send your message right now. Please try again.";
                feedback.className = "mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-300";
            } else {
                alert("Failed to send message.");
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70", "cursor-not-allowed");
            }
        }
    });
}
