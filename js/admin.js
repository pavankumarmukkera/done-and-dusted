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

                // Lazy load data for specific views
                if (viewId === 'clients') {
                    loadClientsData();
                }
                if (viewId === 'calendar') {
                    renderFullCalendar(currentCalendarDate);
                }
                if (viewId === 'reports') {
                    loadAnalyticsData();
                }
            });
        });

        // Initialize Data from Supabase
        loadDashboardData();
        initFullCalendar();

        // Initialize AOS
        if (window.AOS) {
            AOS.init({
                duration: 600,
                once: true,
                offset: 50
            });
        }

        // Initialize Search
        const searchInput = document.getElementById('searchBookings');
        if (searchInput) {
            searchInput.addEventListener('input', async (e) => {
                const searchTerm = e.target.value.toLowerCase();
                await searchBookings(searchTerm);
            });
        }
    }
});

// --- Calendar State ---
let currentCalendarDate = new Date();

function initFullCalendar() {
    // Calendar Navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderFullCalendar(currentCalendarDate);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderFullCalendar(currentCalendarDate);
        });
    }
}
// --- Data Functions (Supabase) ---
// Pagination State
let currentPage = 1;
const pageSize = 10;

async function loadDashboardData() {
    try {
        // 1. Fetch Stats (Parallel)
        const statsPromise = Promise.all([
            supabase.from('bookings').select('*', { count: 'exact', head: true }),
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
        ]);

        // 2. Fetch Recent Bookings (Top 5)
        const recentPromise = supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        // 3. Fetch Initial Page of All Bookings
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const bookingsPromise = supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        const [[totalRes, completedRes, pendingRes], recentRes, bookingsRes] = await Promise.all([
            statsPromise,
            recentPromise,
            bookingsPromise
        ]);

        if (totalRes.error) throw totalRes.error;
        if (recentRes.error) throw recentRes.error;
        if (bookingsRes.error) throw bookingsRes.error;

        // Update Stats
        const totalEl = document.getElementById('totalBookings');
        const completedEl = document.getElementById('completedBookings');
        const pendingEl = document.getElementById('pendingBookings');

        if (totalEl) totalEl.innerText = totalRes.count;
        if (completedEl) completedEl.innerText = completedRes.count;
        if (pendingEl) pendingEl.innerText = pendingRes.count;

        // Render Tables
        renderRecentBookings(recentRes.data);
        renderBookingsTable(bookingsRes.data, bookingsRes.count);

        // Load Analytics Data
        await loadAnalyticsData();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load bookings data', 'error');
    }
}

async function loadAnalyticsData() {
    try {
        // Fetch all bookings for analytics - consider paginating or server-side aggregation for large datasets
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('date, status');

        if (error) throw error;

        // 1. Update Stat Cards
        const statusCounts = {
            Pending: 0,
            Confirmed: 0,
            Completed: 0,
            Cancelled: 0
        };

        bookings.forEach(b => {
            if (b.status in statusCounts) {
                statusCounts[b.status]++;
            }
        });

        document.getElementById('statPending').innerText = statusCounts.Pending;
        document.getElementById('statConfirmed').innerText = statusCounts.Confirmed;
        document.getElementById('statCompleted').innerText = statusCounts.Completed;
        document.getElementById('statCancelled').innerText = statusCounts.Cancelled;


        // 2. Initialize Chart with the fetched data
        initCharts(bookings);

    } catch (error) {
        console.error('Error loading analytics data:', error);
        showToast('Failed to load analytics', 'error');
    }
}

async function loadClientsData() {
    const container = document.getElementById('clientsTableContainer');
    if (container) container.innerHTML = '<div class="loading">Loading clients...</div>';

    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('name, email, phone, date')
            .order('date', { ascending: false });

        if (error) throw error;
        renderClientsTable(bookings);
    } catch (error) {
        console.error('Error loading clients:', error);
        if (container) container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Failed to load clients</div>';
    }
}

async function searchBookings(searchTerm) {
    if (!searchTerm) {
        loadDashboardData();
        return;
    }

    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,service.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        renderBookingsTable(bookings);

        // Hide pagination controls for search results
        const controls = document.getElementById('paginationControls');
        if (controls) controls.style.display = 'none';

    } catch (error) {
        console.error('Error searching bookings:', error);
    }
}

