// ══════════════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════════════
const { createClient } = supabase;

// sb is initialised asynchronously after fetching config from the server.
// Nothing runs until initSupabase() resolves — called at bottom of file.
let sb;

async function initSupabase() {
  const res = await fetch('/config');
  if (!res.ok) throw new Error('Could not load app config. Please refresh.');
  const { url, key } = await res.json();
  sb = createClient(url, key);
}

// ══════════════════════════════════════════════
// ADMIN ROLE
// ══════════════════════════════════════════════
const ADMIN_EMAILS = [
  'zainab@nutech.edu.pk',
  'ali.h@nutech.edu.pk',
  'admin@gmail.com',
  'zafarikomail@gmail.com'
];
let isAdmin = false;

function applyRoleUI() {
  if (isAdmin) {
    document.body.classList.add('role-admin');
    document.body.classList.remove('role-viewer');
  } else {
    document.body.classList.add('role-viewer');
    document.body.classList.remove('role-admin');
  }

  // Inject role-based CSS once
  if (!document.getElementById('role-styles')) {
    const style = document.createElement('style');
    style.id = 'role-styles';
    style.textContent = `
      .role-viewer .admin-only { display: none !important; }

    `;
    document.head.appendChild(style);
  }

  // Show available food section for regular users
  const availSection = document.getElementById('available-food-section');
  if (availSection) availSection.style.display = isAdmin ? 'none' : 'block';

  // user-only elements (inverse of admin-only)
  if (!document.getElementById('user-only-styles')) {
    const s = document.createElement('style');
    s.id = 'user-only-styles';
    s.textContent = '.role-admin .user-only { display: none !important; }';
    document.head.appendChild(s);
  }
}

// ══════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════
let progressTimer;
function progressStart() {
  const bar = document.getElementById('nprogress');
  bar.className = 'active';
  clearTimeout(progressTimer);
}
function progressDone() {
  const bar = document.getElementById('nprogress');
  bar.className = 'done';
  progressTimer = setTimeout(() => { bar.className = ''; }, 700);
}

// ══════════════════════════════════════════════
// SIDEBAR (mobile)
// ══════════════════════════════════════════════
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ══════════════════════════════════════════════
// RIPPLE EFFECT
// ══════════════════════════════════════════════
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn, .login-btn');
  if (!btn) return;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
function toast(msg, isErr = false) {
  const container = document.getElementById('toast-container');
  const item = document.createElement('div');
  item.className = 'toast-item' + (isErr ? ' error' : '');
  item.innerHTML = `
    <span class="toast-icon">${isErr ? '⚠️' : '✅'}</span>
    <span class="toast-text">${msg}</span>
    <div class="toast-progress"></div>
  `;
  container.appendChild(item);
  setTimeout(() => {
    item.classList.add('removing');
    setTimeout(() => item.remove(), 350);
  }, 3200);
}

// ══════════════════════════════════════════════
// ALERT (inside modals)
// ══════════════════════════════════════════════
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.className = `alert alert-${type} show`;
  el.innerHTML = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
  setTimeout(() => { el.className = 'alert'; el.textContent = ''; }, 4500);
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════
let currentTab = 'signin';

function togglePass(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const hide = inp.type === 'password';
  inp.type = hide ? 'text' : 'password';
  btn.textContent = hide ? '🙈' : '👁';
}

function showForgotPanel() {
  document.getElementById('auth-form').style.display = 'none';
  document.getElementById('login-tabs').style.display = 'none';
  document.getElementById('forgot-panel').classList.add('show');
  document.getElementById('login-err').classList.remove('show');
  document.getElementById('reset-email').value = document.getElementById('auth-email').value;
}
function hideForgotPanel() {
  document.getElementById('forgot-panel').classList.remove('show');
  document.getElementById('auth-form').style.display = '';
  document.getElementById('login-tabs').style.display = '';
  document.getElementById('reset-err').classList.remove('show');
}

async function sendResetEmail() {
  const email = document.getElementById('reset-email').value.trim();
  const errEl = document.getElementById('reset-err');
  const btn   = document.getElementById('reset-btn');
  errEl.classList.remove('show');
  if (!email)                                        { showLoginMsg(errEl, 'Please enter your email address.', false); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))   { showLoginMsg(errEl, 'Please enter a valid email address.', false); return; }
  btn.disabled = true; btn.textContent = '⏳ Sending…';
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  btn.disabled = false; btn.textContent = '📧 Send Reset Link';
  if (error) { showLoginMsg(errEl, error.message, false); }
  else {
    showLoginMsg(errEl, '✅ Reset link sent! Check your email inbox (and spam folder).', true);
    btn.disabled = true; btn.textContent = '✅ Email Sent';
  }
}

function showLoginMsg(el, msg, isSuccess) {
  el.style.background    = isSuccess ? '#dcfce7' : '';
  el.style.color         = isSuccess ? '#14532d' : '';
  el.style.borderColor   = isSuccess ? '#bbf7d0' : '';
  el.textContent = msg;
  el.classList.add('show');
}

