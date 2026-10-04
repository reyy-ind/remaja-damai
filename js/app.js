/* ===== Helper umum ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const tgl = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const today = () => new Date().toISOString().slice(0, 10);
const page = () => (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
function toast(msg, bad) {
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
const sum = (a, f) => a.reduce((s, x) => s + Number(f(x) || 0), 0);
function randKode8() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(8));
  return [...r].map(b => c[b % c.length]).join('');
}
const statusBadge = v => {
  const ok = ['Aktif', 'Lunas', 'Terlaksana', 'Baik', 'Dikembalikan', 'Pemasukan', 'Emas'];
  const warn = ['Persiapan', 'Siap', 'Dipinjam', 'Belum', 'Rusak ringan', 'Perak', 'Penting'];
  const bad = ['Batal', 'Rusak', 'Nonaktif', 'Pengeluaran'];
  return `<span class="badge ${ok.includes(v) ? 'ok' : warn.includes(v) ? 'warn' : bad.includes(v) ? 'bad' : ''}">${esc(v)}</span>`;
};

/* ===== Pengaturan organisasi (tabel pengaturan, 1 baris) ===== */
const Settings = {
  _c: null,
  async get() {
    if (this._c) return this._c;
    let row = {};
    try { row = (await DB.list('pengaturan'))[0] || {}; } catch (e) {}
    this._c = { nama: CONFIG.ORG_NAME, singkatan: CONFIG.ORG_SHORT, alamat: '', wa: '', instagram: '', tentang: '', ...Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null && v !== '')) };
    return this._c;
  }
};

/* ===== Akun & peran =====
   Tiga peran: 'Super Admin' (akses penuh semua data), 'Admin' (hanya Inventaris, Dokumentasi, Laporan),
   dan 'Anggota' (hanya bisa MELIHAT — tidak bisa menambah/mengubah/menghapus data apa pun).
   Mode lokal: tabel users di localStorage. Mode Supabase: Supabase Auth + tabel profiles. */
