/* ===== KONFIGURASI =====
   Isi API_URL dan API_KEY dengan milikmu (Supabase).
   Kalau dikosongkan, data disimpan di browser (localStorage) untuk uji coba lokal. */
const CONFIG = {
  ORG_NAME: 'Karang Taruna Remaja Damai',
  ORG_SHORT: 'REMAJA DAMAI',
  API_URL: 'https://cthuwplmbejulzyqyfmq.supabase.co',            // contoh: https://abcdxyz.supabase.co
  API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0aHV3cGxtYmVqdWx6eXF5Zm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mjg2NzYsImV4cCI6MjEwNjIwNDY3Nn0.047g5ZUvr36iMHWNka2ciUC_XjAZSPZLH6fd6Mvmvno',            // anon public key dari Supabase
  HERO_IMAGE: 'img/hero-rumah.png',
  LOGO: 'img/logo.png'
};

/* Catatan peran: lihat WRITE_ADMIN_BIASA dan OWN_ONLY di js/app.js.
   Anggota sekarang murni lihat-saja (tidak bisa menambah/mengubah/menghapus data apa pun) —
   semua penulisan data dilakukan Super Admin (semua tabel) atau Admin biasa (khusus Inventaris & Dokumentasi). */

/* ===== SKEMA TABEL (dipakai form, tabel, dan database.sql) =====
   t: text(default) number date month select textarea checkbox image url
   o: pilihan select | src: 'tabel.kolom' untuk saran dari tabel lain
   nolist: sembunyikan di tabel | rp: tampil rupiah */
