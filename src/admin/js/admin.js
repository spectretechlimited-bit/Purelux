const TEST_EMAIL = 'admin@purelux.com';
const TEST_PASSWORD = '12345';
const LOCAL_SESSION_KEY = 'purelux_admin_session';

const AdminApp = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.applyDevDefaults();
        this.boot();
    },

    async boot() {
        this.firebase = null;
        this.authMode = 'local';

        // Try Firebase first (if configured). If not, use local test auth.
        await this.tryInitFirebase();

        if (this.authMode === 'local') {
            this.setLoggedIn(this.getLocalSession());
            if (this.getLocalSession()) this.loadDashboardData();
        }

        this.showSection('overview');
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

    applyDevDefaults() {
        // Only prefill on local dev.
        const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
        if (!isLocal) return;

        const emailInput = this.loginForm?.querySelector('input[name="email"]');
        const passwordInput = this.loginForm?.querySelector('input[name="password"]');
        if (emailInput && !emailInput.value) emailInput.value = TEST_EMAIL;
        if (passwordInput && !passwordInput.value) passwordInput.value = TEST_PASSWORD;
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

    async tryInitFirebase() {
        try {
            const [{ auth, db }, authMod, firestoreMod] = await Promise.all([
                import('../../database/firebase.js'),
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
            ]);

            if (!auth || !db) throw new Error('Firebase not initialized');

            this.firebase = {
                auth,
                db,
                ...authMod,
                ...firestoreMod,
            };
            this.authMode = 'firebase';

            this.firebase.onAuthStateChanged(this.firebase.auth, (user) => {
                const isLoggedIn = Boolean(user);
                this.setLoggedIn(isLoggedIn);
                if (isLoggedIn) this.loadDashboardData();
            });
        } catch (error) {
            // Firebase not configured or failed to load; fallback to local testing.
            this.firebase = null;
            this.authMode = 'local';
        }
    },

    getLocalSession() {
        return localStorage.getItem(LOCAL_SESSION_KEY) === '1';
    },

    setLocalSession(isLoggedIn) {
        if (isLoggedIn) localStorage.setItem(LOCAL_SESSION_KEY, '1');
        else localStorage.removeItem(LOCAL_SESSION_KEY);
    },

    setLoggedIn(isLoggedIn) {
        if (isLoggedIn) {
            this.loginModal.classList.add('hidden');
            this.loginModal.classList.remove('flex');
            this.mainContent.classList.remove('blur-sm', 'pointer-events-none');
        } else {
            this.loginModal.classList.remove('hidden');
            this.loginModal.classList.add('flex');
            this.mainContent.classList.add('blur-sm', 'pointer-events-none');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const errorMsg = document.getElementById('loginError');

        try {
            if (this.authMode === 'firebase' && this.firebase) {
                await this.firebase.signInWithEmailAndPassword(this.firebase.auth, email, password);
                errorMsg.classList.add('hidden');
                return;
            }

            // Local test mode (no Firebase)
            if (email === TEST_EMAIL && password === TEST_PASSWORD) {
                this.setLocalSession(true);
                this.setLoggedIn(true);
                errorMsg.classList.add('hidden');
                this.loadDashboardData();
                return;
            }

            throw new Error('Invalid local credentials');
        } catch (error) {
            if (this.authMode === 'firebase') {
                errorMsg.textContent = 'Login failed. Check email/password and Firebase Auth users.';
            } else {
                errorMsg.textContent = `Invalid credentials. Use ${TEST_EMAIL} / ${TEST_PASSWORD} for testing.`;
            }
            errorMsg.classList.remove('hidden');
        }
    },

    async handleLogout() {
        try {
            if (this.authMode === 'firebase' && this.firebase) {
                await this.firebase.signOut(this.firebase.auth);
            } else {
                this.setLocalSession(false);
                this.setLoggedIn(false);
            }
            const errorMsg = document.getElementById('loginError');
            if (errorMsg) errorMsg.classList.add('hidden');
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
            if (this.authMode === 'firebase' && this.firebase) {
                const q = this.firebase.query(
                    this.firebase.collection(this.firebase.db, 'bookings'),
                    this.firebase.orderBy('createdAt', 'desc'),
                    this.firebase.limit(5)
                );
                const querySnapshot = await this.firebase.getDocs(q);

                this.bookingsTableBody.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    this.renderBookingRow(data);
                });

                this.statBookings.textContent = querySnapshot.size;
                return;
            }

            // Local demo data
            const demoBookings = [
                { clientName: 'Test Client', service: 'Knotless Braids', date: 'Today, 2:00 PM', status: 'Pending' },
                { clientName: 'Demo Customer', service: 'Gel Manicure', date: 'Tomorrow, 10:00 AM', status: 'Confirmed' },
            ];

            this.bookingsTableBody.innerHTML = '';
            demoBookings.forEach((b) => this.renderBookingRow(b));
            this.statBookings.textContent = String(demoBookings.length);
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