function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No bookings yet</td></tr>';
        return;
    }

    // Take top 5 (already sorted by created_at desc)
    const recent = bookings.slice(0, 5);

    recent.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${formatDate(booking.date)}</td>
            <td><span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBookingsTable(bookings, totalCount = 0) {
    const tbody = document.getElementById('allBookingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${formatDate(booking.date)}</td>
            <td><span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
            <td>
                <button class="btn btn-sm btn-view" onclick="openBookingModal(${booking.id})"><i class="fas fa-eye"></i> View</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBooking(${booking.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Render Pagination Controls
    renderPaginationControls(totalCount);
}

function renderPaginationControls(totalCount) {
    const existingControls = document.getElementById('paginationControls');
    if (existingControls) existingControls.remove();

    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return;

    const container = document.createElement('div');
    container.id = 'paginationControls';
    container.className = 'pagination-controls';
    container.style.cssText = 'display: flex; justify-content: center; gap: 10px; margin-top: 20px; align-items: center;';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-secondary';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-secondary';
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);

    const info = document.createElement('span');
    info.innerText = `Page ${currentPage} of ${totalPages}`;
    info.style.color = 'var(--text-muted)';

    container.appendChild(prevBtn);
    container.appendChild(info);
    container.appendChild(nextBtn);

    const tableContainer = document.querySelector('#bookingsView .table-responsive');
    if (tableContainer) {
        tableContainer.after(container);
    }
}

async function changePage(newPage) {
    currentPage = newPage;
    const tbody = document.getElementById('allBookingsTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading...</td></tr>';
    }

    try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: bookings, count, error } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        renderBookingsTable(bookings, count);
    } catch (error) {
        console.error('Error changing page:', error);
        showToast('Failed to load page', 'error');
    }
}

function renderClientsTable(bookings) {
    const container = document.getElementById('clientsTableContainer');
    if (!container) return;

    if (bookings.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No clients yet</div>';
        return;
    }

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
                <td>${formatDate(client.lastBooking)}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// --- Modal Logic ---
let currentBookingId = null;

window.openBookingModal = async function (id) {
    try {
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!booking) return;

        currentBookingId = id;

        document.getElementById('modalName').innerText = booking.name;
        document.getElementById('modalEmail').innerText = booking.email;
        document.getElementById('modalPhone').innerText = booking.phone;
        document.getElementById('modalService').innerText = booking.service;
        document.getElementById('modalDate').innerText = formatDate(booking.date);
        document.getElementById('modalNotes').innerText = booking.notes || 'No notes.';

        const statusBadge = document.getElementById('modalStatus');
        statusBadge.innerText = booking.status;
        statusBadge.className = `status-badge status-${booking.status.toLowerCase()}`;

        // Set up status selector
        const statusSelect = document.getElementById('modalStatusSelect');
        if (statusSelect) {
            statusSelect.value = booking.status;
        }

        const modal = document.getElementById('bookingModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10); // Fade in

    } catch (error) {
        console.error('Error loading booking:', error);
        showToast('Failed to load booking details', 'error');
    }
};

function closeModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
    currentBookingId = null;
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

// Update Status Button
document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
    if (!currentBookingId) return;
    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) {
        await updateBookingStatus(currentBookingId, statusSelect.value);
    }
});

// Delete Button in Modal
document.getElementById('deleteBookingBtn')?.addEventListener('click', async () => {
    if (currentBookingId) {
        await deleteBooking(currentBookingId);
        closeModal();
    }
});

window.deleteBooking = async function (id) {
    if (confirm('Are you sure you want to delete this booking?')) {
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast('Booking deleted successfully', 'success');
            await loadDashboardData(); // Refresh UI
        } catch (error) {
            console.error('Error deleting booking:', error);
            showToast('Failed to delete booking', 'error');
        }
    }
};

window.updateBookingStatus = async function (id, newStatus) {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        showToast(`Status updated to ${newStatus}`, 'success');
        await loadDashboardData(); // Refresh UI
        closeModal();
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
};

