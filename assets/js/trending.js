import { db } from "../../src/database/firebase.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const trendsGrid = document.getElementById("trendingGrid");
const trendCount = document.getElementById("trendCount");
const filterButtons = document.querySelectorAll("[data-trend-filter]");
const heroPreview = document.getElementById("heroPreview");

let allTrends = [];
let activeFilter = "All";

const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const makeSlug = (value) => String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const shortText = (value, max = 88) => {
    const text = String(value || "").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max).trim()}...`;
};

const buildServiceQuery = (trend) => encodeURIComponent(trend.title || "Trending Style");

const renderTrendCard = (trend, index) => {
    const title = escapeHtml(trend.title || "Trending Style");
    const category = escapeHtml(trend.category || "Beauty");
    const description = escapeHtml(shortText(trend.description || "A fresh trending look is now available."));
    const duration = escapeHtml(trend.duration || "60 min");
    const price = escapeHtml(trend.priceLabel || "KSh 50+");
    const image = escapeHtml(trend.imageDataUrl || trend.imageUrl || "../../assets/img/h6.jpeg");
    const service = buildServiceQuery(trend);
    const bookingCategory = encodeURIComponent(trend.category || "Beauty");
    const slug = encodeURIComponent(trend.slug || makeSlug(`${trend.title || "trend"}-${trend.category || "beauty"}`));

    return `
    <article class="group relative overflow-hidden rounded-3xl border border-primary/15 bg-white/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl dark:bg-surface/80" style="animation-delay:${index * 60}ms">
        <div class="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800 shadow">${price}</div>
        <div class="relative aspect-[4/3] overflow-hidden">
            <img src="${image}" alt="${title}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <span class="absolute left-4 top-4 rounded-full bg-primary/85 px-3 py-1 text-xs font-black uppercase tracking-widest text-background-dark">${category}</span>
            <h3 class="absolute bottom-4 left-4 right-4 text-xl font-black text-white">${title}</h3>
        </div>
        <div class="space-y-4 p-6">
            <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">${description}</p>
            <div class="flex items-center justify-between gap-3">
                <span class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">${duration}</span>
                <div class="flex items-center gap-2">
                    <a href="trend-detail.html?slug=${slug}" class="rounded-lg border border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all">Learn More</a>
                    <a href="booking.html?service=${service}&category=${bookingCategory}" class="rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-background-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30">Book</a>
                </div>
            </div>
        </div>
    </article>`;
};

const setHeroPreview = (trendList) => {
    if (!heroPreview) return;
    const first = trendList[0];
    if (!first) {
        heroPreview.textContent = "No styles in this category yet.";
        return;
    }

    const cat = escapeHtml(first.category || "Beauty");
    const title = escapeHtml(first.title || "Trending Style");
    heroPreview.innerHTML = `Top pick: <span class="font-black text-primary">${title}</span> in <span class="font-black">${cat}</span>`;
};

const renderGrid = () => {
    if (!trendsGrid) return;

    const filtered = activeFilter === "All"
        ? allTrends
        : allTrends.filter((item) => String(item.category || "").toLowerCase() === activeFilter.toLowerCase());

    if (trendCount) {
        trendCount.textContent = `${filtered.length} live inspiration styles`;
    }

    setHeroPreview(filtered);

    if (!filtered.length) {
        trendsGrid.innerHTML = '<div class="rounded-3xl border border-primary/20 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:bg-surface dark:text-slate-300">No styles found for this filter.</div>';
        return;
    }

    trendsGrid.innerHTML = filtered.map((item, index) => renderTrendCard(item, index)).join("");
};

const bindFilters = () => {
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.getAttribute("data-trend-filter") || "All";

            filterButtons.forEach((btn) => {
                const isActive = btn === button;
                btn.classList.toggle("bg-primary", isActive);
                btn.classList.toggle("text-background-dark", isActive);
                btn.classList.toggle("border-primary", isActive);
            });

            renderGrid();
        });
    });
};

const initTrendingPage = async () => {
    if (!trendsGrid) return;

    bindFilters();

    try {
        const trendQuery = query(collection(db, "trending"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(trendQuery);
        allTrends = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

        if (!allTrends.length) {
            if (trendCount) {
                trendCount.textContent = "0 live inspiration styles";
            }
            trendsGrid.innerHTML = '<div class="rounded-3xl border border-primary/15 bg-white dark:bg-surface p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">No trending styles yet. Check back soon.</div>';
            return;
        }

        renderGrid();
    } catch (error) {
        console.error("Could not load trending styles", error);
        trendsGrid.innerHTML = '<div class="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-10 text-center text-sm font-semibold text-rose-600">Could not load trending styles right now.</div>';
    }
};

initTrendingPage();
