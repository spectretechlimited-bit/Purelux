import { db } from "../../src/database/firebase.js";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const bookingForm = document.querySelector("[data-booking-form]");

if (bookingForm) {
    const params = new URLSearchParams(window.location.search);
    const presetService = params.get("service");
    if (presetService) {
        const serviceField = bookingForm.querySelector("textarea[name='serviceDescription']");
        if (serviceField && !serviceField.value.trim()) {
            serviceField.value = presetService;
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