const newBookingForm = document.getElementById('newBookingForm');
if (newBookingForm) {
    newBookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newBooking = {
            name: document.getElementById('newBookingName').value,
            email: document.getElementById('newBookingEmail').value,
            phone: document.getElementById('newBookingPhone').value,
            service: document.getElementById('newBookingService').value,
            date: document.getElementById('newBookingDate').value,
            status: 'Pending',
            notes: document.getElementById('newBookingNotes').value
        };

        try {
            const { error } = await supabase
                .from('bookings')
                .insert([newBooking]);

            if (error) throw error;

            showToast('Booking created successfully!', 'success');
            await loadDashboardData();
            closeNewBookingModal();
            newBookingForm.reset();
        } catch (error) {
            console.error('Error creating booking:', error);
            showToast('Failed to create booking', 'error');
        }
    });
}

async function renderFullCalendar(date) {
    const calendarGrid = document.getElementById('fullCalendar');
    const monthYearEl = document.getElementById('calendarMonthYear');
    if (!calendarGrid || !monthYearEl) return;

    calendarGrid.innerHTML = '<div class="loading">Loading calendar...</div>';

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // Set header text
    monthYearEl.innerText = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });

    // Get bookings for the month
    const bookings = await getBookingsForMonth(date);
    const eventsByDay = {};
    if (bookings) {
        bookings.forEach(b => {
            const day = new Date(b.date).getDate();
            if (!eventsByDay[day]) {
                eventsByDay[day] = [];
            }
            eventsByDay[day].push(b);
        });
    }


    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

    // Clear grid
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'full-cal-day-header';
        dayHeader.innerText = name;
        calendarGrid.appendChild(dayHeader);
    });


    // Add empty cells for padding
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'full-cal-day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Add day cells
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'full-cal-day';

        const dateEl = document.createElement('div');
        dateEl.className = 'full-cal-date';
        dateEl.innerText = i;
        dayCell.appendChild(dateEl);

        // Add events if any
        if (eventsByDay[i]) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'full-cal-events';
            eventsByDay[i].forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `cal-event status-${event.status.toLowerCase()}`;
                eventEl.innerHTML = `
                    <strong>${event.service}</strong>
                    <span>${event.name}</span>
                `;
                eventsContainer.appendChild(eventEl);
            });
            dayCell.appendChild(eventsContainer);
        }

        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) {
            dayCell.classList.add('today');
        }

        calendarGrid.appendChild(dayCell);
    }
}
async function getBookingsForMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .gte('date', firstDay)
            .lte('date', lastDay);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching bookings for month:', error);
        showToast('Failed to load calendar events', 'error');
        return [];
    }
}
// --- Charts Logic ---
async function initCharts(bookings) {
    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Get booking stats by month (all 12 months)
    let monthlyData = new Array(12).fill(0); // Initialize for all 12 months
    if (bookings) {
        bookings.forEach(b => {
            const month = new Date(b.date).getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
            if (month >= 0 && month < 12) { // Ensure month is within valid range
                monthlyData[month]++;
            }
        });
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Bookings per Month',
                data: monthlyData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)', // January (Red)
                    'rgba(54, 162, 235, 0.7)', // February (Blue)
                    'rgba(255, 206, 86, 0.7)', // March (Yellow)
                    'rgba(75, 192, 192, 0.7)', // April (Green)
                    'rgba(153, 102, 255, 0.7)', // May (Purple)
                    'rgba(255, 159, 64, 0.7)', // June (Orange)
                    'rgba(100, 100, 100, 0.7)', // July (Grey)
                    'rgba(200, 50, 100, 0.7)', // August
                    'rgba(50, 200, 100, 0.7)', // September
                    'rgba(100, 50, 200, 0.7)', // October
                    'rgba(200, 100, 50, 0.7)', // November
                    'rgba(50, 100, 200, 0.7)'  // December
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(100, 100, 100, 1)',
                    'rgba(200, 50, 100, 1)',
                    'rgba(50, 200, 100, 1)',
                    'rgba(100, 50, 200, 1)',
                    'rgba(200, 100, 50, 1)',
                    'rgba(50, 100, 200, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Booking Overview',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#333'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Bookings: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        color: '#555'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Bookings',
                        color: '#555'
                    },
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// --- Helper Functions ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 600;
        transform: translateX(100px);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}