const WRITE_ADMIN_BIASA = { inventaris: 1, dokumentasi: 1 }; // tabel yang boleh ditulis Admin biasa
const OWN_ONLY = { pinjaman: 'peminjam', iuran: 'anggota' }; // anggota hanya melihat baris yang namanya cocok dgn akunnya
const Auth = {
  utable() { return DB.remote() ? 'profiles' : 'users'; },
  user() { try { return JSON.parse(localStorage.getItem('rd_session')); } catch (e) { return null; } },
  role() { const u = this.user(); return u ? u.peran : null; },
  isSuper() { return this.role() === 'Super Admin'; },
  isStaff() { return this.role() === 'Super Admin' || this.role() === 'Admin'; },
  canWrite(table) { return this.isSuper() || (this.role() === 'Admin' && !!WRITE_ADMIN_BIASA[table]); },
  require() { if (!this.user()) { location.replace('login.html'); throw new Error('belum login'); } },
  logout() { localStorage.removeItem('rd_session'); location.href = 'login.html'; },
  async hash(p) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  },
  _api(path) { return CONFIG.API_URL.replace(/\/$/, '') + path; },
  _email(u) { return u.includes('@') ? u : `${u}@akun.remajadamai.id`; },
  _save(s) { localStorage.setItem('rd_session', JSON.stringify(s)); },
  async token() {
    const u = this.user();
    if (!DB.remote() || !u || !u.access_token) return CONFIG.API_KEY;
    if (u.expires_at - Date.now() / 1000 > 60) return u.access_token;
    const r = await fetch(this._api('/auth/v1/token?grant_type=refresh_token'), { method: 'POST', headers: { apikey: CONFIG.API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: u.refresh_token }) });
    if (!r.ok) { this.logout(); throw new Error('Sesi habis, silakan masuk lagi.'); }
    const j = await r.json(); this._save({ ...u, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at });
    return j.access_token;
  },
  async login(u, p) {
    u = u.trim().toLowerCase();
    if (DB.remote()) {
      const r = await fetch(this._api('/auth/v1/token?grant_type=password'), { method: 'POST', headers: { apikey: CONFIG.API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: this._email(u), password: p }) });
      const j = await r.json();
      if (!r.ok) throw new Error(/confirm/i.test(j.error_description || j.msg || '') ? 'Email belum dikonfirmasi. Matikan "Confirm email" di Supabase (lihat README).' : 'Username atau password salah.');
      const pr = await fetch(this._api(`/rest/v1/profiles?id=eq.${j.user.id}&select=*`), { headers: { apikey: CONFIG.API_KEY, Authorization: 'Bearer ' + j.access_token } });
      const prof = pr.ok ? (await pr.json())[0] : null;
      if (!prof) throw new Error('Profil akun tidak ditemukan. Pastikan database.sql sudah dijalankan.');
      if (!prof.aktif) throw new Error('Akunmu belum aktif. Tunggu persetujuan admin.');
      this._save({ id: prof.id, username: prof.username, nama: prof.nama, peran: prof.peran, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at });
      return;
    }
    const us = await DB.list('users'), h = await this.hash(p);
    const f = us.find(x => x.username === u && x.password_hash === h);
    if (!f) throw new Error('Username atau password salah.');
    if (f.aktif === false) throw new Error('Akunmu belum aktif. Tunggu persetujuan admin.');
    this._save({ id: f.id, username: f.username, nama: f.nama, peran: f.peran });
  },
  /* Pendaftaran akun publik. Peran TIDAK bisa dipilih: akun pertama = Super Admin, sisanya = Anggota (menunggu persetujuan). */
  async register(u, nama, p) {
    u = u.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('Username 3–30 karakter: huruf kecil, angka, titik, garis bawah, atau strip.');
    if (DB.remote()) {
      const r = await fetch(this._api('/auth/v1/signup'), { method: 'POST', headers: { apikey: CONFIG.API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: this._email(u), password: p, data: { username: u, nama } }) });
      const j = await r.json();
      if (!r.ok) throw new Error(/registered|exists/i.test(j.msg || j.error_description || '') ? 'Username sudah dipakai.' : (j.msg || j.error_description || 'Pendaftaran gagal.'));
      return;
    }
    const us = await DB.list('users');
    if (us.some(x => x.username === u)) throw new Error('Username sudah dipakai.');
    const first = us.length === 0;
    const row = await DB.add('users', { username: u, nama, password_hash: await this.hash(p), peran: first ? 'Super Admin' : 'Anggota', aktif: first });
    try { await DB.add('anggota', { nama, status: first ? 'Aktif' : 'Nonaktif', kode: randKode8() }); } catch (e) { console.warn('anggota sync', e); }
    return row;
  },
  async changePassword(p) {
    if (DB.remote()) {
      const r = await fetch(this._api('/auth/v1/user'), { method: 'PUT', headers: { apikey: CONFIG.API_KEY, Authorization: 'Bearer ' + await this.token(), 'Content-Type': 'application/json' }, body: JSON.stringify({ password: p }) });
      if (!r.ok) throw new Error((await r.json()).msg || 'Gagal mengganti password.');
    } else await DB.update('users', this.user().id, { password_hash: await this.hash(p) });
  }
};

