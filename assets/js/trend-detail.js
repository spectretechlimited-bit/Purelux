import { db } from "../../src/database/firebase.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const titleEl = document.getElementById("detailTitle");
const descriptionEl = document.getElementById("detailDescription");
const durationEl = document.getElementById("detailDuration");
const categoryEl = document.getElementById("detailCategory");
const imageEl = document.getElementById("detailImage");
const bookBtn = document.getElementById("detailBookBtn");

const makeSlug = (value) => String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const apply = (item) => {
    if (!item) return;
    const title = item.title || "Trending Style";
    const desc = item.description || "Trend details unavailable.";
    const duration = item.duration || "60 min";
    const category = item.category || "Beauty";
    const image = item.imageDataUrl || item.imageUrl || "../../assets/img/h6.jpeg";

    if (titleEl) titleEl.textContent = title;
    if (descriptionEl) descriptionEl.textContent = desc;
    if (durationEl) durationEl.textContent = duration;
    if (categoryEl) categoryEl.textContent = category;
    if (imageEl) {
        imageEl.src = image;
        imageEl.alt = title;
    }
    if (bookBtn) {
        bookBtn.href = `booking.html?service=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;
    }
};

const init = async () => {
    const slug = new URLSearchParams(window.location.search).get("slug") || "";
    if (!slug) return;

    try {
        const q = query(collection(db, "trending"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const found = snapshot.docs
            .map((docItem) => docItem.data())
            .find((item) => {
                const itemSlug = item.slug || makeSlug(`${item.title || ""}-${item.category || ""}`);
                return itemSlug === slug;
            });

        apply(found);
    } catch (error) {
        console.error("Could not load trend detail", error);
    }
};

init();
