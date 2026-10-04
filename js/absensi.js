(async () => {
  if (!Auth.isSuper()) { location.replace('dashboard.html'); return; }
  await Admin.shell('Absensi (lama)', '', '<div class="muted">Memuat…</div>');
  $('#content').innerHTML = `<div class="grid g2" style="align-items:start">
      <div class="card"><h3 style="margin-bottom:14px">Tambah lokasi</h3>
        <form id="fl"><div class="f"><label for="ln">Nama rumah / lokasi</label><input id="ln" required></div>
        <div class="f"><label for="la">Alamat (opsional)</label><input id="la"></div>
        <div class="f"><label for="lk">Kegiatan terkait (opsional)</label><input id="lk" list="dlk" autocomplete="off"><datalist id="dlk"></datalist></div>
        <div class="err" id="ferr"></div><button class="btn pri">Buat lokasi & kode QR</button></form></div>
      <div class="card"><b>Fitur ini sudah digantikan</b><p class="muted sm" style="margin-top:8px">Pencatatan kehadiran dan jimpitan sekarang dilakukan lewat menu <b>Jimpitan</b> — admin men-scan QR pribadi tiap anggota saat kumpul. Halaman ini dipertahankan sebagai arsip lokasi lama saja.</p>
      <p style="margin-top:12px"><a class="btn pri xs" href="jimpitan.html">Buka menu Jimpitan</a></p></div>
    </div>
    <div class="sh" style="margin-top:24px"><h2 style="font-size:22px">Lokasi tersimpan</h2></div><div id="lokList"></div>
    <div class="sh" style="margin-top:28px"><h2 style="font-size:22px">Log kehadiran lama</h2></div>
    <div class="tools"><input type="search" id="q" placeholder="Cari nama atau lokasi…" aria-label="Cari"></div><div id="logList"></div>`;
  let loks = [], logs = [];
  async function loadAdmin() {
    const kg = await DB.list('kegiatan').catch(() => []);
    $('#dlk').innerHTML = [...new Set(kg.map(k => k.judul))].map(j => `<option value="${esc(j)}">`).join('');
    loks = await DB.list('lokasi_absen'); logs = await DB.list('absensi');
    drawLok(); drawLog();
  }
  function drawLok() {
    $('#lokList').innerHTML = loks.length ? `<div class="grid g3">${loks.map(l => `<div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(l.nama)}</b>${l.aktif === false ? '<span class="badge">Nonaktif</span>' : '<span class="badge ok">Aktif</span>'}</div>
        <p class="muted sm">${[l.alamat, l.kegiatan].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</p>
        <p class="sm" style="margin-top:6px">Kode: <b style="letter-spacing:.06em">${esc(l.kode)}</b></p>
        <div class="acts" style="justify-content:flex-start;flex-wrap:wrap;margin-top:10px">
          <button class="btn xs" data-qr="${l.id}">Lihat QR</button>
          <button class="btn xs" data-regen="${l.id}">Perbarui kode</button>
          <button class="btn xs" data-toggle="${l.id}">${l.aktif === false ? 'Aktifkan' : 'Nonaktifkan'}</button>
          <button class="btn xs dn" data-hapus="${l.id}">Hapus</button>
        </div></div>`).join('')}</div>` : Pub.empty('Belum ada lokasi absen. Tambahkan lewat form di atas.');
  }
  function drawLog() {
    const q = ($('#q').value || '').toLowerCase();
    const list = logs.filter(a => !q || `${a.nama} ${a.lokasi_nama}`.toLowerCase().includes(q)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    $('#logList').innerHTML = list.length ? `<div class="tw"><table><thead><tr><th>Anggota</th><th>Lokasi</th><th>Waktu</th><th></th></tr></thead><tbody>${list.map(a => `<tr><td>${esc(a.nama)}</td><td>${esc(a.lokasi_nama)}</td><td>${new Date(a.created_at).toLocaleString('id-ID')}</td><td><button class="btn xs dn" data-delog="${a.id}">Hapus</button></td></tr>`).join('')}</tbody></table></div>` : Pub.empty('Belum ada catatan kehadiran lama.');
  }
  $('#fl').onsubmit = async e => {
    e.preventDefault();
    try { await DB.add('lokasi_absen', { nama: $('#ln').value.trim(), alamat: $('#la').value.trim(), kegiatan: $('#lk').value.trim(), kode: randKode8(), aktif: true }); e.target.reset(); toast('Lokasi & kode QR dibuat'); loadAdmin(); }
    catch (er) { $('#ferr').textContent = er.message; }
  };
  $('#q').oninput = drawLog;
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.qr) {
      const l = loks.find(x => x.id === b.dataset.qr), url = new URL('absensi.html?kode=' + l.kode, location.href).href;
      const m = modal(`<h3>QR — ${esc(l.nama)}</h3><div id="qrbox" style="display:flex;justify-content:center;padding:12px;background:#fff;border-radius:12px"></div><p class="sm" style="margin-top:14px">Kode manual: <b style="letter-spacing:.06em">${esc(l.kode)}</b></p><div style="text-align:right;margin-top:14px"><button type="button" class="btn" id="tutup">Tutup</button></div>`);
      $('#tutup', m).onclick = () => m.remove();
      if (window.QRCode) new QRCode($('#qrbox', m), { text: url, width: 220, height: 220 });
      else $('#qrbox', m).innerHTML = `<p class="muted sm">Pembuat QR gagal dimuat.</p>`;
    } else if (b.dataset.regen) {
      if (!confirm('QR lama akan langsung tidak berlaku. Lanjutkan?')) return;
      try { await DB.update('lokasi_absen', b.dataset.regen, { kode: randKode8() }); toast('Kode diperbarui'); loadAdmin(); } catch (er) { toast(er.message, 1); }
    } else if (b.dataset.toggle) {
      const l = loks.find(x => x.id === b.dataset.toggle);
      try { await DB.update('lokasi_absen', l.id, { aktif: l.aktif === false }); loadAdmin(); } catch (er) { toast(er.message, 1); }
    } else if (b.dataset.hapus) {
      if (!confirm('Hapus lokasi ini?')) return;
      try { await DB.remove('lokasi_absen', b.dataset.hapus); toast('Lokasi dihapus'); loadAdmin(); } catch (er) { toast(er.message, 1); }
    } else if (b.dataset.delog) {
      if (!confirm('Hapus catatan kehadiran ini?')) return;
      try { await DB.remove('absensi', b.dataset.delog); toast('Catatan dihapus'); loadAdmin(); } catch (er) { toast(er.message, 1); }
    }
  });
  loadAdmin();
})();
