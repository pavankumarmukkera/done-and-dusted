const ADMIN_USER = {
    email: 'admin@doneanddusted.co.uk',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin'
};

const CLEANER_USER = {
    email: 'cleaner@doneanddusted.co.uk',
    username: 'cleaner',
    password: 'cleaner123',
    role: 'cleaner',
    name: 'Cleaner'
};

const SESSION_KEY = 'dd_session';
let sessionUser = null;

async function findCleanerUser(loginId, password) {
    try {
        const { data, error } = await supabase
            .from('cleaners')
            .select('id, name, username, password')
            .ilike('username', loginId)
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('findCleanerUser error', error);
            return null;
        }
        if (!data) return null;
        if (data.password !== password) return null;
        return {
            email: data.username,
            username: data.username,
            role: 'cleaner',
            name: data.name || data.username
        };
    } catch (e) {
        console.error('findCleanerUser exception', e);
        return null;
    }
}

function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    if (data.role === 'admin') {
        localStorage.setItem('dd_admin_logged_in', 'true'); // backward compatibility
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('dd_admin_logged_in');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardApp = document.getElementById('dashboardApp');

    // --- Login Page Logic ---
    if (loginForm) {
        const existing = getSession();
        if (existing) {
            const redirectUrl = existing.role === 'cleaner' ? 'cleaner-dashboard.html' : 'dashboard.html';
            window.location.href = redirectUrl;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = document.getElementById('loginId').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            const matchByLoginId = (user) => {
                const id = loginId;
                return (
                    (user.email && user.email.toLowerCase() === id) ||
                    (user.username && user.username.toLowerCase() === id)
                );
            };

            let matchedUser = null;

            if (role === 'cleaner') {
                matchedUser = await findCleanerUser(loginId, password);
            }

            if (!matchedUser) {
                matchedUser = [ADMIN_USER, CLEANER_USER].find(
                    u => matchByLoginId(u) && u.password === password && u.role === role
                ) || (
                    role === 'cleaner' && password === CLEANER_USER.password
                        ? { email: loginId, username: loginId, role: 'cleaner', name: loginId.split('@')[0] || loginId }
                        : null
                );
            }

            if (matchedUser) {
                setSession({ email: matchedUser.email || matchedUser.username, username: matchedUser.username, role: matchedUser.role, name: matchedUser.name });
                const btn = loginForm.querySelector('button');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                const redirectUrl = matchedUser.role === 'cleaner' ? 'cleaner-dashboard.html' : 'dashboard.html';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 400);
            } else {
                showToast('Invalid credentials. Please try again.', 'error');
            }
        });
    }

    // --- Dashboard Page Logic ---
    if (dashboardApp) {
        sessionUser = getSession();
        if (!sessionUser) {
            window.location.href = 'index.html';
            return;
        }

        const isCleaner = sessionUser.role === 'cleaner';
        isCleanerSession = isCleaner;
        const isCleanerPage = window.location.pathname.endsWith('cleaner-dashboard.html');

        if (isCleaner && !isCleanerPage) {
            window.location.href = 'cleaner-dashboard.html';
            return;
        }
        if (!isCleaner && isCleanerPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    clearSession();
                    window.location.href = 'index.html';
                }
            });
        }

        // Hide admin-only controls for cleaners
        if (isCleaner) {
            document.body.classList.add('role-cleaner');
            document.getElementById('btnNewBooking')?.classList.add('hidden');
        }

        // Navigation
        const navItems = document.querySelectorAll('.sidebar-nav li');
        const views = document.querySelectorAll('.view-section');
        const pageTitle = document.getElementById('pageTitle');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                const viewId = item.getAttribute('data-view');
                views.forEach(view => view.classList.add('hidden'));
                const targetView = document.getElementById(`${viewId}View`);
                if (targetView) targetView.classList.remove('hidden');

                pageTitle.innerText = item.innerText.trim();

                if (window.AOS) AOS.refresh();

                if (viewId === 'clients') {
                    loadClientsData();
                }
                if (viewId === 'cleaners') {
                    loadCleanersData();
                }
                if (viewId === 'calendar') {
                    renderFullCalendar();
                }
                if (viewId === 'reports') {
                    initCharts();
                }
            });
        });

        loadDashboardData();
        initCalendar();
        initCharts();
        renderFullCalendar();

        if (window.AOS) {
            AOS.init({
                duration: 600,
                once: true,
                offset: 50
            });
        }

        const searchInput = document.getElementById('searchBookings');
        const filterStatus = document.getElementById('filterStatus');
        const filterService = document.getElementById('filterService');
        const resetFilters = document.getElementById('resetFilters');

        const applyFilters = () => {
            const searchTerm = (searchInput?.value || '').trim().toLowerCase();
            filterState.search = searchTerm;
            filterState.status = filterStatus?.value || '';
            filterState.service = filterService?.value || '';
            loadBookingsWithFilters();
        };

        searchInput?.addEventListener('input', applyFilters);
        filterStatus?.addEventListener('change', applyFilters);
        filterService?.addEventListener('change', applyFilters);
        resetFilters?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterStatus) filterStatus.value = '';
            if (filterService) filterService.value = '';
            filterState = { search: '', status: '', service: '' };
            loadDashboardData();
        });

        document.getElementById('exportCsv')?.addEventListener('click', () => exportBookings('csv'));

        document.getElementById('btnAddCleaner')?.addEventListener('click', async () => {
            const name = prompt('Enter cleaner name:');
            if (name === null) return;
            const username = prompt('Enter cleaner username (for login/display):');
            if (username === null) return;
            const password = prompt('Enter cleaner password:');
            if (password === null) return;
            await addCleaner(name, username, password);
        });

        document.getElementById('btnManageAddCleaner')?.addEventListener('click', async () => {
            const nameInput = document.getElementById('manageCleanerName');
            const userInput = document.getElementById('manageCleanerUsername');
            const passInput = document.getElementById('manageCleanerPassword');
            const nameVal = nameInput?.value || '';
            const userVal = userInput?.value || '';
            const passVal = passInput?.value || '';
            await addCleaner(nameVal, userVal, passVal);
            if (nameInput) nameInput.value = '';
            if (userInput) userInput.value = '';
            if (passInput) passInput.value = '';
            await loadCleanersData();
        });

        refreshCleanerOptions();
    }
});

