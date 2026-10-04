(async () => {
  await Admin.shell('Dashboard', '', '<div class="muted">Memuat…</div>');
  const role = Auth.role(), me = Auth.user(), s = await Settings.get();
  const st = (b, l, h) => `<a class="card stat" href="${h}"><b>${b}</b><span>${l}</span></a>`;

  if (role === 'Super Admin') {
    const d = await DB.all(['anggota', 'kegiatan', 'transaksi', 'pinjaman', 'iuran']);
    const aktif = d.kegiatan.filter(k => ['Persiapan', 'Siap'].includes(k.status)), mendatang = aktif.filter(k => k.tanggal >= today()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 4);
    const belum = d.iuran.filter(i => i.status === 'Belum');
    $('#content').innerHTML = `<p class="muted" style="margin-bottom:16px">Selamat datang, ${esc(me.nama || me.username)}. Ringkasan ${esc(s.nama)}.</p>
    <div class="grid g4">${st(rp(Pub.saldo(d.transaksi)), 'Saldo kas', 'keuangan.html')}${st(d.anggota.filter(a => a.status !== 'Nonaktif').length, 'Anggota aktif', 'anggota.html')}${st(aktif.length, 'Kegiatan & event aktif', 'event.html')}${st(d.pinjaman.filter(p => p.status === 'Dipinjam').length, 'Pinjaman berjalan', 'pinjaman.html')}</div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><b>Pemasukan vs pengeluaran</b><p class="muted sm" style="margin-bottom:10px">6 bulan terakhir</p>${chartBlock(d.transaksi)}</div>
    <div class="card"><b>Transaksi terbaru</b>${d.transaksi.length ? d.transaksi.slice(0, 5).map(Pub.txRow).join('') : Pub.empty('Belum ada transaksi. Tambahkan lewat menu Keuangan.')}</div></div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><b>Kegiatan mendatang</b>${mendatang.length ? mendatang.map(k => `<div class="tx"><div><b>${esc(k.judul)}</b><span class="muted sm">${tgl(k.tanggal)} · ${esc(k.lokasi || '')}</span></div>${statusBadge(k.status)}</div>`).join('') : Pub.empty('Belum ada kegiatan mendatang.')}</div>
    <div class="card"><b>Iuran belum lunas</b><div class="stat" style="margin-top:8px"><b>${belum.length}</b><span>${rp(sum(belum, i => i.jumlah))} belum masuk</span></div><p style="margin-top:12px"><a class="btn xs" href="iuran.html">Kelola iuran</a></p><p style="margin-top:8px"><a class="btn xs pri" href="jimpitan.html">Buka Jimpitan</a></p></div></div>`;

  } else if (role === 'Admin') {
    const d = await DB.all(['inventaris']);
    $('#content').innerHTML = `<p class="muted" style="margin-bottom:16px">Selamat datang, ${esc(me.nama || me.username)}. Akunmu adalah <b>Admin</b> — kamu bisa mengelola Inventaris, Dokumentasi, dan melihat Laporan.</p>
    <div class="grid g3">${st(d.inventaris.length, 'Jenis barang inventaris', 'inventaris.html')}${st('—', 'Kelola Dokumentasi', 'dokumentasi-admin.html')}${st('—', 'Lihat Laporan', 'laporan.html')}</div>`;

  } else {
    const d = await DB.all(['kegiatan', 'transaksi', 'pinjaman', 'iuran', 'notifikasi', 'anggota']);
    const aktif = d.kegiatan.filter(k => ['Persiapan', 'Siap'].includes(k.status)), mendatang = aktif.filter(k => k.tanggal >= today()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 4);
    const pin = d.pinjaman.filter(p => p.peminjam === (me.nama || me.username));
    const iu = d.iuran.filter(i => i.anggota === (me.nama || me.username));
    const belum = iu.filter(i => i.status === 'Belum');
    const mine = d.anggota.find(a => a.id === me.id);
    const nf = (d.notifikasi || []).slice(0, 3);
    $('#content').innerHTML = `<p class="muted" style="margin-bottom:16px">Halo, ${esc(me.nama || me.username)}. Kamu bisa melihat data organisasi dan menunjukkan QR pribadimu saat kumpul.</p>
    <div class="grid g4">${st(rp(Pub.saldo(d.transaksi)), 'Saldo kas', 'keuangan.html')}${st(aktif.length, 'Kegiatan & event aktif', 'event.html')}${st(pin.filter(p => p.status === 'Dipinjam').length, 'Pinjaman saya berjalan', 'pinjaman.html')}${st(belum.length, 'Iuran saya belum lunas', 'iuran.html')}</div>
    <div class="grid g2" style="margin-top:16px">
    <div class="card"><b>QR Kartu Anggota Saya</b><p class="muted sm" style="margin:6px 0 12px">Tunjukkan ini ke pengurus saat kumpul untuk discan (absen & jimpitan).</p>
      ${mine && mine.kode ? `<div id="qrbox" style="display:flex;justify-content:center;background:#fff;border-radius:12px;padding:14px"></div><p class="sm" style="margin-top:10px;text-align:center">Kode manual: <b style="letter-spacing:.06em">${esc(mine.kode)}</b></p>` : Pub.empty('Kode QR belum tersedia untuk akunmu. Hubungi pengurus.')}</div>
    <div class="card"><b>Kegiatan mendatang</b>${mendatang.length ? mendatang.map(k => `<div class="tx"><div><b>${esc(k.judul)}</b><span class="muted sm">${tgl(k.tanggal)} · ${esc(k.lokasi || '')}</span></div>${statusBadge(k.status)}</div>`).join('') : Pub.empty('Belum ada kegiatan mendatang.')}</div></div>
    <div class="card" style="margin-top:16px"><b>Pengumuman</b>${nf.length ? nf.map(n => `<div class="tx"><div><b>${esc(n.judul)}</b><span class="muted sm">${esc(n.pesan || '')}</span></div>${statusBadge(n.tipe || 'Info')}</div>`).join('') : Pub.empty('Belum ada pengumuman.')}</div>`;
    if (mine && mine.kode && window.QRCode) new QRCode($('#qrbox'), { text: new URL('jimpitan.html?anggota=' + mine.kode, location.href).href, width: 180, height: 180 });
  }
})();
