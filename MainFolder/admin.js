// ── State ──
let currentFilter = 'all';
let currentBooking = null;

// ── Load bookings ──
function getBookings() {
  return JSON.parse(localStorage.getItem('ember_oak_bookings') || '[]');
}
function saveBookings(data) {
  localStorage.setItem('ember_oak_bookings', JSON.stringify(data));
}

// ── Stats ──
function updateStats() {
  const b = getBookings();
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('stat-total').textContent     = b.length;
  document.getElementById('stat-pending').textContent   = b.filter(x => x.status === 'Pending').length;
  document.getElementById('stat-confirmed').textContent = b.filter(x => x.status === 'Confirmed').length;
  document.getElementById('stat-today').textContent     = b.filter(x => x.date === today).length;
  document.getElementById('today-date').textContent     = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
  document.getElementById('last-updated').textContent   = `Last updated: ${new Date().toLocaleTimeString('en-IN')}`;
}

// ── Table Render ──
function renderTable() {
  const bookings = getBookings();
  const query    = document.getElementById('search-input').value.toLowerCase();
  const filter   = currentFilter;

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = !query || (
      b.firstName.toLowerCase().includes(query) ||
      b.lastName.toLowerCase().includes(query) ||
      b.email.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      (b.phone && b.phone.includes(query))
    );
    return matchStatus && matchSearch;
  }).reverse(); // newest first

  document.getElementById('visible-count').textContent = `${filtered.length} booking${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    document.getElementById('table-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No Bookings Found</div>
        <div class="empty-desc">${bookings.length === 0 ? 'No reservations have been made yet.' : 'No bookings match your current filter.'}</div>
        ${bookings.length === 0 ? `<a href="index.html#reserve" class="empty-cta">Make First Reservation →</a>` : ''}
      </div>`;
    return;
  }

  const rows = filtered.map(b => {
    const statusClass = {
      Pending: 'badge-pending', Confirmed: 'badge-confirmed',
      Cancelled: 'badge-cancelled', Completed: 'badge-completed'
    }[b.status] || 'badge-pending';

    const dateStr = b.date ? new Date(b.date + 'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';

    return `<tr>
      <td><span class="booking-id">${b.id}</span></td>
      <td>
        <div class="guest-name">${b.firstName} ${b.lastName}</div>
        <div class="guest-contact">${b.email}</div>
      </td>
      <td>${dateStr}</td>
      <td>${b.time || '—'}</td>
      <td>${b.guests || '—'}</td>
      <td>${b.occasion || 'Regular Dining'}</td>
      <td><span class="badge ${statusClass}">${b.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="viewBooking('${b.id}')">View</button>
          ${b.status === 'Pending' ? `<button class="action-btn confirm-btn" onclick="updateStatus('${b.id}','Confirmed')">✓</button>` : ''}
          ${b.status !== 'Cancelled' && b.status !== 'Completed' ? `<button class="action-btn cancel-btn" onclick="updateStatus('${b.id}','Cancelled')">✕</button>` : ''}
          <button class="action-btn delete-btn" onclick="deleteBooking('${b.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('table-container').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Guest</th>
          <th>Date</th>
          <th>Time</th>
          <th>Guests</th>
          <th>Occasion</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Actions ──
function updateStatus(id, status) {
  const b = getBookings();
  const idx = b.findIndex(x => x.id === id);
  if (idx > -1) { b[idx].status = status; saveBookings(b); }
  renderTable(); updateStats();
  showToast(`Booking ${status}`, status === 'Confirmed' ? 'success' : 'warning');
  if (document.getElementById('modal-overlay').classList.contains('open')) viewBooking(id);
}

function deleteBooking(id) {
  if (!confirm('Delete this booking permanently?')) return;
  const b = getBookings().filter(x => x.id !== id);
  saveBookings(b);
  renderTable(); updateStats();
  showToast('Booking deleted', 'error');
  closeModalDirect();
}

function clearAllBookings() {
  if (!confirm('Clear ALL bookings? This cannot be undone.')) return;
  localStorage.removeItem('ember_oak_bookings');
  renderTable(); updateStats();
  showToast('All bookings cleared', 'warning');
}

// ── View Detail ──
function viewBooking(id) {
  const b = getBookings().find(x => x.id === id);
  if (!b) return;
  currentBooking = b;
  const dateStr = b.date ? new Date(b.date + 'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—';
  const bookedAt = new Date(b.timestamp).toLocaleString('en-IN');
  const statusClass = { Pending:'badge-pending', Confirmed:'badge-confirmed', Cancelled:'badge-cancelled', Completed:'badge-completed' }[b.status] || 'badge-pending';

  document.getElementById('modal-title').textContent = `Booking ${b.id}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Guest Name</div><div class="detail-value">${b.firstName} ${b.lastName}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="badge ${statusClass}">${b.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${b.email || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${b.phone || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Date</div><div class="detail-value">${dateStr}</div></div>
      <div class="detail-item"><div class="detail-label">Time</div><div class="detail-value">${b.time || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Guests</div><div class="detail-value">${b.guests || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Occasion</div><div class="detail-value">${b.occasion || 'Regular Dining'}</div></div>
      <div class="detail-item"><div class="detail-label">Booked On</div><div class="detail-value">${bookedAt}</div></div>
      ${b.notes ? `<div class="detail-item detail-notes" style="grid-column:span 2"><div class="detail-label">Special Requests</div><div>${b.notes}</div></div>` : ''}
    </div>`;

  document.getElementById('modal-actions').innerHTML = `
    ${b.status === 'Pending' ? `<button class="btn-sm" style="background:rgba(76,175,100,0.15);border:1px solid rgba(76,175,100,0.3);color:#4CAF64;cursor:pointer" onclick="updateStatus('${b.id}','Confirmed')">✓ Confirm</button>` : ''}
    ${b.status === 'Confirmed' ? `<button class="btn-sm" style="background:rgba(122,92,58,0.15);border:1px solid var(--border);color:#C9A07A;cursor:pointer" onclick="updateStatus('${b.id}','Completed')">Mark Completed</button>` : ''}
    ${b.status !== 'Cancelled' ? `<button class="btn-sm btn-danger" style="cursor:pointer" onclick="updateStatus('${b.id}','Cancelled')">Cancel Booking</button>` : ''}
    <button class="btn-sm btn-outline" style="cursor:pointer" onclick="closeModalDirect()">Close</button>`;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modal-overlay').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });

// ── Export CSV ──
function exportCSV() {
  const b = getBookings();
  if (!b.length) { showToast('No bookings to export', 'warning'); return; }
  const headers = ['ID','First Name','Last Name','Email','Phone','Date','Time','Guests','Occasion','Status','Notes','Booked At'];
  const rows = b.map(x => [x.id, x.firstName, x.lastName, x.email, x.phone, x.date, x.time, x.guests, x.occasion, x.status, `"${(x.notes||'').replace(/"/g,"'")}"`, x.timestamp]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `ember-oak-bookings-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('CSV exported!', 'success');
}

// ── Filter Tabs ──
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTable();
  });
});

// ── Toast ──
function showToast(msg, type = 'success') {
  const t = document.getElementById('admin-toast');
  t.textContent = msg; t.className = `admin-toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Init ──
updateStats();
renderTable();
// Auto-refresh every 10s to catch new bookings from other tabs
setInterval(() => { updateStats(); renderTable(); }, 10000);
