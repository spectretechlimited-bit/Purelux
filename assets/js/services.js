import { db } from "../../src/database/firebase.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const mainServicesGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');
const dynamicContainer = document.getElementById("dynamicServicesGrid");

const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderDynamicService = (service) => {
    const name = escapeHtml(service.name || "New Service");
    const description = escapeHtml(service.description || "Premium service available now.");
    const price = escapeHtml(service.priceLabel || "KSh 50+");
    const duration = escapeHtml(service.duration || "60 min");
    const imageUrl = escapeHtml(service.imageDataUrl || service.imageUrl || "../../assets/img/h6.jpeg");

    return `
    <div class="group relative flex flex-col bg-white dark:bg-slate-900/50 rounded-xl overflow-hidden border border-primary/20 hover:border-primary/50 transition-all">
        <div class="aspect-square w-full relative overflow-hidden">
            <img alt="${name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${imageUrl}"/>
            <div class="absolute top-4 right-4 bg-background-dark/80 backdrop-blur-md px-3 py-1 rounded-lg text-primary text-sm font-bold">${price}</div>
        </div>
        <div class="p-6 flex flex-col grow">
            <h3 class="text-xl font-bold mb-2">${name}</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 grow">${description}</p>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center text-xs text-slate-400">
                    <span class="material-symbols-outlined text-sm mr-1">schedule</span> ${duration}
                </div>
                <a class="bg-primary text-background-dark font-bold px-6 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all" href="booking.html">Book Now</a>
            </div>
        </div>
    </div>`;
};

const initDynamicServices = async () => {
    if (!mainServicesGrid) return;

    try {
        const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // Append admin-added services to the main grid
        const adminServicesHtml = snapshot.docs.map((doc) => renderDynamicService(doc.data())).join("");
        mainServicesGrid.innerHTML += adminServicesHtml;
    } catch (error) {
        console.error("Could not load dynamic services", error);
    }
};

initDynamicServices();
