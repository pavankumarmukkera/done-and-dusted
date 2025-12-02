document.addEventListener('DOMContentLoaded', () => {
    // --- Shared Logic ---
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardApp = document.getElementById('dashboardApp');

    // --- Login Page Logic ---
    if (loginForm) {
        // Check if already logged in
        if (localStorage.getItem('dd_admin_logged_in') === 'true') {
            window.location.href = 'dashboard.html';
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email === 'admin@doneanddusted.co.uk' && password === 'admin123') {
                localStorage.setItem('dd_admin_logged_in', 'true');
                // Simulate loading/redirect
                const btn = loginForm.querySelector('button');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            } else {
                alert('Invalid credentials. Please try again.');
            }
        });
    }

    // --- Dashboard Page Logic ---
    if (dashboardApp) {
        // Auth Check
        if (localStorage.getItem('dd_admin_logged_in') !== 'true') {
            window.location.href = 'index.html';
            return; // Stop execution
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('dd_admin_logged_in');
                    window.location.href = 'index.html';
                }
            });
        }

        // Navigation
        const navItems = document.querySelectorAll('.sidebar-nav li');
        const views = document.querySelectorAll('.view-section');
        const pageTitle = document.getElementById('pageTitle');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Active State
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Switch View
                const viewId = item.getAttribute('data-view');
                views.forEach(view => view.classList.add('hidden'));
                const targetView = document.getElementById(`${viewId}View`);
                if (targetView) targetView.classList.remove('hidden');

                // Update Title
                pageTitle.innerText = item.innerText.trim();

                // Refresh AOS
                if (window.AOS) AOS.refresh();
            });
        });

        // Initialize Data
        loadDashboardData();
        initCalendar();
        initCharts();

        // Initialize AOS
        if (window.AOS) {
            AOS.init({
                duration: 600,
                once: true,
                offset: 50
            });
        }
    }
});

