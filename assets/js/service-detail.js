import { db } from "../../src/database/firebase.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const fallbackServices = [
    {
        slug: "intricate-braiding-120-min",
        name: "Intricate Braiding",
        duration: "120 min",
        priceLabel: "KSh 85+",
        imageUrl: "../../assets/img/h1.jpeg",
        description: "Custom patterns, goddess braids, and premium extensions designed to protect your natural hair while delivering a polished, long-lasting look.",
    },
    {
        slug: "signature-styling-60-min",
        name: "Signature Styling",
        duration: "60 min",
        priceLabel: "KSh 60+",
        imageUrl: "../../assets/img/h2.jpeg",
        description: "Precision cuts, voluminous blowouts, and silk press styling tailored to your face shape, routine, and event goals.",
    },
    {
        slug: "vibrant-coloring-180-min",
        name: "Vibrant Coloring",
        duration: "180 min",
        priceLabel: "KSh 120+",
        imageUrl: "../../assets/img/h3.jpeg",
        description: "From soft balayage to bold statement shades, our coloring service blends creativity and hair health for standout results.",
    },
    {
        slug: "luxury-spa-care-90-min",
        name: "Luxury Spa Care",
        duration: "90 min",
        priceLabel: "KSh 95+",
        imageUrl: "../../assets/img/h4.jpeg",
        description: "A restorative scalp and strand treatment that deeply hydrates, revives texture, and supports healthier growth.",
    },
    {
        slug: "bridal-gala-updos-150-min",
        name: "Bridal & Gala Updos",
        duration: "150 min",
        priceLabel: "KSh 150+",
        imageUrl: "../../assets/img/h5.jpeg",
        description: "Elegant event-ready updos designed for comfort, hold, and camera-ready finish through your full celebration.",
    },
    {
        slug: "keratin-fusion-210-min",
        name: "Keratin Fusion",
        duration: "210 min",
        priceLabel: "KSh 200+",
        imageUrl: "../../assets/img/h6.jpeg",
        description: "A smoothing treatment that fights frizz and leaves hair sleek, glossy, and easier to manage for weeks.",
    },
];

const titleEl = document.getElementById("detailTitle");
const descriptionEl = document.getElementById("detailDescription");
const durationEl = document.getElementById("detailDuration");
const priceEl = document.getElementById("detailPrice");
const categoryEl = document.getElementById("detailCategory");
const imageEl = document.getElementById("detailImage");
const bookBtn = document.getElementById("detailBookBtn");

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
    const price = item.priceLabel || "KSh 50+";
    const category = item.category || deriveCategory(item);
    const image = item.imageDataUrl || item.imageUrl || "../../assets/img/h6.jpeg";

    if (titleEl) titleEl.textContent = name;
    if (descriptionEl) descriptionEl.textContent = desc;
    if (durationEl) durationEl.textContent = duration;
    if (priceEl) priceEl.textContent = price;
    if (categoryEl) categoryEl.textContent = category;
    if (imageEl) {
        imageEl.src = image;
        imageEl.alt = name;
    }
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
