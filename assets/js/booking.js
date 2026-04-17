import { db } from "../../src/database/firebase.js";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const bookingForm = document.querySelector("[data-booking-form]");

if (bookingForm) {
    const initializeTimePicker = () => {
        const timeInput = bookingForm.querySelector("[data-time-input]");
        const timeTrigger = bookingForm.querySelector("[data-time-trigger]");
        const timePanel = bookingForm.querySelector("[data-time-panel]");
        const previewValue = bookingForm.querySelector("[data-time-preview]");
        const hourValue = bookingForm.querySelector("[data-time-hour]");
        const minuteValue = bookingForm.querySelector("[data-time-minute]");
        const periodValue = bookingForm.querySelector("[data-time-period-display]");
        const hourUp = bookingForm.querySelector("[data-time-hour-up]");
        const hourDown = bookingForm.querySelector("[data-time-hour-down]");
        const minuteUp = bookingForm.querySelector("[data-time-minute-up]");
        const minuteDown = bookingForm.querySelector("[data-time-minute-down]");
        const minuteStepButtons = bookingForm.querySelectorAll("[data-time-step]");
        const periodUp = bookingForm.querySelector("[data-time-period-up]");
        const periodDown = bookingForm.querySelector("[data-time-period-down]");
        const applyButton = bookingForm.querySelector("[data-time-apply]");
        const cancelButton = bookingForm.querySelector("[data-time-cancel]");

        if (!timeInput || !timeTrigger || !timePanel || !previewValue || !hourValue || !minuteValue || !periodValue) return;

        let selectedHour = 8;
        let selectedMinute = 0;
        let selectedPeriod = "AM";
        let selectedMinuteStep = 5;

        const padMinute = (value) => String(value).padStart(2, "0");
        const normalizeHour = (value) => ((value - 1 + 12) % 12) + 1;
        const normalizeMinute = (value) => (value + 60) % 60;
        const togglePeriod = () => {
            selectedPeriod = selectedPeriod === "AM" ? "PM" : "AM";
        };

        const renderValues = () => {
            hourValue.textContent = String(selectedHour);
            minuteValue.textContent = padMinute(selectedMinute);
            periodValue.textContent = selectedPeriod;
            previewValue.textContent = `${selectedHour}:${padMinute(selectedMinute)} ${selectedPeriod}`;

            minuteStepButtons.forEach((button) => {
                const buttonStep = Number(button.dataset.timeStep || 5);
                const isActive = buttonStep === selectedMinuteStep;
                button.classList.toggle("bg-primary/10", isActive);
                button.classList.toggle("text-primary", isActive);
                button.classList.toggle("text-slate-500", !isActive);
                button.classList.toggle("dark:text-slate-300", !isActive);
            });
        };

        const closePanel = () => {
            timePanel.classList.add("hidden");
        };

        const openPanel = () => {
            timePanel.classList.remove("hidden");
            renderValues();
        };

        const applyTimeSelection = () => {
            timeInput.value = `${selectedHour}:${padMinute(selectedMinute)} ${selectedPeriod}`;
            timeInput.dispatchEvent(new Event("input", { bubbles: true }));
            timeInput.dispatchEvent(new Event("change", { bubbles: true }));
            closePanel();
        };

        const parseExistingTimeValue = (value) => {
            const match = String(value).trim().match(/^(1[0-2]|[1-9]):([0-5][0-9])\s?(AM|PM)$/i);
            if (!match) return;
            selectedHour = Number(match[1]);
            selectedMinute = Number(match[2]);
            selectedPeriod = match[3].toUpperCase();
            renderValues();
        };

        hourUp?.addEventListener("click", () => {
            selectedHour = normalizeHour(selectedHour + 1);
            renderValues();
        });

        hourDown?.addEventListener("click", () => {
            selectedHour = normalizeHour(selectedHour - 1);
            renderValues();
        });

        minuteUp?.addEventListener("click", () => {
            selectedMinute = normalizeMinute(selectedMinute + selectedMinuteStep);
            renderValues();
        });

        minuteDown?.addEventListener("click", () => {
            selectedMinute = normalizeMinute(selectedMinute - selectedMinuteStep);
            renderValues();
        });

        minuteStepButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const nextStep = Number(button.dataset.timeStep || 5);
                if ([5, 10, 30].includes(nextStep)) {
                    selectedMinuteStep = nextStep;
                    renderValues();
                }
            });
        });

        periodUp?.addEventListener("click", () => {
            togglePeriod();
            renderValues();
        });

        periodDown?.addEventListener("click", () => {
            togglePeriod();
            renderValues();
        });

        timeTrigger.addEventListener("click", () => {
            if (!timePanel.classList.contains("hidden")) {
                closePanel();
                return;
            }
            parseExistingTimeValue(timeInput.value);
            openPanel();
        });

        timeInput.addEventListener("click", () => {
            parseExistingTimeValue(timeInput.value);
            openPanel();
        });

        timeInput.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") {
                event.preventDefault();
            }
        });

        applyButton?.addEventListener("click", applyTimeSelection);
        cancelButton?.addEventListener("click", closePanel);

        document.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            const clickedInside = timePanel.contains(target) || timeTrigger.contains(target) || timeInput.contains(target);
            if (!clickedInside) {
                closePanel();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closePanel();
            }
        });

        renderValues();
    };

    initializeTimePicker();

    const params = new URLSearchParams(window.location.search);
    const presetService = params.get("service");
    const presetCategory = params.get("category");
    if (presetService) {
        const serviceField = bookingForm.querySelector("textarea[name='serviceDescription']");
        if (serviceField && !serviceField.value.trim()) {
            serviceField.value = presetService;
        }
    }
    if (presetCategory) {
        const categoryField = bookingForm.querySelector("select[name='serviceCategory']");
        if (categoryField) {
            const normalized = String(presetCategory).trim();
            const hasOption = Array.from(categoryField.options).some((opt) => opt.value === normalized);
            if (hasOption) {
                categoryField.value = normalized;
            }
        }
    }

    const submitButton = bookingForm.querySelector("button[type='submit']");
    const successModal = document.getElementById("bookingSuccessModal");
    const successText = document.getElementById("bookingSuccessText");
    const closeButtons = successModal ? successModal.querySelectorAll("[data-close-booking-modal]") : [];
    const downloadButton = document.getElementById("downloadBookingCardBtn");

    let latestBooking = null;

    const closeModal = () => {
        if (!successModal) return;
        successModal.classList.add("hidden");
    };

    closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));

    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            if (!latestBooking) return;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("PDF library failed to load.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFillColor(245, 234, 250);
            doc.rect(0, 0, 210, 297, "F");
            doc.setDrawColor(215, 144, 238);
            doc.roundedRect(16, 18, 178, 260, 8, 8);

            doc.setFontSize(20);
            doc.setTextColor(33, 23, 43);
            doc.text("PureLux Signature Booking Card", 24, 36);

            doc.setFontSize(11);
            doc.setTextColor(88, 84, 99);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 24, 44);

            const lines = [
                ["Client", latestBooking.clientName],
                ["Phone", latestBooking.phone],
                ["Email", latestBooking.email || "Not provided"],
                ["Location", latestBooking.location],
                ["Service", latestBooking.serviceDescription],
                ["Date", latestBooking.date],
                ["Time", latestBooking.time],
                ["Preferred Contact", latestBooking.communicationMethod],
                ["Status", "Pending Review"],
            ];

            let y = 64;
            lines.forEach(([label, value]) => {
                doc.setFontSize(11);
                doc.setTextColor(140, 132, 156);
                doc.text(`${label}:`, 24, y);
                doc.setTextColor(33, 23, 43);
                doc.text(String(value), 70, y, { maxWidth: 115 });
                y += 12;
            });

            doc.setTextColor(140, 132, 156);
            doc.setFontSize(10);
            doc.text("We will review your request and notify you after approval.", 24, 256);

            const filename = `PureLux-Signature-Booking-Card-${Date.now()}.pdf`;
            doc.save(filename);
        });
    }

    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70", "cursor-not-allowed");
        }

        const formData = new FormData(bookingForm);
        const bookingPayload = {
            clientName: (formData.get("clientName") || "").trim(),
            phone: (formData.get("phone") || "").trim(),
            email: (formData.get("email") || "").trim(),
            location: (formData.get("location") || "").trim(),
            date: formData.get("date") || "",
            time: formData.get("time") || "",
            communicationMethod: formData.get("communicationMethod") || "Phone call",
            serviceCategory: formData.get("serviceCategory") || "Hair",
            serviceDescription: (formData.get("serviceDescription") || "").trim(),
            status: "pending",
            createdAt: serverTimestamp(),
            source: "website-booking-form",
        };

        try {
            await addDoc(collection(db, "bookings"), bookingPayload);
            latestBooking = bookingPayload;
            bookingForm.reset();

            if (successText) {
                successText.textContent = "Booking submitted successfully. We will notify you after review.";
            }
            if (successModal) {
                successModal.classList.remove("hidden");
            } else {
                alert("Booking submitted successfully.");
            }
        } catch (error) {
            console.error("Booking submission failed", error);
            alert("Could not submit booking right now. Please try again.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70", "cursor-not-allowed");
            }
        }
    });
}