// --- Data Functions (Supabase) ---
// Pagination & Filter State
let currentPage = 1;
const pageSize = 10;
let filterState = { search: '', status: '', service: '' };
let isCleanerSession = false;
let cleanerFilterDisabled = false;
let cleanerOptions = ['']; // '' represents Unassigned; rest fetched from Supabase

function mergeCleanerOptionsFromRows(extraRows = []) {
    const set = new Set(cleanerOptions.filter(Boolean));
    extraRows.forEach(r => {
        [r?.cleaner, r?.assigned_cleaner].forEach(c => {
            const name = (c || '').trim();
            if (name) set.add(name);
        });
    });
    cleanerOptions = [''].concat([...set].sort());
    updateCleanerSelects();
}

async function refreshCleanerOptions() {
    try {
        const { data, error } = await supabase
            .from('cleaners')
            .select('name')
            .order('name', { ascending: true });
        if (error) throw error;
        const names = (data || []).map(c => c.name).filter(Boolean);
        cleanerOptions = [''].concat(names);
        updateCleanerSelects();
    } catch (e) {
        console.error('refreshCleanerOptions error', e);
        // keep existing options on error
    }
}

async function addCleaner(name, username, password) {
    const trimmed = (name || '').trim();
    const userTrimmed = (username || '').trim();
    const passTrimmed = (password || '').trim();
    if (!trimmed || !userTrimmed || !passTrimmed) {
        showToast('Cleaner name, username, and password required', 'error');
        return;
    }
    try {
        const { error } = await supabase
            .from('cleaners')
            .insert([{ name: trimmed, username: userTrimmed, password: passTrimmed }]);
        if (error) throw error;
        showToast(`Added cleaner: ${trimmed} (${userTrimmed})`, 'success');
        await refreshCleanerOptions();
        await loadCleanersData();
    } catch (e) {
        console.error('addCleaner error', e);
        showToast('Failed to add cleaner', 'error');
    }
}