const SCHEMA = {
  anggota: {
    title: 'Anggota', fields: [
      { k: 'nama', l: 'Nama lengkap', req: 1 },
      { k: 'jabatan', l: 'Jabatan' },
      { k: 'rt', l: 'RT' },
      { k: 'hp', l: 'No. HP' },
      { k: 'alamat', l: 'Alamat', t: 'textarea', nolist: 1 },
      { k: 'status', l: 'Status', t: 'select', o: ['Aktif', 'Nonaktif'], d: 'Aktif' }
    ]
  },
  kegiatan: {
    title: 'Kegiatan & Event', fields: [
      { k: 'judul', l: 'Judul', req: 1 },
      { k: 'jenis', l: 'Jenis', t: 'select', o: ['Kegiatan', 'Event'], d: 'Kegiatan' },
      { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
      { k: 'waktu', l: 'Jam (mis. 19.00 WIB)' },
      { k: 'lokasi', l: 'Lokasi' },
      { k: 'target', l: 'Target peserta', t: 'number' },
      { k: 'budget', l: 'Budget', t: 'number', rp: 1 },
      { k: 'progress', l: 'Progres persiapan (%)', t: 'number', nolist: 1 },
      { k: 'status', l: 'Status', t: 'select', o: ['Persiapan', 'Siap', 'Terlaksana', 'Batal'], d: 'Persiapan' },
      { k: 'deskripsi', l: 'Deskripsi', t: 'textarea', nolist: 1 },
      { k: 'publik', l: 'Tampilkan di halaman publik', t: 'checkbox', d: true }
    ]
  },
  transaksi: {
    title: 'Keuangan', fields: [
      { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
      { k: 'jenis', l: 'Jenis', t: 'select', o: ['Pemasukan', 'Pengeluaran'], d: 'Pemasukan' },
      { k: 'kategori', l: 'Kategori' },
      { k: 'keterangan', l: 'Keterangan', req: 1 },
      { k: 'jumlah', l: 'Jumlah', t: 'number', rp: 1, req: 1 },
      { k: 'kegiatan_terkait', l: 'Kegiatan terkait', src: 'kegiatan.judul', nolist: 1 },
      { k: 'publik', l: 'Tampilkan di transparansi publik', t: 'checkbox', d: true }
    ]
  },
  inventaris: {
    title: 'Inventaris', fields: [
      { k: 'nama', l: 'Nama barang', req: 1 },
      { k: 'kategori', l: 'Kategori' },
      { k: 'total', l: 'Jumlah total', t: 'number', req: 1 },
      { k: 'kondisi', l: 'Kondisi', t: 'select', o: ['Baik', 'Rusak ringan', 'Rusak'], d: 'Baik' },
      { k: 'keterangan', l: 'Keterangan', t: 'textarea', nolist: 1 }
    ]
  },
  pinjaman: {
    title: 'Pinjaman', fields: [
      { k: 'peminjam', l: 'Nama peminjam', req: 1 },
      { k: 'barang', l: 'Barang', src: 'inventaris.nama', req: 1 },
      { k: 'jumlah', l: 'Jumlah', t: 'number', req: 1 },
      { k: 'tgl_pinjam', l: 'Tanggal pinjam', t: 'date', req: 1 },
      { k: 'tgl_kembali', l: 'Rencana kembali', t: 'date' },
      { k: 'status', l: 'Status', t: 'select', o: ['Dipinjam', 'Dikembalikan'], d: 'Dipinjam' },
      { k: 'catatan', l: 'Catatan', t: 'textarea', nolist: 1 }
    ]
  },
  iuran: {
    title: 'Iuran', fields: [
      { k: 'anggota', l: 'Nama anggota', src: 'anggota.nama', req: 1 },
      { k: 'periode', l: 'Periode', t: 'month', req: 1 },
      { k: 'jumlah', l: 'Jumlah', t: 'number', rp: 1, req: 1 },
      { k: 'status', l: 'Status', t: 'select', o: ['Belum', 'Lunas'], d: 'Belum' },
      { k: 'tgl_bayar', l: 'Tanggal bayar', t: 'date' }
    ]
  },
  dokumentasi: {
    title: 'Dokumentasi', fields: [
      { k: 'judul', l: 'Judul', req: 1 },
      { k: 'link', l: 'Link Google Drive', t: 'url', req: 1 },
      { k: 'kegiatan', l: 'Kegiatan', src: 'kegiatan.judul' },
      { k: 'tanggal', l: 'Tanggal', t: 'date' },
      { k: 'publik', l: 'Tampilkan di halaman publik', t: 'checkbox', d: false }
    ]
  },
  arsip_rapat: {
    title: 'Arsip Rapat', fields: [
      { k: 'judul', l: 'Judul rapat', req: 1 },
      { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
      { k: 'tempat', l: 'Tempat' },
      { k: 'notulen', l: 'Notulen / hasil rapat', t: 'textarea', nolist: 1 },
      { k: 'lampiran', l: 'Link lampiran', t: 'url' }
    ]
  },
  achievement: {
    title: 'Achievement', fields: [
      { k: 'judul', l: 'Judul', req: 1 },
      { k: 'deskripsi', l: 'Deskripsi', t: 'textarea' },
      { k: 'tingkat', l: 'Tingkat', t: 'select', o: ['Perunggu', 'Perak', 'Emas'], d: 'Perunggu' },
      { k: 'target', l: 'Target', t: 'number' },
      { k: 'progress', l: 'Progres saat ini', t: 'number' }
    ]
  },
  notifikasi: {
    title: 'Notifikasi', fields: [
      { k: 'judul', l: 'Judul', req: 1 },
      { k: 'pesan', l: 'Pesan', t: 'textarea' },
      { k: 'tipe', l: 'Tipe', t: 'select', o: ['Info', 'Penting'], d: 'Info' },
      { k: 'tanggal', l: 'Tanggal', t: 'date' }
    ]
  }
};

/* ===== LAPISAN DATA =====
   Tanpa API_URL/API_KEY -> localStorage (uji coba). Dengan keduanya -> Supabase (REST + Auth). */
const VIEWS = { // di database.sql berupa view; di mode lokal dihitung dari tabel asal
  pinjaman_aktif: { from: 'pinjaman', where: r => r.status === 'Dipinjam', pick: ['barang', 'jumlah'] },
  anggota_publik: { from: 'anggota', where: r => r.status !== 'Nonaktif', pick: ['id'] }
};
const DB = {
  remote() { return !!(CONFIG.API_URL && CONFIG.API_KEY); },
  async _h() { const t = await Auth.token(); return { apikey: CONFIG.API_KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', Prefer: 'return=representation' }; },
  _url(t, q = '') { return `${CONFIG.API_URL.replace(/\/$/, '')}/rest/v1/${t}${q}`; },
  _get(t) { try { return JSON.parse(localStorage.getItem('rd_' + t)) || []; } catch (e) { return []; } },
  _set(t, a) { localStorage.setItem('rd_' + t, JSON.stringify(a)); },
  _newest(a) { return a.slice().sort((x, y) => String(y.created_at || '').localeCompare(String(x.created_at || ''))); },
  async list(t) {
    if (this.remote()) {
      const r = await fetch(this._url(t, '?select=*'), { headers: await this._h() });
      if (!r.ok) throw new Error(await r.text());
      return this._newest(await r.json());
    }
    const v = VIEWS[t];
    if (v) return this._get(v.from).filter(v.where).map(r => Object.fromEntries(v.pick.map(k => [k, r[k]])));
    return this._newest(this._get(t));
  },
  async all(tables) {
    const out = {};
    await Promise.all(tables.map(async t => { try { out[t] = await this.list(t); } catch (e) { console.warn(t, e); out[t] = []; } }));
    return out;
  },
  async add(t, data) {
    const me = Auth.user(), own = me && !['users', 'profiles', 'pengaturan'].includes(t) ? { dibuat_oleh: me.id } : {};
    const row = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)), created_at: new Date().toISOString(), ...data, ...own };
    if (this.remote()) {
      const r = await fetch(this._url(t), { method: 'POST', headers: await this._h(), body: JSON.stringify(row) });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json())[0];
    }
    const a = this._get(t); a.push(row); this._set(t, a); return row;
  },
  async update(t, id, data) {
    if (this.remote()) {
      const r = await fetch(this._url(t, `?id=eq.${encodeURIComponent(id)}`), { method: 'PATCH', headers: await this._h(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json(); if (!j.length) throw new Error('Kamu tidak punya izin mengubah data ini.');
      return j[0];
    }
    const a = this._get(t), i = a.findIndex(x => x.id === id);
    if (i < 0) throw new Error('Data tidak ditemukan');
    a[i] = { ...a[i], ...data }; this._set(t, a); return a[i];
  },
  async remove(t, id) {
    if (this.remote()) {
      const r = await fetch(this._url(t, `?id=eq.${encodeURIComponent(id)}`), { method: 'DELETE', headers: await this._h() });
      if (!r.ok) throw new Error(await r.text());
      if (!(await r.json()).length) throw new Error('Kamu tidak punya izin menghapus data ini.');
      return;
    }
    this._set(t, this._get(t).filter(x => x.id !== id));
  }
};
