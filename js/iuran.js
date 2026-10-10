(async () => {
  await Admin.shell('Tabungan & Kas', '', '<div class="muted">Memuat…</div>');
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const thn = new Date().getFullYear();
  let d = await DB.all(['anggota', 'jimpitan', 'pengaturan']);
  const s = (d.pengaturan || [])[0] || {};
  const jpTahun = d.jimpitan.filter(j => new Date(j.created_at).getFullYear() === thn);
  const anggota = d.anggota.slice().sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

  const sudahBulan = (nama, bulanIdx) => jpTahun.some(j => j.anggota_nama === nama && new Date(j.created_at).getMonth() === bulanIdx);

  function render() {
    const q = ($('#q') ? $('#q').value : '').toLowerCase();
    const list = anggota.filter(a => !q || (a.nama || '').toLowerCase().includes(q));
    $('#content').innerHTML = `
      <div class="grid g3" style="margin-bottom:16px">
        <div class="card stat"><b>${rp(sum(jpTahun, j => j.kas))}</b><span>Total Kas ${thn}</span></div>
        <div class="card stat"><b>${rp(sum(jpTahun, j => j.tabungan))}</b><span>Total Tabungan ${thn}</span></div>
        <div class="card">${s.qris ? `<div style="display:flex;gap:12px;align-items:center"><img src="${esc(s.qris)}" alt="QRIS" style="width:56px;height:56px;object-fit:contain;border-radius:8px;background:#fff;padding:4px"><div><b>QRIS tersedia</b><p class="muted sm">Scan untuk bayar</p></div></div>` : '<span class="muted sm">QRIS belum diatur admin (menu Pengaturan)</span>'}</div>
      </div>
      ${s.qris ? `<div class="card" style="margin-bottom:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap"><img src="${esc(s.qris)}" alt="QRIS" style="width:160px;height:160px;object-fit:contain;border-radius:12px;background:#fff;padding:10px"><div><b>Bayar Kas / Tabungan via QRIS</b><p class="muted sm" style="margin-top:4px;max-width:420px">Scan dari aplikasi pembayaran apa saja yang mendukung QRIS, lalu konfirmasi ke pengurus. Pencatatan resmi tetap lewat scan QR anggota di menu Jimpitan saat kumpul.</p></div></div>` : ''}
      <p class="muted sm" style="margin-bottom:10px">Rekap kehadiran jimpitan tahun <b>${thn}</b> — bercentang (✓) berarti anggota itu jimpitan (kas dan/atau tabungan) pada bulan tersebut. Klik nama untuk lihat riwayat lengkapnya. Rekap tahun lalu otomatis tidak ditampilkan lagi setelah tahun berganti.</p>
      <div class="tools"><input type="search" id="q" placeholder="Cari nama anggota…" aria-label="Cari" value="${esc(q)}"></div>
      <div id="tbl"></div>`;
    $('#q').oninput = render;
    $('#tbl').innerHTML = !list.length ? Pub.empty(anggota.length ? 'Tidak ada hasil yang cocok.' : 'Belum ada anggota.') : `<div class="tw"><table><thead><tr><th>Anggota</th>${BULAN.map(b => `<th style="text-align:center">${b}</th>`).join('')}</tr></thead><tbody>${list.map(a => `<tr><td><button type="button" class="btn xs" data-riwayat="${esc(a.id)}" style="white-space:normal;text-align:left">${esc(a.nama)}</button></td>${BULAN.map((b, i) => `<td style="text-align:center">${sudahBulan(a.nama, i) ? '✓' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    $$('[data-riwayat]').forEach(btn => btn.onclick = () => riwayat(anggota.find(a => a.id === btn.dataset.riwayat)));
  }

  function riwayat(a) {
    const milik = d.jimpitan.filter(j => j.anggota_nama === a.nama).sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    const m = modal(`<h3>Riwayat Tabungan & Kas — ${esc(a.nama)}</h3>
      ${milik.length ? `<p class="muted sm" style="margin-bottom:10px">Terakhir jimpitan: ${tgl(milik[0].created_at)}. Total sepanjang waktu: Kas ${rp(sum(milik, j => j.kas))} · Tabungan ${rp(sum(milik, j => j.tabungan))}.</p>
      <div class="tw"><table><thead><tr><th>Tanggal</th><th>Rapat</th><th>Kas</th><th>Tabungan</th></tr></thead><tbody>${milik.map(j => `<tr><td>${tgl(j.created_at)}</td><td>${esc(j.rapat_judul || '-')}</td><td>${rp(j.kas)}</td><td>${rp(j.tabungan)}</td></tr>`).join('')}</tbody></table></div>`
        : Pub.empty('Belum pernah jimpitan.')}
      <div style="text-align:right;margin-top:14px"><button type="button" class="btn" id="tutup">Tutup</button></div>`);
    $('#tutup', m).onclick = () => m.remove();
  }

  render();
})();
