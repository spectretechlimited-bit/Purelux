import { auth, db } from '../../database/firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const AdminApp = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAuth();
    },

    cacheDOM() {
        this.loginModal = document.getElementById('loginModal');
        this.loginForm = document.getElementById('loginForm');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.mainContent = document.getElementById('mainContent');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.admin-section');
        
        // Stats
        this.statBookings = document.getElementById('statBookings');
        this.statServices = document.getElementById('statServices');
        this.statClients = document.getElementById('statClients');
        
        // Table body
        this.bookingsTableBody = document.getElementById('bookingsTableBody');
    },

    bindEvents() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.showSection(sectionId);
            });
        });
    },

    checkAuth() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.loginModal.classList.add('hidden');
                this.mainContent.classList.remove('blur-sm', 'pointer-events-none');
                this.loadDashboardData();
            } else {
                this.loginModal.classList.remove('hidden');
                this.mainContent.classList.add('blur-sm', 'pointer-events-none');
            }
        });
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const errorMsg = document.getElementById('loginError');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            errorMsg.classList.add('hidden');
        } catch (error) {
            errorMsg.textContent = "Invalid credentials. Please try again.";
            errorMsg.classList.remove('hidden');
        }
    },

    async handleLogout() {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    showSection(id) {
        this.sections.forEach(section => {
            section.classList.toggle('hidden', section.id !== id);
        });

        this.navLinks.forEach(link => {
            const isActive = link.getAttribute('data-section') === id;
            if (isActive) {
                link.classList.add('bg-primary', 'text-background-dark');
                link.classList.remove('hover:bg-primary/10');
            } else {
                link.classList.remove('bg-primary', 'text-background-dark');
                link.classList.add('hover:bg-primary/10');
            }
        });
    },

    async loadDashboardData() {
        try {
            // Fetch Recent Bookings
            const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(5));
            const querySnapshot = await getDocs(q);
            
            this.bookingsTableBody.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.renderBookingRow(data);
            });

            // Update Stats (Simplified for now)
            this.statBookings.textContent = querySnapshot.size;
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    },

    renderBookingRow(data) {
        const row = `
            <tr class="group hover:bg-primary/5 transition-colors">
                <td class="px-8 py-6 font-bold">${data.clientName || 'N/A'}</td>
                <td class="px-8 py-6">${data.service || 'N/A'}</td>
                <td class="px-8 py-6 opacity-60">${data.date || 'N/A'}</td>
                <td class="px-8 py-6">
                    <span class="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold uppercase tracking-widest">${data.status || 'Pending'}</span>
                </td>
                <td class="px-8 py-6 text-right">
                    <button class="text-emerald-500 font-bold hover:bg-emerald-500/10 px-4 py-2 rounded-xl transition-all">Action</button>
                </td>
            </tr>
        `;
        this.bookingsTableBody.insertAdjacentHTML('beforeend', row);
    }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());