async function deleteCleaner(id) {
    if (!id) return;
    if (!confirm('Remove this cleaner?')) return;
    try {
        const { error } = await supabase
            .from('cleaners')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Cleaner removed', 'success');
        await refreshCleanerOptions();
        await loadCleanersData();
    } catch (e) {
        console.error('deleteCleaner error', e);
        showToast('Failed to remove cleaner', 'error');
    }
}

async function loadCleanersData() {
    const container = document.getElementById('cleanersTableContainer');
    if (container) container.innerHTML = '<div class="loading">Loading cleaners...</div>';
    try {
        const { data, error } = await supabase
            .from('cleaners')
            .select('id, name, username, created_at')
            .order('name', { ascending: true });
        if (error) throw error;
        renderCleanersTable(data || []);
    } catch (e) {
        console.error('loadCleanersData error', e);
        if (container) container.innerHTML = '<div style=\"padding:20px; color:red; text-align:center;\">Failed to load cleaners</div>';
    }
}

function renderCleanersTable(cleaners) {
    const container = document.getElementById('cleanersTableContainer');
    if (!container) return;

    if (!cleaners.length) {
        container.innerHTML = '<div style=\"padding:20px; text-align:center; color: var(--text-muted);\">No cleaners yet</div>';
        return;
    }

    let html = `
        <div class=\"table-responsive\">
            <table class=\"table\">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    cleaners.forEach(c => {
        html += `
            <tr>
                <td>${c.name}</td>
                <td>${c.username || '-'}</td>
                <td>${c.created_at ? formatDate(c.created_at) : '-'}</td>
                <td>
                    <button class=\"btn btn-sm btn-danger\" onclick=\"deleteCleaner(${c.id})\"><i class=\"fas fa-trash\"></i></button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateCleanerSelects() {
    const selects = [
        document.getElementById('modalCleaner'),
        document.getElementById('newBookingCleaner')
    ];
    const optionsHtml = ['<option value=\"\">Unassigned</option>']
        .concat(cleanerOptions.filter(Boolean).map(c => `<option value="${c}">${c}</option>`))
        .join('');

    selects.forEach(sel => {
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = optionsHtml;
        sel.value = current || '';
    });
}

function isMissingCleanerColumn(error) {
    const msg = (error?.message || '').toLowerCase();
    const details = (error?.details || '').toLowerCase();
    return msg.includes('cleaner') || details.includes('cleaner');
}

function applyRoleFilter(query) {
    if (!isCleanerSession || !sessionUser || cleanerFilterDisabled) return query;
    return query.eq('cleaner', sessionUser.name);
}