function switchTab(t) {
  currentTab = t;
  document.getElementById('tab-signin').classList.toggle('active', t === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', t === 'signup');
  document.getElementById('confirm-field').style.display = t === 'signup' ? '' : 'none';
  document.getElementById('forgot-btn').style.display    = t === 'signin' ? '' : 'none';
  document.getElementById('auth-btn').textContent = t === 'signin' ? 'Sign In' : 'Create Account';
  ['auth-email','auth-pass','auth-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.type = id.includes('email') ? 'email' : 'password'; }
  });
  document.getElementById('eye-pass1').textContent = '👁';
  document.getElementById('eye-pass2').textContent = '👁';
  const errEl = document.getElementById('login-err');
  errEl.classList.remove('show');
  errEl.style.background = ''; errEl.style.color = ''; errEl.style.borderColor = '';
}

async function doAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  const errEl = document.getElementById('login-err');
  const btn   = document.getElementById('auth-btn');
  errEl.style.background = ''; errEl.style.color = ''; errEl.style.borderColor = '';
  errEl.classList.remove('show');

  if (!email)                                       { showLoginMsg(errEl,'Please enter your email address.',false); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))  { showLoginMsg(errEl,'Please enter a valid email address.',false); return; }
  if (!pass)                                        { showLoginMsg(errEl,'Please enter your password.',false); return; }
  if (pass.length < 6)                              { showLoginMsg(errEl,'Password must be at least 6 characters.',false); return; }

  btn.textContent = '⏳ Please wait…'; btn.disabled = true;

  if (currentTab === 'signin') {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('email not confirmed'))
        msg = 'Please confirm your email before signing in. Check your inbox.';
      else if (msg.toLowerCase().includes('invalid login'))
        msg = 'Incorrect email or password. Please try again.';
      showLoginMsg(errEl, msg, false);
      btn.textContent = 'Sign In'; btn.disabled = false;
    }
  } else {
    const confirm = document.getElementById('auth-confirm').value;
    if (pass !== confirm) {
      showLoginMsg(errEl, 'Passwords do not match. Please re-enter.', false);
      btn.textContent = 'Create Account'; btn.disabled = false; return;
    }
    const { data, error } = await sb.auth.signUp({ email, password: pass });
    btn.textContent = 'Create Account'; btn.disabled = false;
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered'))
        msg = 'This email is already registered. Please sign in instead.';
      showLoginMsg(errEl, msg, false); return;
    }
    if (data?.session) { return; }
    else if (data?.user) {
      showLoginMsg(errEl, '✅ Account created! Check your email for a confirmation link before signing in.', true);
      switchTab('signin');
      document.getElementById('auth-email').value = email;
    } else {
      showLoginMsg(errEl, 'Could not create account. Signups may be restricted — please contact your administrator.', false);
    }
  }
}

async function signOut() {
  await sb.auth.signOut();
  isAdmin = false;
  document.body.classList.remove('role-admin', 'role-viewer');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  hideForgotPanel(); switchTab('signin');
}

(async () => {
  try {
    await initSupabase();
  } catch (e) {
    toast(e.message || 'Failed to connect. Please refresh.', true);
    return;
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      isAdmin = ADMIN_EMAILS.includes(session.user.email);
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').classList.add('visible');
      document.getElementById('user-email-display').textContent = session.user.email;
      applyRoleUI();
      initApp();
    } else if (event === 'SIGNED_OUT') {
      isAdmin = false;
      document.getElementById('app').classList.remove('visible');
      document.getElementById('login-screen').style.display = 'flex';
    }
  });
})();

// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════
function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})
       + ' ' + d.toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'});
}
function expiryClass(dt) {
  const diff = new Date(dt).getTime() - Date.now();
  if (diff < 0)              return 'expiry-urgent';
  if (diff < 24*3600*1000)  return 'expiry-urgent';
  if (diff < 3*24*3600*1000) return 'expiry-soon';
  return 'expiry-ok';
}
function statusBadge(s) {
  const m = { Approved:'badge-green', Pending:'badge-amber', Distributed:'badge-blue', Fulfilled:'badge-green', Rejected:'badge-red' };
  return `<span class="badge ${m[s]||'badge-gray'}">${s||'—'}</span>`;
}
function catBadge(c) {
  const m = { Cooked:'badge-red', Raw:'badge-green', Packaged:'badge-blue' };
  return `<span class="badge ${m[c]||'badge-gray'}">${c}</span>`;
}
function openModal(id) {
  document.querySelectorAll(`#${id} .alert`).forEach(a => { a.className = 'alert'; a.textContent = ''; });
  document.querySelectorAll(`#${id} select`).forEach(s => { s.selectedIndex = 0; });
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll(`#${id} input`).forEach(i => { i.value = ''; });
  document.querySelectorAll(`#${id} select`).forEach(s => { s.selectedIndex = 0; });
  document.querySelectorAll(`#${id} textarea`).forEach(t => { t.value = ''; });
}
document.querySelectorAll('.modal-backdrop').forEach(el =>
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); })
);
function emptyState(msg) {
  return `<div class="empty"><div class="empty-icon">🌿</div><div class="empty-title">${msg}</div></div>`;
}
function filterTable(tbodyId, query) {
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  const q = query.toLowerCase();
  rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
function confirmDelete(title, msg, onConfirm) {
  if (!isAdmin) { toast('Access denied. Admin only.', true); return; }
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  document.getElementById('confirm-dialog').classList.add('open');
  const btn = document.getElementById('confirm-ok');
  btn.onclick = () => { document.getElementById('confirm-dialog').classList.remove('open'); onConfirm(); };
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 700, startTs = performance.now();
  const step = ts => {
    const progress = Math.min((ts - startTs) / dur, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
const pageTitles = {
  dashboard:'Dashboard', donors:'Donors', donations:'Donations',
  fooditems:'Food Items', receivers:'Receivers', requests:'Requests',
  admin:'Admin Panel', locations:'Locations'
};
function navigate(page) {
  if ((page === 'admin' || page === 'locations') && !isAdmin) {
    toast('Access denied. Admins only.', true);
    return;
  }
  closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[onclick*="navigate('${page}')"]`).classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[page];
  loaders[page]?.();
}
const loaders = {
  dashboard: loadDashboard, donors: loadDonors, donations: loadDonations,
  fooditems: loadFoodItems, receivers: loadReceivers, requests: loadRequests,
  admin: loadAdmin, locations: loadLocations
};

// ══════════════════════════════════════════════
// LOADERS
// ══════════════════════════════════════════════

async function loadDashboard() {
  progressStart();

  const [d,dn,rc,exp] = await Promise.all([
    sb.from('donation').select('*',{count:'exact',head:true}),
    sb.from('donor').select('*',{count:'exact',head:true}),
    sb.from('receiver').select('*',{count:'exact',head:true}),
    sb.from('food_item').select('food_id').gt('expiry_time',new Date().toISOString()).lt('expiry_time',new Date(Date.now()+86400000).toISOString()),
  ]);
  animateCount('stat-donations', d.count ?? 0);
  animateCount('stat-donors',    dn.count ?? 0);
  animateCount('stat-receivers', rc.count ?? 0);
  animateCount('stat-expiring',  exp.data?.length ?? 0);

  const {data:recent} = await sb.from('donation').select('donation_id,status,donation_timestamp,donor(first_name,last_name)').order('donation_timestamp',{ascending:false}).limit(5);
  document.getElementById('recent-donations').innerHTML = recent?.length
    ? recent.map(d=>`<div class="activity-item"><div class="activity-dot ${d.status?.toLowerCase()}"></div><div class="activity-text"><strong>${d.donor?.first_name||'?'} ${d.donor?.last_name||''}</strong> — Donation #${d.donation_id}</div><div style="display:flex;align-items:center;gap:6px;">${statusBadge(d.status)}<span class="activity-time">${fmt(d.donation_timestamp)}</span></div></div>`).join('')
    : emptyState('No donations yet');

  const {data:ei} = await sb.from('food_item').select('food_id,food_name,quantity,expiry_time').order('expiry_time').limit(6);
  document.getElementById('expiring-items').innerHTML = ei?.length
    ? ei.map(f=>`<div class="activity-item"><div class="activity-dot"></div><div class="activity-text"><strong>${f.food_name}</strong> — ${f.quantity} units</div><span class="activity-time ${expiryClass(f.expiry_time)}">${fmt(f.expiry_time)}</span></div>`).join('')
    : emptyState('No items');

  const {data:pr} = await sb.from('request').select('request_id,donation_id,requested_quantity,request_status,receiver(name),donation(status)').eq('request_status','Pending').limit(5);
  document.getElementById('pending-requests-dash').innerHTML = pr?.length
    ? `<div class="table-wrap"><table><thead><tr><th>Receiver</th><th>Donation</th><th>Qty</th><th>Status</th></tr></thead><tbody>${pr.map(r=>`<tr><td>${r.receiver?.name||'—'}</td><td>#${r.donation_id}</td><td>${r.requested_quantity}</td><td>${statusBadge(r.request_status)}</td></tr>`).join('')}</tbody></table></div>`
    : emptyState('No pending requests 🎉');
  progressDone();
}

async function loadDonors() {
  progressStart();
  const {data,error} = await sb.from('donor').select('*').order('donor_id');

  // Try fetching contact numbers; silently skip if table doesn't exist
  let contactMap = {};
  try {
    const {data:contacts} = await sb.from('donor_contact').select('donor_id,contact_number');
    if (contacts) contacts.forEach(c => {
      if (!contactMap[c.donor_id]) contactMap[c.donor_id] = [];
      contactMap[c.donor_id].push(c.contact_number);
    });
  } catch(e) {}

  const tb = document.getElementById('donors-tbody');
  if (error||!data?.length) { tb.innerHTML=`<tr><td colspan="6">${emptyState('No donors registered')}</td></tr>`; progressDone(); return; }

  // Detect which columns actually exist from the first row
  const sample = data[0];
  const hasCity    = 'city'    in sample;
  const hasContacts = Object.keys(contactMap).length > 0;

  tb.innerHTML = data.map(d=>`<tr>
    <td><code>#${d.donor_id}</code></td>
    <td><strong>${d.first_name||''} ${d.last_name||''}</strong></td>
    <td>${d.email||'—'}</td>
    ${hasCity ? `<td>${d.city||'—'}</td>` : ''}
    ${hasContacts ? `<td>${(contactMap[d.donor_id]||[]).join(', ')||'—'}</td>` : ''}
    <td>${isAdmin
      ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Donor','This will remove the donor and all related data.',()=>deleteRecord('donor','donor_id',${d.donor_id},loadDonors))">🗑️ Delete</button>`
      : '<span class="badge badge-gray">View only</span>'
    }</td>
  </tr>`).join('');
  progressDone();
}

async function loadDonations() {
  progressStart();
  // Show donate CTA for regular users
  const cta = document.getElementById('donate-cta');
  if (cta) cta.style.display = isAdmin ? 'none' : 'flex';
  const statusFilter = document.getElementById('filter-donation-status')?.value;
  let q = sb.from('donation').select('*, donor(first_name,last_name), location(area_name,city)').order('donation_id',{ascending:false});
  if (statusFilter) q = q.eq('status', statusFilter);
  const {data,error} = await q;
  const tb = document.getElementById('donations-tbody');
  if (error||!data?.length) { tb.innerHTML=`<tr><td colspan="6">${emptyState('No donations found')}</td></tr>`; progressDone(); return; }
  tb.innerHTML = data.map(d=>`<tr>
    <td><code>#${d.donation_id}</code></td>
    <td><strong>${d.donor?.first_name||'?'} ${d.donor?.last_name||''}</strong></td>
    <td>${d.location?`${d.location.area_name}, ${d.location.city}`:'—'}</td>
    <td>${fmt(d.donation_timestamp)}</td>
    <td>${statusBadge(d.status)}</td>
    <td style="display:flex;gap:4px;flex-wrap:wrap;">
      ${isAdmin ? `
        ${d.status==='Pending'  ? `<button class="btn btn-secondary btn-sm" onclick="updateDonationStatus(${d.donation_id},'Approved')">✅ Approve</button>` : ''}
        ${d.status==='Approved' ? `<button class="btn btn-secondary btn-sm" onclick="updateDonationStatus(${d.donation_id},'Distributed')">📤 Distribute</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Donation','All food items linked to this donation will also be deleted.',()=>deleteRecord('donation','donation_id',${d.donation_id},loadDonations))">🗑️</button>
      ` : '<span class="badge badge-gray">View only</span>'}
    </td>
  </tr>`).join('');
  progressDone();
}

async function loadFoodItems() {
  progressStart();
  const cat = document.getElementById('filter-food-cat')?.value;
  let q = sb.from('food_item').select('*, donation(status)').order('expiry_time');
  if (cat) q = q.eq('category', cat);
  const {data,error} = await q;
  const tb = document.getElementById('food-tbody');
  if (error||!data?.length) { tb.innerHTML=`<tr><td colspan="7">${emptyState('No food items recorded')}</td></tr>`; progressDone(); return; }
  tb.innerHTML = data.map(f=>`<tr>
    <td><code>#${f.food_id}</code></td>
    <td><strong>${f.food_name}</strong></td>
    <td>${catBadge(f.category)}</td>
    <td>${f.quantity}</td>
    <td class="${expiryClass(f.expiry_time)}">${fmt(f.expiry_time)}</td>
    <td><code>#${f.donation_id}</code></td>
    <td>${isAdmin
      ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Food Item','Remove this food item from the donation.',()=>deleteRecord('food_item','food_id',${f.food_id},loadFoodItems))">🗑️</button>`
      : '<span class="badge badge-gray">View only</span>'
    }</td>
  </tr>`).join('');
  progressDone();
}

async function loadReceivers() {
  progressStart();
  const {data,error} = await sb.from('receiver').select('*').order('receiver_id');

  // Try fetching contacts and request counts; silently skip if tables don't exist
  let contactMap = {}, requestCount = {};
  try {
    const {data:contacts} = await sb.from('receiver_contact').select('receiver_id,contact_number');
    if (contacts) contacts.forEach(c => {
      if (!contactMap[c.receiver_id]) contactMap[c.receiver_id] = [];
      contactMap[c.receiver_id].push(c.contact_number);
    });
  } catch(e) {}
  try {
    const {data:reqs} = await sb.from('request').select('receiver_id');
    if (reqs) reqs.forEach(r => { requestCount[r.receiver_id] = (requestCount[r.receiver_id]||0)+1; });
  } catch(e) {}

  const tb = document.getElementById('receivers-tbody');
  if (error||!data?.length) { tb.innerHTML=`<tr><td colspan="7">${emptyState('No receivers registered')}</td></tr>`; progressDone(); return; }

  const sample = data[0];
  const hasType    = 'type' in sample;
  const hasCity    = 'city' in sample;
  const hasContacts = Object.keys(contactMap).length > 0;
  const hasRequests = Object.keys(requestCount).length > 0;

  tb.innerHTML = data.map(r=>`<tr>
    <td><code>#${r.receiver_id}</code></td>
    <td><strong>${r.name||'—'}</strong></td>
    ${hasType ? `<td><span class="badge ${r.type==='NGO'?'badge-blue':'badge-gray'}">${r.type||'—'}</span></td>` : ''}
    ${hasCity ? `<td>${r.city||'—'}</td>` : ''}
    ${hasContacts ? `<td>${(contactMap[r.receiver_id]||[]).join(', ')||'—'}</td>` : ''}
    ${hasRequests ? `<td><span class="badge badge-green">${requestCount[r.receiver_id]||0} requests</span></td>` : ''}
    <td>${isAdmin
      ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Receiver','This will also remove all requests from this receiver.',()=>deleteRecord('receiver','receiver_id',${r.receiver_id},loadReceivers))">🗑️</button>`
      : '<span class="badge badge-gray">View only</span>'
    }</td>
  </tr>`).join('');
  progressDone();
}

async function loadAvailableFood() {
  const grid = document.getElementById('available-food-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  const { data, error } = await sb
    .from('donation')
    .select('*, donor(first_name,last_name), location(area_name,city), food_item(food_name,category,quantity,expiry_time)')
    .eq('status', 'Approved')
    .order('donation_id', { ascending: false });

  if (error || !data?.length) {
    grid.innerHTML = '<div style="grid-column:1/-1">' + emptyState('No food available right now. Check back soon! 🍽️') + '</div>';
    return;
  }

  grid.innerHTML = data.map(d => {
    const foods = d.food_item || [];
    const foodList = foods.length
      ? foods.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:13px;font-weight:500;">${f.food_name} <span style="color:var(--muted);font-size:11px;">(${f.category})</span></span>
          <span class="${expiryClass(f.expiry_time)}" style="font-size:11px;">${fmt(f.expiry_time)}</span>
        </div>`).join('')
      : '<div style="color:var(--muted);font-size:12px;">No food items listed</div>';

    return `<div class="card" style="display:flex;flex-direction:column;gap:0;">
      <div class="card-body" style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;">Donation #${d.donation_id}</div>
            <div style="color:var(--muted);font-size:12px;margin-top:2px;">👤 ${d.donor?.first_name||'?'} ${d.donor?.last_name||''} ${d.location ? '· 📍 '+d.location.area_name+', '+d.location.city : ''}</div>
          </div>
          <span class="badge badge-green">Available</span>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:8px;">${foodList}</div>
      </div>
      <div style="padding:12px 20px 16px;">
        <button class="btn btn-primary" style="width:100%;" onclick="openRequestFor(${d.donation_id})">📋 Request This Food</button>
      </div>
    </div>`;
  }).join('');
}

function openRequestFor(donationId) {
  openModal('modal-add-request');
  const statusEl = document.getElementById('req-status');
  if (statusEl) statusEl.value = 'Pending';
  // Try to preselect immediately; if not loaded yet, wait for populateSelects
  const tryPreselect = () => {
    const sel = document.getElementById('req-donation');
    if (sel) {
      sel.value = donationId;
      if (sel.value != donationId) {
        // Option not yet in DOM, retry once after populate
        sel.dataset.preselect = donationId;
      }
    }
  };
  tryPreselect();
}

async function loadRequests() {
  progressStart();
  // Show available food for regular users
  if (!isAdmin) loadAvailableFood();
  const statusFilter = document.getElementById('filter-req-status')?.value;
  let q = sb.from('request').select('*, receiver(name), donation(status)').order('request_id',{ascending:false});
  if (statusFilter) q = q.eq('request_status', statusFilter);
  const {data,error} = await q;
  const tb = document.getElementById('requests-tbody');
  if (error||!data?.length) { tb.innerHTML=`<tr><td colspan="6">${emptyState('No requests found')}</td></tr>`; progressDone(); return; }
  tb.innerHTML = data.map(r=>`<tr>
    <td><code>#${r.request_id}</code></td>
    <td><strong>${r.receiver?.name||'—'}</strong></td>
    <td><code>#${r.donation_id}</code> ${statusBadge(r.donation?.status||'')}</td>
    <td>${r.requested_quantity}</td>
    <td>${statusBadge(r.request_status)}</td>
    <td style="display:flex;gap:4px;flex-wrap:wrap;">
      ${isAdmin ? `
        ${r.request_status==='Pending' ? `<button class="btn btn-secondary btn-sm" onclick="updateRequestStatus(${r.request_id},'Fulfilled')">✅</button><button class="btn btn-danger btn-sm" onclick="updateRequestStatus(${r.request_id},'Rejected')">✕</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Request','Remove this request record.',()=>deleteRecord('request','request_id',${r.request_id},loadRequests))">🗑️</button>
      ` : '<span class="badge badge-gray">View only</span>'}
    </td>
  </tr>`).join('');
  progressDone();
}

async function loadAdmin() {
  if (!isAdmin) { toast('Access denied. Admins only.', true); navigate('dashboard'); return; }
  progressStart();
  const {data:pending} = await sb.from('donation').select('*, donor(first_name,last_name), location(area_name,city), food_item(food_name)').eq('status','Pending');
  const tb = document.getElementById('admin-tbody');
  tb.innerHTML = pending?.length
    ? pending.map(d=>`<tr>
        <td><code>#${d.donation_id}</code></td>
        <td><strong>${d.donor?.first_name||'?'} ${d.donor?.last_name||''}</strong></td>
        <td>${d.location?`${d.location.area_name}, ${d.location.city}`:'—'}</td>
        <td>${d.food_item?.map(f=>f.food_name).join(', ')||'—'}</td>
        <td>${fmt(d.donation_timestamp)}</td>
        <td style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="updateDonationStatus(${d.donation_id},'Approved')">✅ Approve</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('Reject Donation?','This donation will be permanently removed.',()=>deleteRecord('donation','donation_id',${d.donation_id},loadAdmin))">✕ Reject</button>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="6">${emptyState('🎉 All caught up! No pending donations.')}</td></tr>`;

  const {data:admins} = await sb.from('admin').select('*');
  document.getElementById('admins-tbody').innerHTML = (admins||[]).map(a=>`
    <tr>
      <td><code>#${a.admin_id||'—'}</code></td>
      <td><strong>${a.name||a.username||'—'}</strong></td>
      <td>${a.email||'—'}</td>
      ${a.authorization_level !== undefined ? `<td><span class="badge badge-green">${a.authorization_level}</span></td>` : ''}
    </tr>`).join('') || `<tr><td colspan="4">${emptyState('No admins')}</td></tr>`;
  progressDone();
}

async function loadLocations() {
  if (!isAdmin) { toast('Access denied. Admins only.', true); navigate('dashboard'); return; }
  progressStart();
  const {data} = await sb.from('location').select('*');

  // Try fetching donation counts; silently skip if not available
  let donationCount = {};
  try {
    const {data:dons} = await sb.from('donation').select('location_id');
    if (dons) dons.forEach(d => { if(d.location_id) donationCount[d.location_id] = (donationCount[d.location_id]||0)+1; });
  } catch(e) {}

  const grid = document.getElementById('locations-grid');
  if (!data?.length) { grid.innerHTML = emptyState('No locations added'); progressDone(); return; }

  const sample = data[0];
  const hasPickup = 'pickup_point' in sample;

  grid.innerHTML = data.map(l=>`
    <div class="card loc-card">
      <div class="card-body">
        <div style="font-size:28px;margin-bottom:10px;">📍</div>
        <div style="font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:700;">${l.area_name||'—'}</div>
        <div style="color:var(--muted);font-size:13px;margin-top:4px;">🏙️ ${l.city||'—'}</div>
        ${hasPickup && l.pickup_point ? `<div style="color:var(--muted);font-size:12px;margin-top:3px;">🏢 ${l.pickup_point}</div>` : ''}
        <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;">
          <span class="badge badge-green">${donationCount[l.location_id]||0} donations</span>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete Location','Remove this location.',()=>deleteRecord('location','location_id',${l.location_id},loadLocations))">🗑️</button>
        </div>
      </div>
    </div>`).join('');
  progressDone();
}

// ══════════════════════════════════════════════
// ACTIONS (admin only)
// ══════════════════════════════════════════════
async function submitDonation() {
  const fn   = document.getElementById('dn-fname').value.trim();
  const ln   = document.getElementById('dn-lname').value.trim();
  const em   = document.getElementById('dn-email').value.trim();
  const phone= document.getElementById('dn-phone').value.trim();
  const city = document.getElementById('dn-city').value.trim();
  const food = document.getElementById('dn-food-name').value.trim();
  const cat  = document.getElementById('dn-category').value;
  const qty  = document.getElementById('dn-qty').value;
  const exp  = document.getElementById('dn-expiry').value;
  const lid  = document.getElementById('dn-location').value;

  if (!fn || !ln || !em)       { showAlert('alert-donate','Please fill in your First Name, Last Name and Email.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showAlert('alert-donate','Please enter a valid email address.'); return; }
  if (!food || !qty || !exp)   { showAlert('alert-donate','Please fill in all food details (name, quantity and expiry).'); return; }
  if (parseFloat(qty) <= 0)    { showAlert('alert-donate','Quantity must be greater than zero.'); return; }

  const btn = document.getElementById('btn-submit-donate');
  btn.disabled = true; btn.textContent = '⏳ Submitting…';

  // Step 1: Create or reuse donor by email
  let donorId;
  const { data: existing } = await sb.from('donor').select('donor_id').eq('email', em).maybeSingle();
  if (existing) {
    donorId = existing.donor_id;
    // Update donor info in case it changed
    await sb.from('donor').update({ first_name: fn, last_name: ln, city: city || null }).eq('donor_id', donorId);
  } else {
    const { data: newDonor, error: de } = await sb.from('donor')
      .insert({ first_name: fn, last_name: ln, email: em, city: city || null })
      .select('donor_id').single();
    if (de) { showAlert('alert-donate', de.message); btn.disabled=false; btn.textContent='🍽️ Submit Donation'; return; }
    donorId = newDonor.donor_id;
    if (phone) await sb.from('donor_contact').insert({ donor_id: donorId, contact_number: phone });
  }

  // Step 2: Create donation (Pending)
  const { data: don, error: donErr } = await sb.from('donation')
    .insert({ donor_id: donorId, location_id: lid ? parseInt(lid) : null, status: 'Pending' })
    .select('donation_id').single();
  if (donErr) { showAlert('alert-donate', donErr.message); btn.disabled=false; btn.textContent='🍽️ Submit Donation'; return; }

  // Step 3: Add food item to donation
  const { error: fiErr } = await sb.from('food_item').insert({
    donation_id: don.donation_id, food_name: food, category: cat,
    quantity: parseFloat(qty), expiry_time: new Date(exp).toISOString()
  });
  if (fiErr) { showAlert('alert-donate', fiErr.message); btn.disabled=false; btn.textContent='🍽️ Submit Donation'; return; }

  toast('✅ Donation submitted! The admin will review it shortly.');
  closeModal('modal-donate-food');
  btn.disabled=false; btn.textContent='🍽️ Submit Donation';

  // Reset form
  ['dn-fname','dn-lname','dn-email','dn-phone','dn-city','dn-food-name','dn-qty','dn-expiry']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });

  await populateSelects();
  loadDonations();
}

async function addDonor() {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const fn=document.getElementById('d-fname').value.trim(), ln=document.getElementById('d-lname').value.trim(), em=document.getElementById('d-email').value.trim();
  if (!fn||!ln||!em) { showAlert('alert-donor','Please fill in First Name, Last Name, and Email.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showAlert('alert-donor','Please enter a valid email address.'); return; }
  const btn = document.querySelector('#modal-add-donor .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {data,error} = await sb.from('donor').insert({first_name:fn,last_name:ln,email:em,house_no:document.getElementById('d-house').value||null,street:document.getElementById('d-street').value||null,city:document.getElementById('d-city').value||null,postal_code:document.getElementById('d-postal').value||null}).select().single();
  if (error) { showAlert('alert-donor',error.message); btn.disabled=false; btn.textContent='💾 Save Donor'; return; }
  const phone = document.getElementById('d-phone').value.trim();
  if (phone && data) await sb.from('donor_contact').insert({donor_id:data.donor_id, contact_number:phone});
  toast('Donor added successfully!'); closeModal('modal-add-donor'); btn.disabled=false; btn.textContent='💾 Save Donor';
  await populateSelects(); loadDonors();
}

async function addDonation() {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const did = document.getElementById('don-donor').value;
  if (!did) { showAlert('alert-donation','Please select a donor before saving.'); return; }
  const lid = document.getElementById('don-location').value || null;
  const btn = document.querySelector('#modal-add-donation .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {error} = await sb.from('donation').insert({donor_id:parseInt(did),location_id:lid?parseInt(lid):null,status:document.getElementById('don-status').value});
  if (error) { showAlert('alert-donation',error.message); btn.disabled=false; btn.textContent='💾 Save'; return; }
  toast('Donation recorded!'); closeModal('modal-add-donation'); btn.disabled=false; btn.textContent='💾 Save';
  await populateSelects(); loadDonations();
}

async function addFoodItem() {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const did=document.getElementById('fi-donation').value, name=document.getElementById('fi-name').value.trim(), qty=document.getElementById('fi-qty').value, exp=document.getElementById('fi-expiry').value;
  if (!did||!name||!qty||!exp) { showAlert('alert-food','Please fill in all required fields.'); return; }
  if (parseFloat(qty)<=0) { showAlert('alert-food','Quantity must be greater than zero.'); return; }
  const btn = document.querySelector('#modal-add-food .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {error} = await sb.from('food_item').insert({donation_id:parseInt(did),food_name:name,category:document.getElementById('fi-category').value,quantity:parseFloat(qty),expiry_time:new Date(exp).toISOString()});
  if (error) { showAlert('alert-food',error.message); btn.disabled=false; btn.textContent='💾 Save'; return; }
  toast('Food item added!'); closeModal('modal-add-food'); btn.disabled=false; btn.textContent='💾 Save'; loadFoodItems();
}

async function addReceiver() {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const name = document.getElementById('r-name').value.trim();
  if (!name) { showAlert('alert-receiver','Receiver name or organization name is required.'); return; }
  const btn = document.querySelector('#modal-add-receiver .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {data,error} = await sb.from('receiver').insert({name,type:document.getElementById('r-type').value,house_no:document.getElementById('r-house').value||null,street:document.getElementById('r-street').value||null,city:document.getElementById('r-city').value||null,postal_code:document.getElementById('r-postal').value||null}).select().single();
  if (error) { showAlert('alert-receiver',error.message); btn.disabled=false; btn.textContent='💾 Save'; return; }
  const phone = document.getElementById('r-phone').value.trim();
  if (phone && data) await sb.from('receiver_contact').insert({receiver_id:data.receiver_id, contact_number:phone});
  toast('Receiver added!'); closeModal('modal-add-receiver'); btn.disabled=false; btn.textContent='💾 Save';
  await populateSelects(); loadReceivers();
}

async function addRequest() {
  const rid=document.getElementById('req-receiver').value, did=document.getElementById('req-donation').value, qty=document.getElementById('req-qty').value;
  if (!rid||!did||!qty) { showAlert('alert-request','Please fill in all required fields.'); return; }
  if (parseFloat(qty)<=0) { showAlert('alert-request','Quantity must be greater than zero.'); return; }
  const btn = document.querySelector('#modal-add-request .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {error} = await sb.from('request').insert({receiver_id:parseInt(rid),donation_id:parseInt(did),requested_quantity:parseFloat(qty),request_status:'Pending'});
  if (error) { showAlert('alert-request',error.message); btn.disabled=false; btn.textContent='💾 Save'; return; }
  toast('Request submitted!'); closeModal('modal-add-request'); btn.disabled=false; btn.textContent='💾 Save'; loadRequests();
}

async function addLocation() {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const area=document.getElementById('loc-area').value.trim(), city=document.getElementById('loc-city').value.trim();
  if (!area||!city) { showAlert('alert-location','Area name and city are both required.'); return; }
  const btn = document.querySelector('#modal-add-location .btn-primary');
  btn.disabled=true; btn.textContent='💾 Saving…';
  const {error} = await sb.from('location').insert({area_name:area,city,pickup_point:document.getElementById('loc-pickup').value||null});
  if (error) { showAlert('alert-location',error.message); btn.disabled=false; btn.textContent='💾 Save'; return; }
  toast('Location added!'); closeModal('modal-add-location'); btn.disabled=false; btn.textContent='💾 Save';
  await populateSelects(); loadLocations();
}

async function updateDonationStatus(id, status) {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const {error} = await sb.from('donation').update({status}).eq('donation_id',id);
  if (error) { toast('Could not update: ' + error.message, true); return; }
  toast(`Donation #${id} marked as ${status}`);
  loadDonations(); loadAdmin();
}

async function updateRequestStatus(id, status) {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const {error} = await sb.from('request').update({request_status:status}).eq('request_id',id);
  if (error) { toast('Could not update: ' + error.message, true); return; }
  toast(`Request #${id} marked as ${status}`); loadRequests();
}

async function deleteRecord(table, pkCol, pkVal, reloadFn) {
  if (!isAdmin) { toast('Access denied.', true); return; }
  const {error} = await sb.from(table).delete().eq(pkCol, pkVal);
  if (error) { toast('Delete failed: ' + error.message, true); return; }
  toast('Record deleted.'); reloadFn();
}

// ══════════════════════════════════════════════
// POPULATE SELECTS
// ══════════════════════════════════════════════
async function populateSelects() {
  const [donors,donations,allDonations,receivers,locations] = await Promise.all([
    sb.from('donor').select('donor_id,first_name,last_name'),
    sb.from('donation').select('donation_id,status,donor(first_name,last_name)').eq('status','Approved'),
    sb.from('donation').select('donation_id,status,donor(first_name,last_name)').order('donation_id',{ascending:false}),
    sb.from('receiver').select('receiver_id,name'),
    sb.from('location').select('location_id,area_name,city'),
  ]);
  const fill = (id, items, val, label) => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = `<option value="">— Select —</option>` + (items||[]).map(i=>`<option value="${i[val]}">${label(i)}</option>`).join('');
  };
  fill('don-donor',    donors.data,       'donor_id',    d=>`${d.first_name} ${d.last_name}`);
  fill('don-location', locations.data,    'location_id', l=>`${l.area_name}, ${l.city}`);
  fill('dn-location',  locations.data,    'location_id', l=>`${l.area_name}, ${l.city}`);
  fill('fi-donation',  allDonations.data, 'donation_id', d=>`#${d.donation_id} — ${d.donor?.first_name||'?'} (${d.status})`);
  fill('req-receiver', receivers.data,    'receiver_id', r=>r.name);
  fill('req-donation', donations.data,    'donation_id', d=>`#${d.donation_id} — ${d.donor?.first_name||'?'}`);

  // Apply any pending preselect for request modal
  const reqSel = document.getElementById('req-donation');
  if (reqSel?.dataset.preselect) {
    reqSel.value = reqSel.dataset.preselect;
    delete reqSel.dataset.preselect;
  }
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
async function initApp() {
  const {data,error} = await sb.from('location').select('location_id').limit(1);
  const badge = document.getElementById('db-status');
  badge.textContent = error ? '⚠ DB Error' : '● Connected';
  badge.className   = `badge ${error ? 'badge-red' : 'badge-green'}`;
  await populateSelects();
  loadDashboard();
}
