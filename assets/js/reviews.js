import { db } from "../../src/database/firebase.js";
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const reviewsList = document.getElementById("reviewsList");
const reviewsForm = document.getElementById("reviewsForm");
const reviewsFeedback = document.getElementById("reviewsFeedback");
const averageRatingNode = document.getElementById("averageRating");
const totalReviewsNode = document.getElementById("totalReviews");
const ratingInput = document.getElementById("ratingValue");
const ratingHint = document.getElementById("ratingHint");
const starButtons = document.querySelectorAll("[data-star]");

const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getStars = (rating) => {
    const safe = Math.max(1, Math.min(5, Number(rating || 1)));
    return "★".repeat(safe) + "☆".repeat(5 - safe);
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleDateString();
};

const setFeedback = (message, tone = "success") => {
    if (!reviewsFeedback) return;
    reviewsFeedback.textContent = message;
    reviewsFeedback.className = tone === "success"
        ? "rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600"
        : "rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600";
};

const updateStarUi = (rating) => {
    const value = Number(rating || 5);
    starButtons.forEach((button) => {
        const star = Number(button.getAttribute("data-star") || 0);
        const icon = button.querySelector("span");
        const active = star <= value;
        button.classList.toggle("text-amber-500", active);
        button.classList.toggle("text-slate-300", !active);
        if (icon) {
            icon.textContent = active ? "star" : "star_outline";
        }
    });

    if (ratingInput) {
        ratingInput.value = String(value);
    }
    if (ratingHint) {
        ratingHint.textContent = `${value} out of 5`;
    }
};

const renderReview = (review) => {
    const reviewer = review.isAnonymous ? "Anonymous" : (review.authorName || "Anonymous");
    const comment = escapeHtml(review.comment || "");
    return `
    <article class="rounded-3xl border border-primary/15 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-surface/75">
        <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">${escapeHtml(reviewer)}</h3>
            <span class="text-sm font-bold text-amber-500">${getStars(review.rating)}</span>
        </div>
        <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">${comment}</p>
        <p class="mt-3 text-xs font-semibold text-slate-400">${escapeHtml(formatTimestamp(review.createdAt))}</p>
    </article>`;
};

const updateDistribution = (items) => {
    const counts = [0, 0, 0, 0, 0];
    items.forEach((item) => {
        const rating = Number(item.rating || 0);
        if (rating >= 1 && rating <= 5) {
            counts[rating - 1] += 1;
        }
    });

    const max = Math.max(...counts, 1);
    for (let star = 1; star <= 5; star += 1) {
        const bar = document.querySelector(`[data-bar='${star}']`);
        const value = document.querySelector(`[data-count='${star}']`);
        if (bar) {
            bar.style.width = `${Math.round((counts[star - 1] / max) * 100)}%`;
        }
        if (value) {
            value.textContent = String(counts[star - 1]);
        }
    }
};

const loadReviews = async () => {
    if (!reviewsList) return;

    try {
        const reviewsQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(80));
        const snapshot = await getDocs(reviewsQuery);
        const items = snapshot.docs.map((docItem) => docItem.data());

        updateDistribution(items);

        if (!items.length) {
            reviewsList.innerHTML = '<div class="rounded-3xl border border-primary/15 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:bg-surface dark:text-slate-300">No reviews yet. Be the first to share your experience.</div>';
            if (averageRatingNode) averageRatingNode.textContent = "0.0";
            if (totalReviewsNode) totalReviewsNode.textContent = "0 reviews";
            return;
        }

        const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
        if (averageRatingNode) averageRatingNode.textContent = (total / items.length).toFixed(1);
        if (totalReviewsNode) totalReviewsNode.textContent = `${items.length} ${items.length === 1 ? "review" : "reviews"}`;

        reviewsList.innerHTML = items.map((item) => renderReview(item)).join("");
    } catch (error) {
        console.error("Could not load reviews", error);
        reviewsList.innerHTML = '<div class="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-10 text-center text-sm font-semibold text-rose-600">Could not load reviews right now.</div>';
    }
};

if (reviewsForm) {
    starButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const star = Number(button.getAttribute("data-star") || 5);
            updateStarUi(star);
        });
    });

    updateStarUi(Number(ratingInput?.value || 5));

    reviewsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(reviewsForm);
        const rating = Number(ratingInput?.value || formData.get("rating") || 0);
        const isAnonymous = formData.get("isAnonymous") === "on";
        const providedName = String(formData.get("authorName") || "").trim();

        const payload = {
            rating,
            comment: String(formData.get("comment") || "").trim(),
            isAnonymous,
            authorName: isAnonymous ? "Anonymous" : (providedName || "Guest"),
            createdAt: serverTimestamp(),
        };

        if (payload.rating < 1 || payload.rating > 5 || payload.comment.length < 3) {
            setFeedback("Please pick a star rating and write at least 3 characters.", "error");
            return;
        }

        try {
            await addDoc(collection(db, "reviews"), payload);
            reviewsForm.reset();
            updateStarUi(5);
            setFeedback("Review submitted successfully. Thank you for your feedback.");
            await loadReviews();
        } catch (error) {
            console.error("Could not submit review", error);
            setFeedback("Could not submit review right now. Please try again.", "error");
        }
    });
}

loadReviews();