function applyFilterParams(query) {
    if (filterState.status) {
        query = query.eq('status', filterState.status);
    }
    if (filterState.service) {
        query = query.eq('service', filterState.service);
    }
    if (filterState.search) {
        const term = filterState.search;
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,service.ilike.%${term}%`);
    }
    return query;
}

function buildBookingsQuery({ withCount = false, rangeFrom = null, rangeTo = null } = {}) {
    let query = supabase
        .from('bookings')
        .select('*', { count: withCount ? 'exact' : undefined });

    query = applyRoleFilter(query);
    query = applyFilterParams(query);
    query = query.order('created_at', { ascending: false });

    if (rangeFrom !== null && rangeTo !== null) {
        query = query.range(rangeFrom, rangeTo);
    }
    return query;
}

async function loadDashboardData() {
    try {
        // 1. Fetch Stats (Parallel) - role aware
        const statsPromise = Promise.all([
            applyRoleFilter(supabase.from('bookings').select('*', { count: 'exact', head: true })),
            applyRoleFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Completed')),
            applyRoleFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending')),
            applyRoleFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Confirmed')),
            applyRoleFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Cancelled'))
        ]);

        // 2. Fetch Recent Bookings (Top 5, respects filters & role)
        const recentPromise = buildBookingsQuery().limit(5);

        // 3. Fetch Initial Page of All Bookings (with filters)
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const bookingsPromise = buildBookingsQuery({ withCount: true, rangeFrom: from, rangeTo: to });

        const [[totalRes, completedRes, pendingRes, confirmedRes, cancelledRes], recentRes, bookingsRes] = await Promise.all([
            statsPromise,
            recentPromise,
            bookingsPromise
        ]);

        await refreshCleanerOptions();

        if (totalRes.error) throw totalRes.error;
        if (recentRes.error) throw recentRes.error;
        if (bookingsRes.error) throw bookingsRes.error;

        // Update Stats
        const totalEl = document.getElementById('totalBookings');
        const completedEl = document.getElementById('completedBookings');
        const pendingEl = document.getElementById('pendingBookings');
        const confirmedEl = document.getElementById('statConfirmed');
        const cancelledEl = document.getElementById('statCancelled');
        const statPending = document.getElementById('statPending');
        const statCompleted = document.getElementById('statCompleted');

        if (totalEl) totalEl.innerText = totalRes.count;
        if (completedEl) completedEl.innerText = completedRes.count;
        if (pendingEl) pendingEl.innerText = pendingRes.count;
        if (confirmedEl) confirmedEl.innerText = confirmedRes.count;
        if (cancelledEl) cancelledEl.innerText = cancelledRes.count;
        if (statPending) statPending.innerText = pendingRes.count;
        if (statCompleted) statCompleted.innerText = completedRes.count;

        // Render Tables
        renderRecentBookings(recentRes.data);
        renderBookingsTable(bookingsRes.data, bookingsRes.count);

    } catch (error) {
        console.error('Error loading dashboard data:', error.message, error.stack);
        if (isCleanerSession && isMissingCleanerColumn(error) && !cleanerFilterDisabled) {
            cleanerFilterDisabled = true;
            return loadDashboardData();
        }
        showToast('Failed to load bookings data', 'error');
    }
}

async function loadClientsData() {
    const container = document.getElementById('clientsTableContainer');
    if (container) container.innerHTML = '<div class="loading">Loading clients...</div>';

    try {
        const { data: bookings, error } = await applyRoleFilter(
            supabase
                .from('bookings')
                .select('name, email, phone, date, cleaner')
                .order('date', { ascending: false })
        );

        if (error) throw error;
        await refreshCleanerOptions();
        renderClientsTable(bookings);
    } catch (error) {
        console.error('Error loading clients:', error);
        if (container) container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Failed to load clients</div>';
    }
}

async function loadBookingsWithFilters(pageReset = true) {
    if (pageReset) currentPage = 1;

    const tbody = document.getElementById('allBookingsTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    }

    try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data: bookings, count, error } = await buildBookingsQuery({
            withCount: true,
            rangeFrom: from,
            rangeTo: to
        });

        if (error) throw error;
        await refreshCleanerOptions();
        renderBookingsTable(bookings, count);
    } catch (error) {
        console.error('Error loading filtered bookings:', error);
        if (isCleanerSession && isMissingCleanerColumn(error) && !cleanerFilterDisabled) {
            cleanerFilterDisabled = true;
            return loadBookingsWithFilters(false);
        }
        showToast('Failed to load bookings', 'error');
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
        const statusLabel = booking.status || 'Pending';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${formatDate(booking.date)}</td>
            <td><span class="status-badge status-${statusLabel.toLowerCase()}">${statusLabel}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBookingsTable(bookings, totalCount = 0) {
    const tbody = document.getElementById('allBookingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        const statusLabel = booking.status || 'Pending';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.cleaner || 'Unassigned'}</td>
            <td><span class="status-badge status-${statusLabel.toLowerCase()}">${statusLabel}</span></td>
            <td>
                <button class="btn btn-sm btn-view" onclick="openBookingModal(${booking.id})"><i class="fas fa-eye"></i> View</button>
                ${isCleanerSession ? '' : `<button class="btn btn-sm btn-danger" onclick="deleteBooking(${booking.id})"><i class="fas fa-trash"></i></button>`}
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
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    }

    try {
        await loadBookingsWithFilters(false);
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
                        <th>Assign Cleaner</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const optionsHtml = ['<option value=\"\">Unassigned</option>']
        .concat(cleanerOptions.filter(Boolean).map(c => `<option value="${c}">${c}</option>`))
        .join('');

    Object.values(clients).forEach((client, idx) => {
        const inputId = `assignCleaner-${idx}`;
        html += `
            <tr>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone}</td>
                <td>${formatDate(client.lastBooking)}</td>
                <td style="min-width:220px;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <select id="${inputId}" style="flex:1; padding:8px; border:1px solid var(--border-light); border-radius:8px;">${optionsHtml}</select>
                        <button class="btn btn-sm btn-primary" onclick="assignCleanerToClient('${client.email}', '${inputId}')"><i class="fas fa-user-check"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

window.assignCleanerToClient = async function (email, inputId) {
    const input = document.getElementById(inputId);
    const cleanerName = input?.value.trim();
    if (!cleanerName) {
        showToast('Enter a cleaner name', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('bookings')
            .update({ cleaner: cleanerName, updated_at: new Date().toISOString() })
            .eq('email', email);

        if (error) {
            if (isMissingCleanerColumn(error)) {
                showToast('Add a "cleaner" column in Supabase to assign cleaners.', 'error');
                return;
            }
            throw error;
        }

        showToast(`Assigned to ${cleanerName} for ${email}`, 'success');
        await loadDashboardData();
    } catch (err) {
        console.error('Assign cleaner error', err);
        showToast('Failed to assign cleaner', 'error');
    }
};

// --- Modal Logic ---
let currentBookingId = null;
let currentBookingData = null;

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
        currentBookingData = booking;
        mergeCleanerOptionsFromRows([booking]);

        document.getElementById('modalName').innerText = booking.name;
        document.getElementById('modalEmail').innerText = booking.email;
        document.getElementById('modalPhone').innerText = booking.phone;
        document.getElementById('modalService').innerText = booking.service;
        document.getElementById('modalDate').innerText = formatDate(booking.date);
        document.getElementById('modalNotes').innerText = booking.notes || 'No notes.';
        const cleanerSelect = document.getElementById('modalCleaner');
        if (cleanerSelect) {
            if (booking.cleaner && !cleanerOptions.includes(booking.cleaner)) {
                cleanerOptions.push(booking.cleaner);
                updateCleanerSelects();
            }
            cleanerSelect.value = booking.cleaner || '';
        }
        const adminNotes = document.getElementById('modalAdminNotes');
        if (adminNotes) adminNotes.value = booking.admin_notes || '';
        const whatsappChk = document.getElementById('modalWhatsappConfirmed');
        if (whatsappChk) whatsappChk.checked = Boolean(booking.whatsapp_confirmed);

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
    currentBookingData = null;
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

document.getElementById('modalWhatsappSend')?.addEventListener('click', async () => {
    await sendWhatsappConfirmation();
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
        const adminNotes = document.getElementById('modalAdminNotes')?.value || '';
        const cleaner = document.getElementById('modalCleaner')?.value || '';
        const whatsappConfirmed = document.getElementById('modalWhatsappConfirmed')?.checked || false;

        const { error } = await supabase
            .from('bookings')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                admin_notes: adminNotes,
                cleaner,
                whatsapp_confirmed: whatsappConfirmed
            })
            .eq('id', id);

        if (error) {
            if (isMissingCleanerColumn(error)) {
                const fallback = await supabase
                    .from('bookings')
                    .update({
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);
                if (fallback.error) throw fallback.error;
            } else {
                throw error;
            }
        }

        showToast(`Status updated to ${newStatus}`, 'success');
        await sendEmailNotifications('status-update', { id, status: newStatus, cleaner, admin_notes: adminNotes });
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
            cleaner: document.getElementById('newBookingCleaner').value,
            status: 'Pending',
            notes: document.getElementById('newBookingNotes').value,
            admin_notes: '',
            whatsapp_confirmed: false
        };

        try {
            let { error } = await supabase
                .from('bookings')
                .insert([newBooking]);

            if (error) {
                if (isMissingCleanerColumn(error)) {
                    const fallbackBooking = {
                        name: newBooking.name,
                        email: newBooking.email,
                        phone: newBooking.phone,
                        service: newBooking.service,
                        date: newBooking.date,
                        status: newBooking.status,
                        notes: newBooking.notes
                    };
                    const fallback = await supabase.from('bookings').insert([fallbackBooking]);
                    if (fallback.error) throw fallback.error;
                } else {
                    throw error;
                }
            }

            showToast('Booking created successfully!', 'success');
            await sendEmailNotifications('new-booking', newBooking);
            await loadDashboardData();
            closeNewBookingModal();
            newBookingForm.reset();
        } catch (error) {
            console.error('Error creating booking:', error);
            showToast('Failed to create booking', 'error');
        }
    });
}

