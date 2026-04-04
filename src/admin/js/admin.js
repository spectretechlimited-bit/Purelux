import { db } from "../../database/firebase.js";
import { adminSignIn, adminSignOut, watchAuthState } from "../../database/auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DEFAULT_IMAGE = "../../assets/img/h6.jpeg";

const AdminApp = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.showSection("overview");
        this.setupAuthWatcher();
    },

    cacheDOM() {
        this.loginModal = document.getElementById("loginModal");
        this.loginForm = document.getElementById("loginForm");
        this.loginError = document.getElementById("loginError");
        this.logoutBtn = document.getElementById("logoutBtn");
        this.mainContent = document.getElementById("mainContent");
        this.adminSidebar = document.getElementById("adminSidebar");
        this.sidebarBackdrop = document.getElementById("sidebarBackdrop");
        this.sidebarOpenBtn = document.getElementById("sidebarOpenBtn");
        this.sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

        this.navLinks = document.querySelectorAll(".nav-link");
        this.sections = document.querySelectorAll(".admin-section");

        this.statBookings = document.getElementById("statBookings");
        this.statServices = document.getElementById("statServices");
        this.statClients = document.getElementById("statClients");

        this.analyticsPeriod = document.getElementById("analyticsPeriod");
        this.analyticsBookingsPeriod = document.getElementById("analyticsBookingsPeriod");
        this.analyticsMessagesPeriod = document.getElementById("analyticsMessagesPeriod");
        this.analyticsBookingsTotal = document.getElementById("analyticsBookingsTotal");
        this.analyticsMessagesTotal = document.getElementById("analyticsMessagesTotal");
        this.analyticsReviewsPeriod = document.getElementById("analyticsReviewsPeriod");
        this.analyticsReviewsTotal = document.getElementById("analyticsReviewsTotal");

        this.bookingsTableBody = document.getElementById("bookingsTableBody");
        this.allBookingsTableBody = document.getElementById("allBookingsTableBody");
        this.messagesTableBody = document.getElementById("messagesTableBody");
        this.reviewsTableBody = document.getElementById("reviewsTableBody");

        this.addServiceForm = document.getElementById("addServiceForm");
        this.serviceFormFeedback = document.getElementById("serviceFormFeedback");
        this.servicesAdminList = document.getElementById("servicesAdminList");
        this.serviceSlugInput = this.addServiceForm?.querySelector("input[name='serviceSlug']") || null;

        this.addTrendingForm = document.getElementById("addTrendingForm");
        this.trendingFormFeedback = document.getElementById("trendingFormFeedback");
        this.trendingAdminList = document.getElementById("trendingAdminList");
        this.trendSlugInput = this.addTrendingForm?.querySelector("input[name='trendSlug']") || null;

        this.actionFeedback = document.getElementById("adminActionFeedback");
    },

    bindEvents() {
        this.loginForm?.addEventListener("submit", (event) => this.handleLogin(event));
        this.logoutBtn?.addEventListener("click", () => this.handleLogout());
        this.addServiceForm?.addEventListener("submit", (event) => this.handleAddService(event));
        this.addTrendingForm?.addEventListener("submit", (event) => this.handleAddTrending(event));
        this.sidebarOpenBtn?.addEventListener("click", () => this.openSidebar());
        this.sidebarCloseBtn?.addEventListener("click", () => this.closeSidebar());
        this.sidebarBackdrop?.addEventListener("click", () => this.closeSidebar());

        this.initSlugPreview(this.addServiceForm, "serviceSlug", ["serviceName", "serviceDuration"]);
        this.initSlugPreview(this.addTrendingForm, "trendSlug", ["trendTitle", "trendCategory"]);

        this.navLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const sectionId = link.getAttribute("data-section");
                this.showSection(sectionId);
                this.closeSidebar();
            });
        });

        this.allBookingsTableBody?.addEventListener("click", async (event) => {
            const statusButton = event.target.closest("[data-set-booking-status]");
            if (statusButton) {
                const bookingId = statusButton.getAttribute("data-set-booking-status");
                const statusValue = statusButton.getAttribute("data-status-value");
                await this.updateBookingStatus(bookingId, statusValue);
                return;
            }

            const target = event.target.closest("[data-delete-booking]");
            if (!target) return;
            const bookingId = target.getAttribute("data-delete-booking");
            await this.deleteBooking(bookingId);
        });

        this.servicesAdminList?.addEventListener("click", async (event) => {
            const target = event.target.closest("[data-delete-service]");
            if (!target) return;
            const serviceId = target.getAttribute("data-delete-service");
            await this.deleteService(serviceId);
        });

        this.trendingAdminList?.addEventListener("click", async (event) => {
            const target = event.target.closest("[data-delete-trend]");
            if (!target) return;
            const trendId = target.getAttribute("data-delete-trend");
            await this.deleteTrend(trendId);
        });

        this.messagesTableBody?.addEventListener("click", async (event) => {
            const target = event.target.closest("[data-delete-message]");
            if (!target) return;
            const messageId = target.getAttribute("data-delete-message");
            await this.deleteMessage(messageId);
        });

        this.reviewsTableBody?.addEventListener("click", async (event) => {
            const target = event.target.closest("[data-delete-review]");
            if (!target) return;
            const reviewId = target.getAttribute("data-delete-review");
            await this.deleteReview(reviewId);
        });

        this.analyticsPeriod?.addEventListener("change", () => {
            this.renderAnalytics();
        });
    },

    setupAuthWatcher() {
        watchAuthState(async (user) => {
            const isLoggedIn = Boolean(user);
            this.setLoggedIn(isLoggedIn);
            if (isLoggedIn) {
                await this.loadAllData();
            }
        });
    },

    setLoggedIn(isLoggedIn) {
        if (isLoggedIn) {
            this.loginModal.classList.add("hidden");
            this.loginModal.classList.remove("flex");
            this.mainContent.classList.remove("blur-sm", "pointer-events-none");
            return;
        }

        this.loginModal.classList.remove("hidden");
        this.loginModal.classList.add("flex");
        this.mainContent.classList.add("blur-sm", "pointer-events-none");
    },

    async handleLogin(event) {
        event.preventDefault();
        const email = event.target.email.value.trim();
        const password = event.target.password.value;

        try {
            await adminSignIn(email, password);
            this.loginError.classList.add("hidden");
        } catch (error) {
            console.error("Admin login failed", error);
            this.loginError.textContent = "Login failed. Verify Firebase Auth admin credentials.";
            this.loginError.classList.remove("hidden");
        }
    },

    async handleLogout() {
        try {
            await adminSignOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    showSection(id) {
        this.sections.forEach((section) => {
            section.classList.toggle("hidden", section.id !== id);
        });

        this.navLinks.forEach((link) => {
            const isActive = link.getAttribute("data-section") === id;
            if (isActive) {
                link.classList.add("bg-primary", "text-background-dark");
                link.classList.remove("hover:bg-primary/10");
            } else {
                link.classList.remove("bg-primary", "text-background-dark");
                link.classList.add("hover:bg-primary/10");
            }
        });

        if (id === "overview") {
            this.renderOverviewCharts();
        }
        if (id === "analytics") {
            this.renderAnalytics();
        }

        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    },

    openSidebar() {
        if (!this.adminSidebar || !this.sidebarBackdrop) return;
        this.adminSidebar.classList.remove("-translate-x-full");
        this.adminSidebar.classList.add("translate-x-0");
        this.sidebarBackdrop.classList.remove("hidden", "opacity-0");
        this.sidebarBackdrop.classList.add("block", "opacity-100");
        document.body.classList.add("overflow-hidden");
    },

    closeSidebar() {
        if (!this.adminSidebar || !this.sidebarBackdrop) return;
        this.adminSidebar.classList.add("-translate-x-full");
        this.adminSidebar.classList.remove("translate-x-0");
        this.sidebarBackdrop.classList.add("opacity-0");
        this.sidebarBackdrop.classList.remove("opacity-100");
        window.setTimeout(() => {
            this.sidebarBackdrop.classList.add("hidden");
            this.sidebarBackdrop.classList.remove("block");
        }, 250);
        document.body.classList.remove("overflow-hidden");
    },

    async loadAllData() {
        await Promise.allSettled([
            this.loadOverviewStats(),
            this.loadRecentBookings(),
            this.loadAllBookings(),
            this.loadServicesAdminList(),
            this.loadTrendingAdminList(),
            this.loadMessages(),
            this.loadReviews(),
        ]);
    },

    showActionFeedback(message, tone = "success") {
        if (!this.actionFeedback) return;
        this.actionFeedback.textContent = message;
        this.actionFeedback.className = tone === "success"
            ? "mb-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600"
            : "mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600";
        this.actionFeedback.classList.remove("hidden");
        window.clearTimeout(this.feedbackTimeout);
        this.feedbackTimeout = window.setTimeout(() => {
            this.actionFeedback?.classList.add("hidden");
        }, 3500);
    },

    formatTimestamp(timestamp) {
        if (!timestamp) return "N/A";
        const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "N/A";
        return date.toLocaleString();
    },

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    createSlug(value) {
        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
    },

    initSlugPreview(form, slugFieldName, sourceFieldNames) {
        if (!form) return;
        const slugInput = form.querySelector(`input[name='${slugFieldName}']`);
        if (!slugInput) return;

        const recalc = () => {
            if (slugInput.dataset.manual === "1") return;
            const seed = sourceFieldNames
                .map((name) => String(form.elements[name]?.value || "").trim())
                .filter(Boolean)
                .join("-");
            slugInput.value = this.createSlug(seed);
        };

        sourceFieldNames.forEach((name) => {
            form.elements[name]?.addEventListener("input", recalc);
            form.elements[name]?.addEventListener("change", recalc);
        });

        slugInput.addEventListener("input", () => {
            slugInput.dataset.manual = "1";
        });

        slugInput.addEventListener("blur", () => {
            if (!slugInput.value.trim()) {
                slugInput.dataset.manual = "0";
                recalc();
            }
        });

        slugInput.dataset.manual = "0";
        recalc();
    },

    getEntryDate(data) {
        const raw = data?.createdAt;
        if (!raw) return null;
        const date = typeof raw.toDate === "function" ? raw.toDate() : new Date(raw);
        return Number.isNaN(date.getTime()) ? null : date;
    },

    isWithinDays(date, days) {
        if (!date) return false;
        const now = new Date();
        const threshold = new Date(now);
        threshold.setHours(0, 0, 0, 0);
        threshold.setDate(threshold.getDate() - (days - 1));
        return date >= threshold;
    },

    aggregateDailyCounts(entries, days) {
        const labels = [];
        const counts = [];
        const now = new Date();

        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const day = new Date(now);
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const dayStart = new Date(day);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            labels.push(day.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
            counts.push(entries.filter((entry) => {
                const date = this.getEntryDate(entry);
                return date && date >= dayStart && date <= dayEnd;
            }).length);
        }

        return { labels, counts };
    },

    getChartTheme() {
        const isDark = document.documentElement.classList.contains("dark");
        return {
            text: isDark ? "#cbd5e1" : "#64748b",
            grid: isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(100, 116, 139, 0.15)",
            primary: "#d790ee",
            secondary: "#7c83ff",
            success: "#34d399",
            warning: "#f59e0b",
            danger: "#f87171",
        };
    },

    async loadOverviewStats() {
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const messagesSnapshot = await getDocs(collection(db, "messages"));
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));

        this.bookingsEntries = bookingsSnapshot.docs.map((snap) => snap.data());
        this.servicesEntries = servicesSnapshot.docs.map((snap) => snap.data());
        this.messagesEntries = messagesSnapshot.docs.map((snap) => snap.data());
        this.reviewsEntries = reviewsSnapshot.docs.map((snap) => snap.data());

        const bookingsCount = bookingsSnapshot.size;
        const approvedBookingsCount = this.bookingsEntries.filter((entry) => String(entry.status || "pending").toLowerCase() === "approved").length;
        const messagesCount = messagesSnapshot.size;

        if (this.statBookings) this.statBookings.textContent = String(bookingsCount);
        if (this.statServices) this.statServices.textContent = String(approvedBookingsCount);
        if (this.statClients) this.statClients.textContent = String(messagesCount);

        this.renderOverviewCharts();
        this.renderAnalytics();
    },

    renderOverviewCharts() {
        if (typeof window.ApexCharts === "undefined") return;

        const theme = this.getChartTheme();
        const bookingsEntries = this.bookingsEntries || [];

        const bookingDaily = this.aggregateDailyCounts(bookingsEntries, 14);
        const bookingsOptions = {
            chart: {
                type: "area",
                height: 260,
                toolbar: { show: false },
                sparkline: { enabled: false },
                fontFamily: "Manrope, sans-serif",
            },
            series: [{ name: "Bookings", data: bookingDaily.counts }],
            xaxis: {
                categories: bookingDaily.labels,
                labels: { style: { colors: theme.text, fontSize: "11px" } },
            },
            yaxis: {
                min: 0,
                labels: { style: { colors: theme.text, fontSize: "11px" } },
            },
            stroke: { curve: "smooth", width: 3 },
            colors: [theme.primary],
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 0.3,
                    opacityFrom: 0.4,
                    opacityTo: 0.05,
                },
            },
            grid: { borderColor: theme.grid },
            dataLabels: { enabled: false },
            tooltip: { theme: document.documentElement.classList.contains("dark") ? "dark" : "light" },
        };

        const bookingsEl = document.getElementById("bookingsChart");
        if (bookingsEl) {
            if (this.bookingsChart) {
                this.bookingsChart.updateOptions(bookingsOptions, true, true);
            } else {
                this.bookingsChart = new window.ApexCharts(bookingsEl, bookingsOptions);
                this.bookingsChart.render();
            }
        }

        const serviceCounts = {};
        bookingsEntries.forEach((entry) => {
            const category = entry.serviceCategory || this.deriveCategoryFromText(entry.serviceDescription);
            serviceCounts[category] = (serviceCounts[category] || 0) + 1;
        });

        const servicePairs = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const serviceOptions = {
            chart: {
                type: "donut",
                height: 260,
                fontFamily: "Manrope, sans-serif",
            },
            labels: servicePairs.map(([label]) => `${label} Bookings`),
            series: servicePairs.map(([, count]) => count),
            colors: ["#d790ee", "#7c83ff", "#34d399", "#f59e0b", "#f87171", "#22d3ee"],
            legend: {
                position: "bottom",
                labels: { colors: theme.text },
            },
            dataLabels: { enabled: false },
            tooltip: { theme: document.documentElement.classList.contains("dark") ? "dark" : "light" },
            noData: { text: "No booking data yet" },
        };

        const servicesEl = document.getElementById("servicesChart");
        if (servicesEl) {
            if (this.servicesChart) {
                this.servicesChart.updateOptions(serviceOptions, true, true);
            } else {
                this.servicesChart = new window.ApexCharts(servicesEl, serviceOptions);
                this.servicesChart.render();
            }
        }
    },

    renderAnalytics() {
        const bookingsEntries = this.bookingsEntries || [];
        const messagesEntries = this.messagesEntries || [];
        const reviewsEntries = this.reviewsEntries || [];
        const days = Number(this.analyticsPeriod?.value || 30);

        const periodBookings = bookingsEntries.filter((entry) => this.isWithinDays(this.getEntryDate(entry), days));
        const periodMessages = messagesEntries.filter((entry) => this.isWithinDays(this.getEntryDate(entry), days));
        const periodReviews = reviewsEntries.filter((entry) => this.isWithinDays(this.getEntryDate(entry), days));

        if (this.analyticsBookingsPeriod) this.analyticsBookingsPeriod.textContent = String(periodBookings.length);
        if (this.analyticsMessagesPeriod) this.analyticsMessagesPeriod.textContent = String(periodMessages.length);
        if (this.analyticsBookingsTotal) this.analyticsBookingsTotal.textContent = String(bookingsEntries.length);
        if (this.analyticsMessagesTotal) this.analyticsMessagesTotal.textContent = String(messagesEntries.length);
        if (this.analyticsReviewsPeriod) this.analyticsReviewsPeriod.textContent = String(periodReviews.length);
        if (this.analyticsReviewsTotal) this.analyticsReviewsTotal.textContent = String(reviewsEntries.length);

        this.renderAnalyticsCharts(days, periodBookings, periodMessages, periodReviews);
    },

    renderAnalyticsCharts(days, periodBookings, periodMessages, periodReviews) {
        if (typeof window.ApexCharts === "undefined") return;
        const theme = this.getChartTheme();

        const bookingDaily = this.aggregateDailyCounts(periodBookings, days);
        const messageDaily = this.aggregateDailyCounts(periodMessages, days);

        const volumeOptions = {
            chart: {
                type: "bar",
                height: 300,
                stacked: false,
                toolbar: { show: false },
                fontFamily: "Manrope, sans-serif",
            },
            series: [
                { name: "Bookings", data: bookingDaily.counts },
                { name: "Messages", data: messageDaily.counts },
            ],
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    columnWidth: "52%",
                },
            },
            xaxis: {
                categories: bookingDaily.labels,
                labels: { style: { colors: theme.text, fontSize: "10px" } },
            },
            yaxis: {
                min: 0,
                labels: { style: { colors: theme.text, fontSize: "11px" } },
            },
            colors: [theme.primary, theme.secondary],
            grid: { borderColor: theme.grid },
            dataLabels: { enabled: false },
            legend: { position: "bottom", labels: { colors: theme.text } },
            tooltip: { theme: document.documentElement.classList.contains("dark") ? "dark" : "light" },
        };

        const volumeEl = document.getElementById("volumeChart");
        if (volumeEl) {
            if (this.volumeChart) {
                this.volumeChart.updateOptions(volumeOptions, true, true);
            } else {
                this.volumeChart = new window.ApexCharts(volumeEl, volumeOptions);
                this.volumeChart.render();
            }
        }

        const statusCounts = { pending: 0, approved: 0, rejected: 0 };
        periodBookings.forEach((entry) => {
            const key = String(entry.status || "pending").toLowerCase();
            if (key === "approved" || key === "rejected") {
                statusCounts[key] += 1;
            } else {
                statusCounts.pending += 1;
            }
        });

        const statusOptions = {
            chart: {
                type: "donut",
                height: 280,
                fontFamily: "Manrope, sans-serif",
            },
            labels: ["Pending", "Approved", "Rejected"],
            series: [statusCounts.pending, statusCounts.approved, statusCounts.rejected],
            colors: [theme.warning, theme.success, theme.danger],
            legend: { position: "bottom", labels: { colors: theme.text } },
            dataLabels: { enabled: false },
            noData: { text: "No booking data" },
        };

        const statusEl = document.getElementById("analyticsStatusChart");
        if (statusEl) {
            if (this.analyticsStatusChart) {
                this.analyticsStatusChart.updateOptions(statusOptions, true, true);
            } else {
                this.analyticsStatusChart = new window.ApexCharts(statusEl, statusOptions);
                this.analyticsStatusChart.render();
            }
        }

        const methodCounts = { "Phone call": 0, Email: 0, WhatsApp: 0 };
        periodBookings.forEach((entry) => {
            const method = String(entry.communicationMethod || "Phone call").trim();
            if (methodCounts[method] !== undefined) {
                methodCounts[method] += 1;
            } else {
                methodCounts["Phone call"] += 1;
            }
        });

        const contactOptions = {
            chart: {
                type: "bar",
                height: 280,
                toolbar: { show: false },
                fontFamily: "Manrope, sans-serif",
            },
            series: [{
                name: "Requests",
                data: [methodCounts["Phone call"], methodCounts.Email, methodCounts.WhatsApp],
            }],
            xaxis: {
                categories: ["Phone", "Email", "WhatsApp"],
                labels: { style: { colors: theme.text } },
            },
            yaxis: {
                min: 0,
                labels: { style: { colors: theme.text } },
            },
            colors: [theme.primary],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    distributed: true,
                },
            },
            grid: { borderColor: theme.grid },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: { theme: document.documentElement.classList.contains("dark") ? "dark" : "light" },
        };

        const contactEl = document.getElementById("analyticsContactChart");
        if (contactEl) {
            if (this.analyticsContactChart) {
                this.analyticsContactChart.updateOptions(contactOptions, true, true);
            } else {
                this.analyticsContactChart = new window.ApexCharts(contactEl, contactOptions);
                this.analyticsContactChart.render();
            }
        }

        const reviewBuckets = [0, 0, 0, 0, 0];
        periodReviews.forEach((entry) => {
            const rating = Number(entry.rating || 0);
            if (rating >= 1 && rating <= 5) {
                reviewBuckets[rating - 1] += 1;
            }
        });

        const reviewOptions = {
            chart: {
                type: "bar",
                height: 280,
                toolbar: { show: false },
                fontFamily: "Manrope, sans-serif",
            },
            series: [{ name: "Reviews", data: reviewBuckets }],
            xaxis: {
                categories: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
                labels: { style: { colors: theme.text } },
            },
            yaxis: {
                min: 0,
                labels: { style: { colors: theme.text } },
            },
            colors: [theme.primary],
            plotOptions: { bar: { borderRadius: 8 } },
            grid: { borderColor: theme.grid },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: { theme: document.documentElement.classList.contains("dark") ? "dark" : "light" },
        };

        const reviewEl = document.getElementById("analyticsReviewChart");
        if (reviewEl) {
            if (this.analyticsReviewChart) {
                this.analyticsReviewChart.updateOptions(reviewOptions, true, true);
            } else {
                this.analyticsReviewChart = new window.ApexCharts(reviewEl, reviewOptions);
                this.analyticsReviewChart.render();
            }
        }
    },

    renderStatusBadge(status) {
        const normalized = String(status || "pending").toLowerCase();
        if (normalized === "approved") {
            return '<span class="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold uppercase tracking-widest">Approved</span>';
        }
        if (normalized === "rejected") {
            return '<span class="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-widest">Rejected</span>';
        }
        return '<span class="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold uppercase tracking-widest">Pending</span>';
    },

    deriveCategoryFromText(text) {
        const value = String(text || "").toLowerCase();
        if (/hair|braid|cornrow|twist|silk|blow|loc/.test(value)) return "Hair";
        if (/nail|manicure|pedicure|gel|acrylic|polish/.test(value)) return "Nails";
        if (/facial|makeup|lashes|brow|wax|spa/.test(value)) return "Beauty";
        return "Other";
    },

    renderStars(rating) {
        const safeRating = Math.max(1, Math.min(5, Number(rating || 1)));
        return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
    },

    async loadRecentBookings() {
        if (!this.bookingsTableBody) return;

        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(6));
        const snapshot = await getDocs(q);

        this.bookingsTableBody.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            this.bookingsTableBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr class="group hover:bg-primary/5 transition-colors">
                    <td class="px-8 py-6 font-bold">${this.escapeHtml(data.clientName || "N/A")}</td>
                    <td class="px-8 py-6">${this.escapeHtml(data.serviceDescription || "N/A")}</td>
                    <td class="px-8 py-6 opacity-60">${this.escapeHtml(`${data.date || ""} ${data.time || ""}`.trim() || this.formatTimestamp(data.createdAt))}</td>
                    <td class="px-8 py-6">${this.renderStatusBadge(data.status)}</td>
                    <td class="px-8 py-6 text-right text-xs font-bold text-slate-400">Latest</td>
                </tr>
                `,
            );
        });

        if (snapshot.empty) {
            this.bookingsTableBody.innerHTML = '<tr><td colspan="5" class="px-8 py-8 text-center text-slate-400 font-semibold">No bookings yet.</td></tr>';
        }
    },

    async loadAllBookings() {
        if (!this.allBookingsTableBody) return;

        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        this.allBookingsTableBody.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            this.allBookingsTableBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr class="hover:bg-primary/5 transition-colors">
                    <td class="px-6 py-4 font-semibold">${this.escapeHtml(data.clientName || "N/A")}</td>
                    <td class="px-6 py-4">${this.escapeHtml(data.phone || "N/A")}</td>
                    <td class="px-6 py-4">
                        <div class="font-semibold">${this.escapeHtml(data.serviceDescription || "N/A")}</div>
                        <div class="mt-1 text-xs font-bold uppercase tracking-widest text-primary">${this.escapeHtml(data.serviceCategory || this.deriveCategoryFromText(data.serviceDescription))}</div>
                    </td>
                    <td class="px-6 py-4">${this.escapeHtml(`${data.date || ""} ${data.time || ""}`.trim())}</td>
                    <td class="px-6 py-4">${this.renderStatusBadge(data.status)}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button data-set-booking-status="${row.id}" data-status-value="approved" class="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/20">Approve</button>
                            <button data-set-booking-status="${row.id}" data-status-value="rejected" class="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-amber-600 hover:bg-amber-500/20">Reject</button>
                            <button data-delete-booking="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
                        </div>
                    </td>
                </tr>
                `,
            );
        });

        if (snapshot.empty) {
            this.allBookingsTableBody.innerHTML = '<tr><td colspan="6" class="px-8 py-8 text-center text-slate-400 font-semibold">No bookings found.</td></tr>';
        }
    },

    async deleteBooking(bookingId) {
        const confirmed = window.confirm("Delete this booking permanently?");
        if (!confirmed) return;
        try {
            await deleteDoc(doc(db, "bookings", bookingId));
            this.showActionFeedback("Booking deleted successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to delete booking", error);
            this.showActionFeedback("Could not delete booking. Check your admin permissions.", "error");
        }
    },

    async updateBookingStatus(bookingId, status) {
        const safeStatus = String(status || "").toLowerCase();
        if (!["approved", "rejected", "pending"].includes(safeStatus)) return;

        try {
            await updateDoc(doc(db, "bookings", bookingId), { status: safeStatus });
            this.showActionFeedback(`Booking marked ${safeStatus}.`);
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to update booking status", error);
            this.showActionFeedback("Could not update booking status. Check your admin permissions.", "error");
        }
    },

    async resizeImageToDataUrl(file, maxEdge = 1200, quality = 0.82) {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = dataUrl;
        });

        let { width, height } = image;
        if (width > maxEdge || height > maxEdge) {
            const scale = Math.min(maxEdge / width, maxEdge / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return dataUrl;

        ctx.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", quality);
    },

    async resolveImagePayload(urlValue, fileInput) {
        const imageUrl = String(urlValue || "").trim();
        const file = fileInput?.files?.[0];

        if (file) {
            const imageDataUrl = await this.resizeImageToDataUrl(file);
            return { imageUrl: "", imageDataUrl };
        }

        if (imageUrl) {
            return { imageUrl, imageDataUrl: "" };
        }

        return { imageUrl: DEFAULT_IMAGE, imageDataUrl: "" };
    },

    async handleAddService(event) {
        event.preventDefault();
        const formData = new FormData(this.addServiceForm);
        const imagePayload = await this.resolveImagePayload(
            formData.get("serviceImage"),
            this.addServiceForm.querySelector("input[name='serviceImageFile']"),
        );

        const payload = {
            name: String(formData.get("serviceName") || "").trim(),
            priceLabel: String(formData.get("servicePrice") || "").trim(),
            duration: String(formData.get("serviceDuration") || "").trim(),
            imageUrl: imagePayload.imageUrl,
            imageDataUrl: imagePayload.imageDataUrl,
            description: String(formData.get("serviceDescription") || "").trim(),
            slug: this.createSlug(String(formData.get("serviceSlug") || "").trim() || `${String(formData.get("serviceName") || "").trim()}-${String(formData.get("serviceDuration") || "").trim()}`),
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, "services"), payload);
            this.addServiceForm.reset();
            if (this.serviceSlugInput) {
                this.serviceSlugInput.dataset.manual = "0";
                this.serviceSlugInput.value = "";
            }
            if (this.serviceFormFeedback) {
                this.serviceFormFeedback.textContent = "Service added successfully.";
                this.serviceFormFeedback.className = "mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600";
            }
            this.showActionFeedback("Service created successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to add service", error);
            if (this.serviceFormFeedback) {
                this.serviceFormFeedback.textContent = "Failed to add service.";
                this.serviceFormFeedback.className = "mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600";
            }
            this.showActionFeedback("Could not create service. Check your admin permissions.", "error");
        }
    },

    async loadServicesAdminList() {
        if (!this.servicesAdminList) return;
        const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        this.servicesAdminList.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            const imageSource = data.imageDataUrl || data.imageUrl || DEFAULT_IMAGE;
            this.servicesAdminList.insertAdjacentHTML(
                "beforeend",
                `
                <div class="rounded-2xl border border-primary/10 bg-white dark:bg-background-dark/40 p-5">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3">
                            <img src="${this.escapeHtml(imageSource)}" alt="Service image" class="h-16 w-16 rounded-xl object-cover border border-primary/10" />
                            <div>
                                <h4 class="text-lg font-black">${this.escapeHtml(data.name || "Unnamed Service")}</h4>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${this.escapeHtml(data.description || "No description")}</p>
                                <p class="mt-3 text-xs font-black uppercase tracking-wider text-primary">${this.escapeHtml(data.priceLabel || "")}${data.duration ? ` • ${this.escapeHtml(data.duration)}` : ""}</p>
                            </div>
                        </div>
                        <button data-delete-service="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
                    </div>
                </div>
                `,
            );
        });

        if (snapshot.empty) {
            this.servicesAdminList.innerHTML = '<div class="rounded-2xl border border-primary/10 bg-white dark:bg-background-dark/40 p-5 text-sm font-semibold text-slate-400">No services created yet.</div>';
        }
    },

    async deleteService(serviceId) {
        const confirmed = window.confirm("Delete this service?");
        if (!confirmed) return;
        try {
            await deleteDoc(doc(db, "services", serviceId));
            this.showActionFeedback("Service deleted successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to delete service", error);
            this.showActionFeedback("Could not delete service. Check your admin permissions.", "error");
        }
    },

    async handleAddTrending(event) {
        event.preventDefault();
        const formData = new FormData(this.addTrendingForm);
        const imagePayload = await this.resolveImagePayload(
            formData.get("trendImage"),
            this.addTrendingForm.querySelector("input[name='trendImageFile']"),
        );

        const payload = {
            title: String(formData.get("trendTitle") || "").trim(),
            category: String(formData.get("trendCategory") || "").trim(),
            priceLabel: String(formData.get("trendPrice") || "").trim(),
            duration: String(formData.get("trendDuration") || "").trim(),
            imageUrl: imagePayload.imageUrl,
            imageDataUrl: imagePayload.imageDataUrl,
            description: String(formData.get("trendDescription") || "").trim(),
            slug: this.createSlug(String(formData.get("trendSlug") || "").trim() || `${String(formData.get("trendTitle") || "").trim()}-${String(formData.get("trendCategory") || "").trim()}`),
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, "trending"), payload);
            this.addTrendingForm.reset();
            if (this.trendSlugInput) {
                this.trendSlugInput.dataset.manual = "0";
                this.trendSlugInput.value = "";
            }
            if (this.trendingFormFeedback) {
                this.trendingFormFeedback.textContent = "Trending style added successfully.";
                this.trendingFormFeedback.className = "mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600";
            }
            this.showActionFeedback("Trending style created successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to add trending style", error);
            if (this.trendingFormFeedback) {
                this.trendingFormFeedback.textContent = "Failed to add trending style.";
                this.trendingFormFeedback.className = "mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600";
            }
            this.showActionFeedback("Could not create trending style. Check your admin permissions.", "error");
        }
    },

    async loadTrendingAdminList() {
        if (!this.trendingAdminList) return;
        const q = query(collection(db, "trending"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        this.trendingAdminList.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            const imageSource = data.imageDataUrl || data.imageUrl || DEFAULT_IMAGE;
            this.trendingAdminList.insertAdjacentHTML(
                "beforeend",
                `
                <div class="rounded-2xl border border-primary/10 bg-white dark:bg-background-dark/40 p-5">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3">
                            <img src="${this.escapeHtml(imageSource)}" alt="Trending style image" class="h-16 w-16 rounded-xl object-cover border border-primary/10" />
                            <div>
                                <h4 class="text-lg font-black">${this.escapeHtml(data.title || "Untitled Trend")}</h4>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${this.escapeHtml(data.description || "No description")}</p>
                                <p class="mt-2 text-xs font-black uppercase tracking-wider text-primary">${this.escapeHtml(data.category || "Beauty")} • ${this.escapeHtml(data.priceLabel || "")} • ${this.escapeHtml(data.duration || "")}</p>
                                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Booking label: ${this.escapeHtml(data.title || "N/A")}</p>
                            </div>
                        </div>
                        <button data-delete-trend="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
                    </div>
                </div>
                `,
            );
        });

        if (snapshot.empty) {
            this.trendingAdminList.innerHTML = '<div class="rounded-2xl border border-primary/10 bg-white dark:bg-background-dark/40 p-5 text-sm font-semibold text-slate-400">No trending styles created yet.</div>';
        }
    },

    async deleteTrend(trendId) {
        const confirmed = window.confirm("Delete this trending style?");
        if (!confirmed) return;
        try {
            await deleteDoc(doc(db, "trending", trendId));
            this.showActionFeedback("Trending style deleted successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to delete trending style", error);
            this.showActionFeedback("Could not delete trending style. Check your admin permissions.", "error");
        }
    },

    async loadMessages() {
        if (!this.messagesTableBody) return;
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(100));
        const snapshot = await getDocs(q);

        this.messagesTableBody.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            this.messagesTableBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr class="hover:bg-primary/5 transition-colors">
                    <td class="px-6 py-4 font-semibold">${this.escapeHtml(data.name || "N/A")}</td>
                    <td class="px-6 py-4 break-all">${this.escapeHtml(data.email || "N/A")}</td>
                    <td class="px-6 py-4">${this.escapeHtml(data.phone || "N/A")}</td>
                    <td class="px-6 py-4">${this.escapeHtml(data.subject || "General")}</td>
                    <td class="px-6 py-4 max-w-xs break-words">${this.escapeHtml(data.message || "")}</td>
                    <td class="px-6 py-4 text-xs text-slate-400">${this.escapeHtml(this.formatTimestamp(data.createdAt))}</td>
                    <td class="px-6 py-4 text-right">
                        <button data-delete-message="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
                    </td>
                </tr>
                `,
            );
        });

        if (snapshot.empty) {
            this.messagesTableBody.innerHTML = '<tr><td colspan="7" class="px-8 py-8 text-center text-slate-400 font-semibold">No contact messages yet.</td></tr>';
        }
    },

    async deleteMessage(messageId) {
        const confirmed = window.confirm("Delete this message?");
        if (!confirmed) return;
        try {
            await deleteDoc(doc(db, "messages", messageId));
            this.showActionFeedback("Message deleted successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to delete message", error);
            this.showActionFeedback("Could not delete message. Check your admin permissions.", "error");
        }
    },

    async loadReviews() {
        if (!this.reviewsTableBody) return;
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(150));
        const snapshot = await getDocs(q);

        this.reviewsTableBody.innerHTML = "";

        snapshot.forEach((row) => {
            const data = row.data();
            const name = data.isAnonymous ? "Anonymous" : (data.authorName || "Anonymous");
            this.reviewsTableBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr class="hover:bg-primary/5 transition-colors">
                    <td class="px-6 py-4 font-semibold">${this.escapeHtml(name)}</td>
                    <td class="px-6 py-4 text-amber-500 font-bold">${this.escapeHtml(this.renderStars(data.rating))}</td>
                    <td class="px-6 py-4 max-w-lg break-words">${this.escapeHtml(data.comment || "")}</td>
                    <td class="px-6 py-4 text-xs text-slate-400">${this.escapeHtml(this.formatTimestamp(data.createdAt))}</td>
                    <td class="px-6 py-4 text-right">
                        <button data-delete-review="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
                    </td>
                </tr>
                `,
            );
        });

        if (snapshot.empty) {
            this.reviewsTableBody.innerHTML = '<tr><td colspan="5" class="px-8 py-8 text-center text-slate-400 font-semibold">No reviews submitted yet.</td></tr>';
        }
    },

    async deleteReview(reviewId) {
        const confirmed = window.confirm("Delete this review?");
        if (!confirmed) return;
        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            this.showActionFeedback("Review deleted successfully.");
            await this.loadAllData();
        } catch (error) {
            console.error("Failed to delete review", error);
            this.showActionFeedback("Could not delete review. Check your admin permissions.", "error");
        }
    },
};

document.addEventListener("DOMContentLoaded", () => AdminApp.init());