// --- Data Functions ---
function loadDashboardData() {
    let bookings = JSON.parse(localStorage.getItem('dd_bookings') || '[]');

    // Dummy Data if empty
    if (bookings.length === 0) {
        bookings = [
            { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '07712345678', service: 'Domestic Cleaning', date: '2025-11-28', status: 'Pending', notes: 'Key under mat.' },
            { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '07787654321', service: 'Deep Clean', date: '2025-11-25', status: 'Completed', notes: 'Focus on kitchen.' },
            { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', phone: '07711223344', service: 'End of Tenancy', date: '2025-12-01', status: 'Pending', notes: 'Landlord inspection next day.' },
            { id: 4, name: 'David Wilson', email: 'david@example.com', phone: '07755667788', service: 'Commercial Cleaning', date: '2025-11-20', status: 'Completed', notes: 'Office block A.' },
            { id: 5, name: 'Eva Green', email: 'eva@example.com', phone: '07799887766', service: 'AirBnB Cleaning', date: '2025-11-29', status: 'Pending', notes: 'Guest arriving at 3pm.' }
        ];
        localStorage.setItem('dd_bookings', JSON.stringify(bookings));
    }

    // Update Stats
    const totalEl = document.getElementById('totalBookings');
    const completedEl = document.getElementById('completedBookings');
    const pendingEl = document.getElementById('pendingBookings');

    if (totalEl) totalEl.innerText = bookings.length;
    if (completedEl) completedEl.innerText = bookings.filter(b => b.status === 'Completed').length;
    if (pendingEl) pendingEl.innerText = bookings.filter(b => b.status === 'Pending').length;

    // Render Tables
    renderBookingsTable(bookings);
    renderRecentBookings(bookings);
    renderClientsTable(bookings);
}

function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Sort by date (newest first) and take top 5
    const recent = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    recent.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${booking.date}</td>
            <td><span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('allBookingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${booking.date}</td>
            <td><span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
            <td>
                <button class="btn btn-sm btn-view" onclick="openBookingModal(${booking.id})"><i class="fas fa-eye"></i> View</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBooking(${booking.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderClientsTable(bookings) {
    const clientsView = document.getElementById('clientsView');
    if (!clientsView) return;

    // Simple deduplication for clients
    const clients = {};
    bookings.forEach(b => {
        if (!clients[b.email]) {
            clients[b.email] = { name: b.name, phone: b.phone, email: b.email, lastBooking: b.date };
        }
    });

    let html = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Last Booking</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.values(clients).forEach(client => {
        html += `
            <tr>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone}</td>
                <td>${client.lastBooking}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    clientsView.innerHTML = html;
}

// --- Modal Logic ---
// --- Modal Logic ---
window.openBookingModal = function (id) {
    const bookings = JSON.parse(localStorage.getItem('dd_bookings') || '[]');
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    document.getElementById('modalName').innerText = booking.name;
    document.getElementById('modalEmail').innerText = booking.email;
    document.getElementById('modalPhone').innerText = booking.phone;
    document.getElementById('modalService').innerText = booking.service;
    document.getElementById('modalDate').innerText = booking.date;
    document.getElementById('modalNotes').innerText = booking.notes || 'No notes.';

    const statusBadge = document.getElementById('modalStatus');
    statusBadge.innerText = booking.status;
    statusBadge.className = `status-badge status-${booking.status.toLowerCase()}`;

    const modal = document.getElementById('bookingModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10); // Fade in

    // Delete Button in Modal
    document.getElementById('deleteBookingBtn').onclick = () => {
        deleteBooking(id);
        closeModal();
    };
};

function closeModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// New Booking Modal Logic
const btnNewBooking = document.getElementById('btnNewBooking');
const newBookingModal = document.getElementById('newBookingModal');

if (btnNewBooking && newBookingModal) {
    btnNewBooking.addEventListener('click', () => {
        newBookingModal.classList.remove('hidden');
        setTimeout(() => newBookingModal.classList.add('active'), 10);
    });
}

window.closeNewBookingModal = function () {
    if (newBookingModal) {
        newBookingModal.classList.remove('active');
        setTimeout(() => newBookingModal.classList.add('hidden'), 300);
    }
};

document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
document.querySelector('.close-modal')?.addEventListener('click', closeModal);

window.deleteBooking = function (id) {
    if (confirm('Are you sure you want to delete this booking?')) {
        let bookings = JSON.parse(localStorage.getItem('dd_bookings') || '[]');
        bookings = bookings.filter(b => b.id !== id);
        localStorage.setItem('dd_bookings', JSON.stringify(bookings));
        loadDashboardData(); // Refresh UI
    }
};

const newBookingForm = document.getElementById('newBookingForm');
if (newBookingForm) {
    newBookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const bookings = JSON.parse(localStorage.getItem('dd_bookings') || '[]');
        const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;

        const newBooking = {
            id: newId,
            name: document.getElementById('newBookingName').value,
            email: document.getElementById('newBookingEmail').value,
            phone: document.getElementById('newBookingPhone').value,
            service: document.getElementById('newBookingService').value,
            date: document.getElementById('newBookingDate').value,
            status: 'Pending',
            notes: document.getElementById('newBookingNotes').value
        };

        bookings.push(newBooking);
        localStorage.setItem('dd_bookings', JSON.stringify(bookings));

        loadDashboardData();
        closeNewBookingModal();
        newBookingForm.reset();
        alert('Booking created successfully!');
    });
}

// --- Calendar Logic (Simple Mock) ---
function initCalendar() {
    const grid = document.getElementById('miniCalendar');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    // Simple 30-day grid
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerText = i;

        // Random events
        if ([5, 12, 18, 25, 28].includes(i)) {
            day.classList.add('has-event');
        }
        if (i === 27) { // Today
            day.classList.add('today');
        }

        grid.appendChild(day);
    }
}

// --- Charts Logic ---
function initCharts() {
    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;

    // Destroy existing chart if any (to prevent overlap on re-init)
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Revenue (£)',
                data: [1200, 1900, 3000, 5000, 4500, 6000],
                backgroundColor: '#3b82f6',
                borderColor: '#0f172a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