// --- Calendar Logic ---
async function initCalendar() {
    const grid = document.getElementById('miniCalendar');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    // Get bookings for calendar
    let bookedDays = [];
    try {
        const { data: bookings, error } = await applyRoleFilter(
            supabase
                .from('bookings')
                .select('date, status')
                .gte('date', new Date().toISOString().split('T')[0])
        );

        if (!error && bookings) {
            bookedDays = bookings.map(b => new Date(b.date).getDate());
        }
    } catch (e) {
        console.error('Error loading calendar data:', e);
        if (isCleanerSession && isMissingCleanerColumn(e) && !cleanerFilterDisabled) {
            cleanerFilterDisabled = true;
            return initCalendar();
        }
    }

    const today = new Date().getDate();

    // Simple 30-day grid
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerText = i;

        // Mark days with bookings
        if (bookedDays.includes(i)) {
            day.classList.add('has-event');
        }
        if (i === today) {
            day.classList.add('today');
        }

        grid.appendChild(day);
    }
}

// --- Charts Logic ---
async function initCharts() {
    const ctx = document.getElementById('reportsChart');
    if (!ctx || typeof Chart === 'undefined') {
        console.warn('Chart.js not available; analytics skipped.');
        return;
    }

    // Destroy existing chart if any
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Build last 6 months labels
    const now = new Date();
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push(d.toLocaleString('en-GB', { month: 'short' }));
    }

    const statusBuckets = {
        Pending: Array(6).fill(0),
        Confirmed: Array(6).fill(0),
        Completed: Array(6).fill(0),
        Cancelled: Array(6).fill(0)
    };

    try {
        const { data: bookings, error } = await applyRoleFilter(
            supabase.from('bookings').select('date, status')
        );

        if (!error && bookings) {
            bookings.forEach(b => {
                const bookingDate = new Date(b.date);
                const diffMonths = (now.getFullYear() - bookingDate.getFullYear()) * 12 + (now.getMonth() - bookingDate.getMonth());
                const bucket = 5 - diffMonths;
                if (bucket >= 0 && bucket < 6) {
                    const status = b.status || 'Pending';
                    if (statusBuckets[status]) {
                        statusBuckets[status][bucket]++;
                    }
                }
            });
        }
    } catch (e) {
        console.error('Error loading chart data:', e);
        if (isCleanerSession && isMissingCleanerColumn(e) && !cleanerFilterDisabled) {
            cleanerFilterDisabled = true;
            return initCharts();
        }
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Pending',
                    data: statusBuckets.Pending,
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Confirmed',
                    data: statusBuckets.Confirmed,
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Completed',
                    data: statusBuckets.Completed,
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Cancelled',
                    data: statusBuckets.Cancelled,
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// --- Calendar (full view) ---
async function renderFullCalendar() {
    const container = document.getElementById('fullCalendar');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading calendar...</div>';

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    try {
        const { data: bookings, error } = await applyRoleFilter(
            supabase
                .from('bookings')
                .select('*')
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0])
                .order('date', { ascending: true })
        );

        if (error) throw error;

        const daysInMonth = endOfMonth.getDate();
        const startDay = startOfMonth.getDay(); // 0-6
        const eventsByDay = {};
        (bookings || []).forEach(b => {
            const dayNum = new Date(b.date).getDate();
            if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
            eventsByDay[dayNum].push(b);
        });

        const cells = [];
        for (let i = 0; i < startDay; i++) {
            cells.push('<div class="full-cal-day empty"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const events = eventsByDay[day] || [];
            let eventsHtml = '';
            events.forEach(ev => {
                const statusClass = `status-${(ev.status || 'pending').toLowerCase()}`;
                eventsHtml += `<div class="cal-event ${statusClass}">${ev.service || 'Booking'} - ${ev.cleaner || 'Unassigned'}</div>`;
            });

            cells.push(`
                <div class="full-cal-day">
                    <div class="full-cal-date">${day}</div>
                    <div class="full-cal-events">
                        ${eventsHtml || '<span style="color: var(--text-muted); font-size: 0.85rem;">No bookings</span>'}
                    </div>
                </div>
            `);
        }

        container.innerHTML = cells.join('');
    } catch (error) {
        console.error('Error rendering calendar', error);
        if (isCleanerSession && isMissingCleanerColumn(error) && !cleanerFilterDisabled) {
            cleanerFilterDisabled = true;
            return renderFullCalendar();
        }
        container.innerHTML = '<div style="color:red; padding:16px;">Failed to load calendar</div>';
    }
}