/* ===== Chart pemasukan vs pengeluaran 6 bulan ===== */
function chartSVG(trx) {
  const now = new Date(), ms = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); ms.push({ k: d.toISOString().slice(0, 7), l: d.toLocaleDateString('id-ID', { month: 'short' }), i: 0, o: 0 }); }
  trx.forEach(t => { const m = ms.find(x => x.k === String(t.tanggal || '').slice(0, 7)); if (m) m[t.jenis === 'Pemasukan' ? 'i' : 'o'] += Number(t.jumlah || 0); });
  const max = Math.max(1, ...ms.flatMap(m => [m.i, m.o])), H = 150;
  const bars = ms.map((m, x) => {
    const bx = 30 + x * 88, hi = m.i / max * H, ho = m.o / max * H;
    return `<rect x="${bx}" y="${170 - hi}" width="26" height="${hi}" rx="4" fill="#7bd88f"/><rect x="${bx + 30}" y="${170 - ho}" width="26" height="${ho}" rx="4" fill="#ff7a7a"/><text x="${bx + 28}" y="190" text-anchor="middle" font-size="12" fill="#93a89a">${m.l}</text>`;
  }).join('');
  return { svg: `<svg class="svgc" viewBox="0 0 560 200" role="img" aria-label="Grafik pemasukan dan pengeluaran 6 bulan terakhir"><line x1="20" y1="170" x2="550" y2="170" stroke="#2a4034"/>${bars}</svg>`, i: sum(ms, m => m.i), o: sum(ms, m => m.o) };
}
const chartBlock = trx => { const c = chartSVG(trx); return `${c.svg}<div class="legend"><span><i style="background:#7bd88f"></i>Pemasukan</span><span><i style="background:#ff7a7a"></i>Pengeluaran</span></div><p class="muted sm" style="margin-top:8px">Total pemasukan ${rp(c.i)} dan pengeluaran ${rp(c.o)} pada periode ini.</p>`; };

