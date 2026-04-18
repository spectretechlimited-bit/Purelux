import { db } from "../../src/database/firebase.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const fallbackServices = [
    {
        slug: "braiding-120-min",
        name: "Braiding",
        duration: "120 min",
        imageUrl: "../../assets/img/h6.jpeg",
        description: "Protective braid looks customized to your scalp comfort, preferred length, and long-wear finish.",
    },
    {
        slug: "hair-styling-60-min",
        name: "Hair Styling",
        duration: "60 min",
        imageUrl: "../../assets/img/h7.jpeg",
        description: "Polished styling designed for your face shape, event needs, and desired finish.",
    },
    {
        slug: "manicure-60-min",
        name: "Manicure",
        duration: "60 min",
        imageUrl: "../../assets/img/n1.jpeg",
        description: "Nail shaping, cuticle grooming, and clean finishing for neat and healthy-looking hands.",
    },
    {
        slug: "pedicure-60-min",
        name: "Pedicure",
        duration: "60 min",
        imageUrl: "../../assets/img/n2.jpeg",
        description: "Refresh and soften your feet with exfoliation, nail care, and a comfort-focused finishing routine.",
    },
    {
        slug: "cornrows-120-min",
        name: "Cornrows",
        duration: "120 min",
        imageUrl: "../../assets/img/h5.jpeg",
        description: "Defined cornrow lines and pattern work built for both everyday wear and standout styling.",
    },
    {
        slug: "treatment-90-min",
        name: "Treatment",
        duration: "90 min",
        imageUrl: "../../assets/img/h4.jpeg",
        description: "Targeted treatment sessions that support scalp health, moisture recovery, and stronger strands.",
    },
    {
        slug: "hair-colouring-180-min",
        name: "Hair Colouring",
        duration: "180 min",
        imageUrl: "../../assets/img/h3.jpeg",
        description: "Root touch-ups or full colour changes with professional blending for rich, lasting results.",
    },
    {
        slug: "blowdry-45-min",
        name: "Blowdry",
        duration: "45 min",
        imageUrl: "../../assets/img/h7.jpeg",
        description: "Smooth and bouncy blowdry styling that adds body, shape, and a polished salon finish.",
    },
];

const titleEl = document.getElementById("detailTitle");
const descriptionEl = document.getElementById("detailDescription");
const durationEl = document.getElementById("detailDuration");
const categoryEl = document.getElementById("detailCategory");
const imageEl = document.getElementById("detailImage");
const bookBtn = document.getElementById("detailBookBtn");

const loadDetailImage = (src, alt) => {
    if (!imageEl || !src) return;

    const reveal = () => {
        imageEl.alt = alt || "Service";
        imageEl.classList.remove("opacity-0");
        imageEl.classList.add("opacity-100");
    };

    imageEl.classList.remove("opacity-100");
    imageEl.classList.add("opacity-0");
    imageEl.onload = reveal;
    imageEl.onerror = reveal;
    imageEl.alt = alt || "Service";
    imageEl.src = src;
};

const makeSlug = (value) => String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const deriveCategory = (item) => {
    const source = `${item.category || ""} ${item.name || ""} ${item.description || ""}`.toLowerCase();
    if (/nail|manicure|pedicure|gel|acrylic|polish/.test(source)) return "Nails";
    if (/facial|makeup|lashes|brow|wax|spa/.test(source)) return "Beauty";
    return "Hair";
};

const apply = (item) => {
    if (!item) return;
    const name = item.name || "Service";
    const desc = item.description || "Service details unavailable.";
    const duration = item.duration || "60 min";
    const category = item.category || deriveCategory(item);
    const image = item.imageDataUrl || item.imageUrl || "../../assets/img/h6.jpeg";

    if (titleEl) titleEl.textContent = name;
    if (descriptionEl) descriptionEl.textContent = desc;
    if (durationEl) durationEl.textContent = duration;
    if (categoryEl) categoryEl.textContent = category;
    loadDetailImage(image, name);
    if (bookBtn) {
        bookBtn.href = `booking.html?service=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`;
    }
};

const init = async () => {
    const slug = new URLSearchParams(window.location.search).get("slug") || "";
    if (!slug) return;

    const fallback = fallbackServices.find((item) => item.slug === slug);

    try {
        const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const found = snapshot.docs
            .map((docItem) => docItem.data())
            .find((item) => {
                const itemSlug = item.slug || makeSlug(`${item.name || ""}-${item.duration || ""}`);
                return itemSlug === slug;
            });

        apply(found || fallback);
    } catch (error) {
        console.error("Could not load service detail", error);
        apply(fallback);
    }
};

init();