// --- Export ---
async function exportBookings(format = 'csv') {
    try {
        const { data: bookings, error } = await buildBookingsQuery({ withCount: false });
        if (error) throw error;
        const rows = bookings || [];
        const headers = ['Name', 'Email', 'Phone', 'Service', 'Date', 'Cleaner', 'Status', 'Notes', 'Admin Notes'];
        const csv = [headers.join(',')].concat(
            rows.map(r => [
                r.name,
                r.email,
                r.phone,
                r.service,
                r.date,
                r.cleaner || '',
                r.status,
                (r.notes || '').replace(/,/g, ';'),
                (r.admin_notes || '').replace(/,/g, ';')
            ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `bookings-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Export ready – CSV downloaded', 'success');
    } catch (error) {
        console.error('Export error', error);
        showToast('Failed to export bookings', 'error');
    }
}

// --- Notifications ---
async function sendEmailNotifications(type, payload) {
    // Placeholder: wire to real email service or Supabase function.
    console.log('Email notification stub:', type, payload);
}

async function sendWhatsappConfirmation() {
    if (!currentBookingData || !currentBookingId) return;
    const phoneDigits = normalizePhone(currentBookingData.phone);
    if (!phoneDigits) {
        showToast('No phone number available for WhatsApp', 'error');
        return;
    }
    const statusSelect = document.getElementById('modalStatusSelect');
    const statusToSave = statusSelect?.value || currentBookingData.status || 'Pending';
    const message = encodeURIComponent(
        `Hi ${currentBookingData.name || ''}, your booking on ${formatDate(currentBookingData.date)} is confirmed. - Done & Dusted`
    );
    const url = `https://wa.me/${phoneDigits}?text=${message}`;
    window.open(url, '_blank');
    const chk = document.getElementById('modalWhatsappConfirmed');
    if (chk) chk.checked = true;
    await updateBookingStatus(currentBookingId, statusToSave);
}

function normalizePhone(phone) {
    return (phone || '').replace(/\D/g, '');
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
