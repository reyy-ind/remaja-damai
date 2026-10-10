(async () => {
  const anggotaKode = new URLSearchParams(location.search).get('anggota');
  if (!Auth.user()) { if (anggotaKode) localStorage.setItem('rd_return', location.pathname + location.search); location.replace('login.html'); return; }
  if (!Auth.isSuper()) { location.replace('dashboard.html'); return; }
  await Admin.shell('Jimpitan', '', '<div class="muted">Memuat…</div>');

  let rapatList = await DB.list('arsip_rapat');
  let rapatAktifId = localStorage.getItem('rd_rapat_aktif') || '';
  let rapatAktif = rapatList.find(r => r.id === rapatAktifId) || null;
  let logRows = [];
  let qr = null, scanWanted = false;

  async function stopScan(manual = true) {
    if (manual) scanWanted = false;
    if (qr) { try { await qr.stop(); qr.clear(); } catch (e) {} qr = null; }
    const box = $('#scanBox');
    if (box) { box.innerHTML = `<button type="button" class="btn pri" id="mulaiScan">${icon('qr')}Mulai scan kamera</button>`; $('#mulaiScan').onclick = startScan; }
  }
  async function startScan() {
    const box = $('#scanBox'); if (!box) return;
    if (typeof Html5Qrcode === 'undefined') {
      box.innerHTML = '<p class="muted sm">Pemindai QR gagal dimuat (cek koneksi internet, lalu muat ulang halaman). Sementara pakai pencarian manual.</p>';
      return;
    }
    scanWanted = true;
    box.innerHTML = `<div id="qrReader" style="width:100%;max-width:360px"></div><button type="button" class="btn xs" id="stopScan" style="margin-top:10px">Hentikan kamera</button>`;
    $('#stopScan').onclick = () => stopScan(true);
    try {
      qr = new Html5Qrcode('qrReader');
      await qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } },
        async teks => { await stopScan(false); prosesKode(ekstrakKode(teks)); }, () => {});
    } catch (er) {
      scanWanted = false; qr = null;
      const pesan = !window.isSecureContext ? 'kamera hanya jalan lewat HTTPS atau localhost (bukan http://alamat-IP)' : ((er && er.message) || String(er));
      box.innerHTML = `<p class="muted sm">Tidak bisa membuka kamera: ${esc(pesan)}. Cek izin kamera di browser, atau pakai pencarian manual.</p><button type="button" class="btn xs" id="coba">Coba lagi</button>`;
      $('#coba').onclick = startScan;
    }
  }
  const lanjutScan = () => { if (scanWanted) startScan(); };
  function ekstrakKode(teks) {
    teks = (teks || '').trim();
    try { const u = new URL(teks); const p = u.searchParams.get('anggota'); if (p) return p; } catch (e) {}
    return teks;
  }
  async function prosesKode(kode) {
    const a = (await DB.list('anggota')).find(x => x.kode === (kode || '').toUpperCase());
    if (!a) { toast('QR tidak dikenali / anggota tidak ditemukan.', 1); lanjutScan(); return; }
    bukaForm(a);
  }

  function render() {
    $('#content').innerHTML = `
      <div class="card" style="margin-bottom:18px"><b>Rapat / kumpul aktif</b>
        ${rapatList.length ? `<div class="f" style="margin-top:10px;max-width:420px"><select id="selRapat">
          <option value="">— Pilih rapat —</option>
          ${rapatList.map(r => `<option value="${r.id}" ${rapatAktif && rapatAktif.id === r.id ? 'selected' : ''}>${esc(r.judul)} · ${tgl(r.tanggal)}</option>`).join('')}
        </select></div><p class="muted sm" style="margin-top:8px">Jimpitan yang dicatat lewat scan QR masuk ke rapat yang dipilih di sini. Pilihan ini tersimpan sampai diganti.</p>`
        : `<p class="muted sm" style="margin-top:8px">Belum ada data di <b>Arsip Rapat</b>. <a class="in" href="arsip-rapat.html">Buat dulu satu rapat</a>, lalu kembali ke sini.</p>`}
      </div>
      <div class="grid g2" style="margin-bottom:18px;align-items:start">
        <div class="card"><b>Scan QR anggota</b><p class="muted sm" style="margin:6px 0 10px">Arahkan kamera ke QR kartu anggota.</p><div id="scanBox"></div></div>
        <div class="card"><b>Cari anggota manual</b>
          <p class="muted sm" style="margin:6px 0 10px">Kalau QR susah dipindai, cari namanya di sini.</p>
          <input id="cari" placeholder="Ketik nama anggota…" autocomplete="off">
          <div id="hasilCari" style="margin-top:10px"></div>
        </div>
      </div>
      <div class="sh"><h2 style="font-size:22px">Sudah tercatat di rapat ini</h2></div>
      <div class="tools"><input type="search" id="q" placeholder="Cari di log…" aria-label="Cari"></div>
      <div id="log"></div>`;
    stopScan(true);
    const sel = $('#selRapat');
    if (sel) sel.onchange = e => {
      rapatAktifId = e.target.value;
      localStorage.setItem('rd_rapat_aktif', rapatAktifId);
      rapatAktif = rapatList.find(r => r.id === rapatAktifId) || null;
      loadLog();
    };
    $('#cari').oninput = async e => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) { $('#hasilCari').innerHTML = ''; return; }
      const semua = await DB.list('anggota');
      const hasil = semua.filter(a => (a.nama || '').toLowerCase().includes(q)).slice(0, 8);
      $('#hasilCari').innerHTML = hasil.length ? hasil.map(a => `<button type="button" class="btn xs" data-pick="${a.id}" style="margin:3px 6px 3px 0">${esc(a.nama)}</button>`).join('') : '<p class="muted sm">Tidak ditemukan.</p>';
      $$('[data-pick]', $('#hasilCari')).forEach(b => b.onclick = () => bukaForm(hasil.find(a => a.id === b.dataset.pick)));
    };
    $('#q').oninput = drawLog;
    loadLog();
  }

  async function loadLog() {
    logRows = rapatAktif ? (await DB.list('jimpitan')).filter(j => j.rapat_id === rapatAktif.id) : [];
    drawLog();
  }
  function drawLog() {
    const qEl = $('#q'); if (!qEl) return;
    const q = qEl.value.toLowerCase();
    const list = logRows.filter(j => !q || (j.anggota_nama || '').toLowerCase().includes(q)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    $('#log').innerHTML = !rapatAktif ? Pub.empty('Pilih rapat aktif dulu di atas.') : (list.length ? `<div class="tw"><table><thead><tr><th>Anggota</th><th>Kas</th><th>Tabungan</th><th>Total</th><th>Waktu</th><th></th></tr></thead><tbody>${list.map(j => `<tr><td>${esc(j.anggota_nama)}</td><td>${rp(j.kas)}</td><td>${rp(j.tabungan)}</td><td><b>${rp(Number(j.kas || 0) + Number(j.tabungan || 0))}</b></td><td>${new Date(j.created_at).toLocaleTimeString('id-ID')}</td><td><button class="btn xs dn" data-hapus="${j.id}">Hapus</button></td></tr>`).join('')}</tbody></table></div>` : Pub.empty('Belum ada yang tercatat di rapat ini.'));
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-hapus]'); if (!b) return;
    if (!confirm('Hapus catatan jimpitan ini? Transaksi kas/tabungan terkait juga ikut dihapus dari Keuangan.')) return;
    try {
      const j = logRows.find(x => x.id === b.dataset.hapus);
      if (j && j.transaksi_ids) { for (const tid of JSON.parse(j.transaksi_ids)) { try { await DB.remove('transaksi', tid); } catch (e2) {} } }
      await DB.remove('jimpitan', b.dataset.hapus);
      toast('Catatan dihapus'); loadLog();
    } catch (er) { toast(er.message, 1); }
  });

  async function bukaForm(a) {
    if (!rapatAktif) { toast('Pilih rapat aktif dulu di atas.', 1); lanjutScan(); return; }
    const sudah = (await DB.list('jimpitan')).filter(j => j.anggota_id === a.id && j.rapat_id === rapatAktif.id);
    const m = modal(`<h3>Jimpitan — ${esc(a.nama)}</h3>
      <p class="muted sm" style="margin-bottom:14px">Rapat: <b>${esc(rapatAktif.judul)}</b> · ${tgl(rapatAktif.tanggal)}</p>
      ${sudah.length ? `<p class="muted sm" style="margin-bottom:10px">Sudah tercatat ${rp(sum(sudah, x => Number(x.kas || 0) + Number(x.tabungan || 0)))} untuk rapat ini. Menyimpan lagi akan menambah catatan baru.</p>` : ''}
      <form id="frm"><div class="fgrid">
        <div class="f"><label for="kas">Kas (Rp)</label><input id="kas" type="number" min="0" step="any" value="0"></div>
        <div class="f"><label for="tab">Tabungan (Rp)</label><input id="tab" type="number" min="0" step="any" value="0"></div>
      </div><p class="sm" style="margin:4px 0 14px">Total: <b id="tot">Rp 0</b></p>
      <div class="err" id="err"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn" id="cancel">Batal</button><button class="btn pri">Selesai & catat hadir</button></div></form>`);
    m.addEventListener('mousedown', ev => { if (ev.target === m) setTimeout(lanjutScan, 0); });
    $('#cancel', m).onclick = () => { m.remove(); lanjutScan(); };
    const upd = () => { $('#tot', m).textContent = rp(Number($('#kas', m).value || 0) + Number($('#tab', m).value || 0)); };
    $('#kas', m).oninput = upd; $('#tab', m).oninput = upd;
    $('#frm', m).onsubmit = async e => {
      e.preventDefault();
      const kas = Number($('#kas', m).value || 0), tab = Number($('#tab', m).value || 0);
      if (kas <= 0 && tab <= 0) { $('#err', m).textContent = 'Isi minimal salah satu: Kas atau Tabungan.'; return; }
      try {
        const tids = [];
        if (kas > 0) { const t = await DB.add('transaksi', { tanggal: today(), jenis: 'Pemasukan', kategori: 'Jimpitan Kas', keterangan: `Jimpitan kas — ${a.nama}`, jumlah: kas, kegiatan_terkait: rapatAktif.judul, publik: true }); tids.push(t.id); }
        if (tab > 0) { const t = await DB.add('transaksi', { tanggal: today(), jenis: 'Pemasukan', kategori: 'Jimpitan Tabungan', keterangan: `Jimpitan tabungan — ${a.nama}`, jumlah: tab, kegiatan_terkait: rapatAktif.judul, publik: true }); tids.push(t.id); }
        await DB.add('jimpitan', { anggota_id: a.id, anggota_nama: a.nama, rapat_id: rapatAktif.id, rapat_judul: rapatAktif.judul, kas, tabungan: tab, transaksi_ids: JSON.stringify(tids) });
        m.remove(); toast(`Jimpitan tercatat: ${a.nama} — ${rp(kas + tab)}`); loadLog(); lanjutScan();
      } catch (er) { $('#err', m).textContent = 'Gagal menyimpan: ' + er.message; }
    };
  }

  render();

  if (anggotaKode) { history.replaceState(null, '', location.pathname); prosesKode(anggotaKode); }
})();
