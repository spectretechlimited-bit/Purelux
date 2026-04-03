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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

        this.bookingsTableBody = document.getElementById("bookingsTableBody");
        this.allBookingsTableBody = document.getElementById("allBookingsTableBody");
        this.messagesTableBody = document.getElementById("messagesTableBody");

        this.addServiceForm = document.getElementById("addServiceForm");
        this.serviceFormFeedback = document.getElementById("serviceFormFeedback");
        this.servicesAdminList = document.getElementById("servicesAdminList");
        this.actionFeedback = document.getElementById("adminActionFeedback");
    },

    bindEvents() {
        this.loginForm?.addEventListener("submit", (event) => this.handleLogin(event));
        this.logoutBtn?.addEventListener("click", () => this.handleLogout());
        this.addServiceForm?.addEventListener("submit", (event) => this.handleAddService(event));

        this.navLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const sectionId = link.getAttribute("data-section");
                this.showSection(sectionId);
            });
        });

        this.allBookingsTableBody?.addEventListener("click", async (event) => {
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

        this.messagesTableBody?.addEventListener("click", async (event) => {
            const target = event.target.closest("[data-delete-message]");
            if (!target) return;
            const messageId = target.getAttribute("data-delete-message");
            await this.deleteMessage(messageId);
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
    },

    async loadAllData() {
        await Promise.allSettled([
            this.loadOverviewStats(),
            this.loadRecentBookings(),
            this.loadAllBookings(),
            this.loadServicesAdminList(),
            this.loadMessages(),
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

        this.bookingsEntries = bookingsSnapshot.docs.map((snap) => snap.data());
        this.servicesEntries = servicesSnapshot.docs.map((snap) => snap.data());
        this.messagesEntries = messagesSnapshot.docs.map((snap) => snap.data());

        const bookingsCount = bookingsSnapshot.size;
        const servicesCount = servicesSnapshot.size;
        const messagesCount = messagesSnapshot.size;

        if (this.statBookings) this.statBookings.textContent = String(bookingsCount);
        if (this.statServices) this.statServices.textContent = String(servicesCount);
        if (this.statClients) this.statClients.textContent = String(messagesCount);

        const bookingsProgress = Math.min((bookingsCount / 100) * 100, 100);
        const servicesProgress = Math.min((servicesCount / 50) * 100, 100);
        const messagesProgress = Math.min((messagesCount / 100) * 100, 100);

        const bookingsProgressBar = document.getElementById("bookingsProgress");
        const servicesProgressBar = document.getElementById("servicesProgress");
        const messagesProgressBar = document.getElementById("messagesProgress");

        if (bookingsProgressBar) bookingsProgressBar.style.width = `${bookingsProgress}%`;
        if (servicesProgressBar) servicesProgressBar.style.width = `${servicesProgress}%`;
        if (messagesProgressBar) messagesProgressBar.style.width = `${messagesProgress}%`;

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
            const raw = (entry.serviceDescription || "General").trim();
            const name = raw.length > 18 ? `${raw.slice(0, 18)}...` : raw;
            serviceCounts[name || "General"] = (serviceCounts[name || "General"] || 0) + 1;
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
            labels: servicePairs.map(([label]) => label),
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
        const days = Number(this.analyticsPeriod?.value || 30);

        const periodBookings = bookingsEntries.filter((entry) => this.isWithinDays(this.getEntryDate(entry), days));
        const periodMessages = messagesEntries.filter((entry) => this.isWithinDays(this.getEntryDate(entry), days));

        if (this.analyticsBookingsPeriod) this.analyticsBookingsPeriod.textContent = String(periodBookings.length);
        if (this.analyticsMessagesPeriod) this.analyticsMessagesPeriod.textContent = String(periodMessages.length);
        if (this.analyticsBookingsTotal) this.analyticsBookingsTotal.textContent = String(bookingsEntries.length);
        if (this.analyticsMessagesTotal) this.analyticsMessagesTotal.textContent = String(messagesEntries.length);

        this.renderAnalyticsCharts(days, periodBookings, periodMessages);
    },

    renderAnalyticsCharts(days, periodBookings, periodMessages) {
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
                    <td class="px-6 py-4">${this.escapeHtml(data.serviceDescription || "N/A")}</td>
                    <td class="px-6 py-4">${this.escapeHtml(`${data.date || ""} ${data.time || ""}`.trim())}</td>
                    <td class="px-6 py-4">${this.renderStatusBadge(data.status)}</td>
                    <td class="px-6 py-4 text-right">
                        <button data-delete-booking="${row.id}" class="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20">Delete</button>
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

    async handleAddService(event) {
        event.preventDefault();
        const formData = new FormData(this.addServiceForm);

        const payload = {
            name: String(formData.get("serviceName") || "").trim(),
            priceLabel: String(formData.get("servicePrice") || "").trim(),
            duration: String(formData.get("serviceDuration") || "").trim(),
            imageUrl: String(formData.get("serviceImage") || "").trim(),
            description: String(formData.get("serviceDescription") || "").trim(),
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, "services"), payload);
            this.addServiceForm.reset();
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
            this.servicesAdminList.insertAdjacentHTML(
                "beforeend",
                `
                <div class="rounded-2xl border border-primary/10 bg-white dark:bg-background-dark/40 p-5">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h4 class="text-lg font-black">${this.escapeHtml(data.name || "Unnamed Service")}</h4>
                            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${this.escapeHtml(data.description || "No description")}</p>
                            <p class="mt-3 text-xs font-black uppercase tracking-wider text-primary">${this.escapeHtml(data.priceLabel || "")}${data.duration ? ` • ${this.escapeHtml(data.duration)}` : ""}</p>
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
};

document.addEventListener("DOMContentLoaded", () => AdminApp.init());