/* ===== Form dinamis dari SCHEMA ===== */
const Form = {
  build(fields, v = {}, ctx = {}) {
    return fields.map(f => {
      const val = v[f.k] ?? f.d ?? '', id = 'f_' + f.k, wide = f.t === 'textarea' ? ' full' : '';
      if (f.t === 'checkbox') return `<div class="f chk full"><label><input type="checkbox" id="${id}" ${val === true || val === 'true' ? 'checked' : ''}> ${esc(f.l)}</label></div>`;
      let inp;
      if (f.t === 'select') inp = `<select id="${id}">${f.o.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      else if (f.t === 'textarea') inp = `<textarea id="${id}">${esc(val)}</textarea>`;
      else if (f.t === 'image') inp = `<input type="file" id="${id}" accept="image/*">${val ? `<img class="thumb" style="margin-top:8px;width:72px;height:72px;border-radius:8px;object-fit:cover" src="${esc(val)}" alt="">` : ''}<small class="muted">Untuk hasil terbaik gunakan foto di bawah 1 MB. Setelah database tersambung, kamu bisa mengganti ini dengan upload ke storage.</small>`;
      else if (f.src) { const [t, c] = f.src.split('.'), opts = [...new Set((ctx[t] || []).map(x => x[c]).filter(Boolean))]; inp = `<input id="${id}" list="dl_${f.k}" value="${esc(val)}" autocomplete="off"><datalist id="dl_${f.k}">${opts.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`; }
      else inp = `<input id="${id}" type="${f.t === 'number' ? 'number' : f.t || 'text'}" ${f.t === 'number' ? 'min="0" step="any"' : ''} value="${esc(val)}" ${f.req ? 'required' : ''}>`;
      return `<div class="f${wide}"><label for="${id}">${esc(f.l)}${f.req ? ' *' : ''}</label>${inp}</div>`;
    }).join('');
  },
  async read(fields, old = {}) {
    const d = {};
    for (const f of fields) {
      const el = $('#f_' + f.k); if (!el) continue;
      if (f.t === 'checkbox') d[f.k] = el.checked;
      else if (f.t === 'number') d[f.k] = el.value === '' ? null : Number(el.value);
      else if (f.t === 'image') {
        const file = el.files[0];
        d[f.k] = file ? await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }) : (old[f.k] || '');
      } else d[f.k] = el.value.trim();
      if ((f.t === 'date' || f.t === 'month') && d[f.k] === '') d[f.k] = null;
    }
    return d;
  },
  missing(fields, d) { const m = fields.find(f => f.req && (d[f.k] === null || d[f.k] === '' || d[f.k] === undefined)); return m ? `${m.l} wajib diisi.` : ''; }
};

function modal(html) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`;
  m.addEventListener('mousedown', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m); return m;
}

/* ===== Kerangka halaman admin =====
   Elemen ke-4 tiap baris NAV: daftar peran yang boleh melihat & membuka menu itu. */
const ROLES_ALL = ['Super Admin', 'Admin', 'Anggota'];
const NAV = [
  ['dashboard', 'Dashboard', 'home', ROLES_ALL],
  ['anggota', 'Anggota', 'users', ['Super Admin']],
  ['event', 'Kegiatan & Event', 'calendar', ['Super Admin', 'Anggota']],
  ['jimpitan', 'Jimpitan', 'qr', ['Super Admin']],
  ['absensi', 'Absensi (lama)', 'qr', ['Super Admin']],
  ['keuangan', 'Keuangan', 'wallet', ['Super Admin', 'Anggota']],
  ['iuran', 'Iuran', 'coin', ['Super Admin', 'Anggota']],
  ['inventaris', 'Inventaris', 'box', ROLES_ALL],
  ['pinjaman', 'Pinjaman', 'swap', ['Super Admin', 'Anggota']],
  ['achievement', 'Achievement', 'trophy', ['Super Admin', 'Anggota']],
  ['arsip-rapat', 'Arsip Rapat', 'archive', ['Super Admin', 'Anggota']],
  ['dokumentasi-admin', 'Dokumentasi', 'image', ROLES_ALL],
  ['laporan', 'Laporan', 'file', ['Super Admin', 'Admin']],
  ['notifikasi', 'Notifikasi', 'bell', ['Super Admin', 'Anggota']],
  ['pengaturan', 'Pengaturan', 'gear', ROLES_ALL]
];
const Admin = {
  async shell(title, actionsHtml = '', bodyHtml = '') {
    Auth.require();
    const role = Auth.role();
    const entry = NAV.find(n => n[0] === page());
    const allowed = entry ? entry[3] : ROLES_ALL;
    if (!allowed.includes(role)) { location.replace('dashboard.html'); throw new Error('akses ditolak'); }
    const s = await Settings.get(), p = page(), u = Auth.user();
    const active = p === 'pinjaman-baru' ? 'pinjaman' : p;
    const roleLabel = role === 'Super Admin' ? 'Super Admin' : role === 'Admin' ? 'Admin' : 'Area anggota';
    document.title = `${title} — ${s.nama}`;
    $('#app').innerHTML = `<div class="adm"><aside class="side" id="side">
      <a class="brand" href="dashboard.html"><img src="${CONFIG.LOGO}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(s.singkatan)}<small>${roleLabel}</small></span></a>
      ${NAV.filter(n => n[3].includes(role)).map(n => `<a href="${n[0]}.html" class="${n[0] === active ? 'on' : ''}">${icon(n[2])}${n[1]}</a>`).join('')}<hr>
      <a href="index.html">${icon('globe')}Lihat situs publik</a>
      <button class="lo" id="logout">${icon('logout')}Keluar (${esc(u.username)})</button></aside>
      <div class="main"><div class="bar-top"><div style="display:flex;gap:12px;align-items:center"><button class="burger" id="burger" aria-label="Buka menu">${icon('menu')}</button><h1>${esc(title)}</h1></div><div id="actions">${actionsHtml}</div></div>
      <div class="cont" id="content">${bodyHtml}</div></div></div>`;
    $('#logout').onclick = () => Auth.logout();
    $('#burger').onclick = () => $('#side').classList.toggle('open');
    return $('#content');
  }
};

/* ===== Halaman CRUD generik =====
   opts: summary(rows,ctx), load:[tabel], cols:[{l,fn(row,ctx)}], actions:[{l,show(row),fn(row)}], addHref, defaults,
   autoFields:{kolom: fn()} nilai yang otomatis diisi saat TAMBAH data baru (mis. kode acak). */
async function crudPage(table, opts = {}) {
  const S = SCHEMA[table], cols = S.fields.filter(f => !f.nolist);
  const me = Auth.user(), role = Auth.role(), canWrite = Auth.canWrite(table);
  const ownField = role === 'Anggota' ? OWN_ONLY[table] : null;
  await Admin.shell(S.title, !canWrite ? '' : opts.addHref ? `<a class="btn pri" href="${opts.addHref}">${icon('plus')}Tambah</a>` : `<button class="btn pri" id="add">${icon('plus')}Tambah</button>`,
    `<div id="sum"></div><div class="tools"><input type="search" id="q" placeholder="Cari di ${esc(S.title.toLowerCase())}…" aria-label="Cari"></div><div id="tbl"></div>`);
  let rows = [], ctx = {};
  const fmt = (f, v) => {
    if (v === null || v === undefined || v === '') return '<span class="muted">-</span>';
    if (f.rp) return rp(v);
    if (f.t === 'date') return tgl(v);
    if (f.t === 'checkbox') return v ? '<span class="badge ok">Ya</span>' : '<span class="badge">Tidak</span>';
    if (f.t === 'image') return `<img class="thumb" src="${esc(v)}" alt="">`;
    if (f.t === 'url') return `<a class="in" href="${esc(v)}" target="_blank" rel="noopener">Buka</a>`;
    if (f.t === 'select') return statusBadge(v);
    return esc(v);
  };
  async function load() {
    try {
      rows = await DB.list(table);
      if (ownField) rows = rows.filter(r => r[ownField] === (me.nama || me.username));
      ctx = await DB.all([...new Set([...(opts.load || []), ...S.fields.filter(f => f.src).map(f => f.src.split('.')[0])])]);
    } catch (e) { $('#tbl').innerHTML = `<div class="empty">Gagal memuat data: ${esc(e.message)}<br>Periksa API_URL, API_KEY, dan tabel <b>${table}</b> di database.</div>`; return; }
    if (opts.summary) $('#sum').innerHTML = opts.summary(rows, ctx);
    draw();
  }
  const rowActs = r => !canWrite ? '' : `<div class="acts">${(opts.actions || []).filter(a => !a.show || a.show(r)).map(a => `<button class="btn xs" data-act="${opts.actions.indexOf(a)}" data-id="${r.id}">${a.l}</button>`).join('')}<button class="btn xs" data-edit="${r.id}">Ubah</button><button class="btn xs dn" data-del="${r.id}">Hapus</button></div>`;
  function draw() {
    const q = $('#q').value.toLowerCase();
    const list = rows.filter(r => !q || JSON.stringify(Object.values(r)).toLowerCase().includes(q));
    if (!list.length) { $('#tbl').innerHTML = `<div class="empty">${rows.length ? 'Tidak ada hasil yang cocok.' : canWrite ? `Belum ada data. Klik <b>Tambah</b> untuk mengisi ${esc(S.title.toLowerCase())} pertama.` : 'Belum ada data.'}</div>`; return; }
    $('#tbl').innerHTML = `<div class="tw"><table><thead><tr>${cols.map(f => `<th>${esc(f.l.replace(/ \(.*\)/, ''))}</th>`).join('')}${(opts.cols || []).map(c => `<th>${esc(c.l)}</th>`).join('')}<th></th></tr></thead><tbody>${list.map(r => `<tr>${cols.map(f => `<td class="${f.t === 'textarea' ? 'wrapc' : ''}">${fmt(f, r[f.k])}</td>`).join('')}${(opts.cols || []).map(c => `<td>${c.fn(r, ctx)}</td>`).join('')}<td>${rowActs(r)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function openForm(row) {
    const m = modal(`<h3>${row ? 'Ubah' : 'Tambah'} ${esc(S.title.toLowerCase())}</h3><form id="frm"><div class="fgrid">${Form.build(S.fields, row || opts.defaults || {}, ctx)}</div><div class="err" id="err"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn" id="cancel">Batal</button><button class="btn pri">Simpan</button></div></form>`);
    $('#cancel', m).onclick = () => m.remove();
    $('#frm', m).onsubmit = async e => {
      e.preventDefault();
      try {
        const d = await Form.read(S.fields, row || {}), miss = Form.missing(S.fields, d);
        if (miss) { $('#err', m).textContent = miss; return; }
        if (!row && opts.autoFields) Object.entries(opts.autoFields).forEach(([k, fn]) => { if (!d[k]) d[k] = fn(); });
        row ? await DB.update(table, row.id, d) : await DB.add(table, d);
        m.remove(); toast('Tersimpan'); load();
      } catch (er) { $('#err', m).textContent = 'Gagal menyimpan: ' + er.message; }
    };
  }
  const addBtn = $('#add'); if (addBtn) addBtn.onclick = () => openForm();
  $('#q').oninput = draw;
  $('#tbl').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) openForm(rows.find(r => r.id === b.dataset.edit));
    else if (b.dataset.del) { if (confirm('Hapus data ini? Tindakan ini tidak bisa dibatalkan.')) { try { await DB.remove(table, b.dataset.del); toast('Terhapus'); load(); } catch (er) { toast(er.message, 1); } } }
    else if (b.dataset.act) { const a = opts.actions[b.dataset.act]; try { await a.fn(rows.find(r => r.id === b.dataset.id)); load(); } catch (er) { toast(er.message, 1); } }
  };
  load();
}

/* ===== Kerangka halaman publik ===== */
const Public = {
  async shell(bodyHtml) {
    const s = await Settings.get(), p = page();
    const links = [['index.html#tentang', 'Tentang', ''], ['kegiatan.html', 'Kegiatan', 'kegiatan'], ['transparansi.html', 'Transparansi', 'transparansi'], ['dokumentasi.html', 'Dokumentasi', 'dokumentasi']];
    document.title = document.title.includes('—') ? document.title : `${document.title} — ${s.nama}`;
    $('#app').innerHTML = `<a href="#konten" style="position:absolute;left:-999px">Lewati ke konten</a>
    <header class="top"><div class="wrap"><a class="brand" href="index.html"><img src="${CONFIG.LOGO}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(s.singkatan)}<small>${esc(s.nama)}</small></span></a>
    <button class="burger" id="bg" aria-label="Menu">${icon('menu')}</button>
    <nav class="nav" id="nav">${links.map(l => `<a href="${l[0]}" class="${l[2] === p || (p === 'kegiatan-detail' && l[2] === 'kegiatan') ? 'on' : ''}">${l[1]}</a>`).join('')}<a class="btn pri" href="${Auth.user() ? 'dashboard.html' : 'login.html'}" style="margin-left:6px;color:#0b1a11">${Auth.user() ? (Auth.isStaff() ? 'Panel Admin' : 'Area Anggota') : 'Masuk'}</a></nav></div></header>
    <main id="konten">${bodyHtml}</main>
    <footer><div class="wrap"><div><b style="color:var(--tx)">${esc(s.nama)}</b><br>${s.alamat ? esc(s.alamat) : ''}</div><div>${s.wa ? `<a href="https://wa.me/${esc(String(s.wa).replace(/\D/g, ''))}">WhatsApp</a> · ` : ''}${s.instagram ? `<a href="https://instagram.com/${esc(String(s.instagram).replace('@', ''))}">Instagram</a> · ` : ''}Dikelola bersama oleh pengurus · ${new Date().getFullYear()}</div></div></footer>`;
    $('#bg').onclick = () => $('#nav').classList.toggle('open');
    return s;
  }
};
