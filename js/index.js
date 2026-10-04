(async () => {
  const s = await Settings.get();
  const d = await DB.all(['anggota_publik', 'kegiatan', 'transaksi', 'inventaris', 'pinjaman_aktif', 'achievement', 'dokumentasi']);
  const yr = String(new Date().getFullYear());
  const kg = Pub.publikKg(d.kegiatan), kgTahun = kg.filter(k => String(k.tanggal || '').startsWith(yr));
  const ev = kgTahun.filter(k => k.jenis === 'Event');
  const totalInv = sum(d.inventaris, i => i.total);
  const pinjam = a => sum(d.pinjaman_aktif.filter(p => p.barang === a.nama), p => p.jumlah);
  const mendatang = kg.filter(k => k.tanggal >= today() && k.status !== 'Batal').sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);
  const trxPub = d.transaksi.filter(t => t.publik !== false);
  const galeri = d.dokumentasi.filter(g => g.publik === true && g.link).slice(0, 6);
  const nilai = [['Kebersamaan', 'Nongkrong yang ada hasilnya. Semua anggota punya tempat dan peran.'], ['Gotong royong', 'Kerja bakti, bakti sosial, dan bantu tetangga yang punya hajatan.'], ['Kreativitas', 'Dari pentas seni sampai pelatihan untuk warga dan UMKM sekitar.'], ['Peduli lingkungan', 'Bank sampah, tanam pohon, dan selokan bersih sebelum musim hujan.']];
  const tentang = s.tentang || `${s.nama} adalah wadah generasi muda yang bergerak bersama untuk kegiatan sosial, kreativitas, dan kepedulian lingkungan.\n\nBasecamp digital ini dibuat supaya semua kegiatan tercatat rapi: siapa pegang apa, uang kas dipakai untuk apa, barang inventaris sedang dipinjam siapa, dan foto kegiatan tidak hilang di grup chat.`;
  await Public.shell(`
  <section class="hero"><div class="wrap"><div>
    <span class="tag">${esc(s.alamat || s.nama)}</span>
    <h1>Bangun Kegiatan. Kelola Kas. Gerakkan Pemuda.</h1>
    <p class="lead">Basecamp digital ${esc(s.nama)} untuk mengelola kegiatan, event, kas, inventaris, dan cerita komunitas dalam satu tempat.</p>
    <div class="cta"><a class="btn pri" href="kegiatan.html">Lihat Kegiatan</a><a class="btn" href="login.html">Masuk Basecamp</a></div></div>
    <div class="heroimg"><img src="${CONFIG.HERO_IMAGE}" alt="Ilustrasi basecamp ${esc(s.nama)}" onerror="this.style.display='none'"><span class="cap">BASECAMP ${esc(s.singkatan)}</span></div></div></section>

  <section id="tentang"><div class="wrap"><div class="about"><div><div class="sh"><h2>${esc(s.nama)}</h2></div>${tentang.split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="grid g2">${nilai.map(n => `<div class="card val"><h3>${n[0]}</h3><p>${n[1]}</p></div>`).join('')}</div></div></div></section>

  <section><div class="wrap"><div class="sh"><h2>Data langsung dari basecamp</h2></div><div class="grid g4">
    <div class="card stat"><b>${d.anggota_publik.length}</b><span>Anggota aktif</span></div>
    <div class="card stat"><b>${kgTahun.length}</b><span>Kegiatan tahun ini · ${kgTahun.filter(k => k.status === 'Terlaksana').length} terlaksana</span></div>
    <div class="card stat"><b>${totalInv}</b><span>Unit inventaris · ${d.inventaris.length} jenis barang</span></div>
    <div class="card stat"><b>${ev.length}</b><span>Event tahun ini · ${ev.filter(k => k.status === 'Persiapan').length} sedang disiapkan</span></div></div></div></section>

  <section><div class="wrap"><div class="sh"><h2>Kas terbuka untuk semua</h2><a class="btn" href="transparansi.html">Laporan lengkap</a></div><div class="kas">
    <div class="card"><span class="muted sm">Saldo kas per ${tgl(today())}</span><div class="saldo">${rp(Pub.saldo(d.transaksi))}</div>
      <div class="grid g2" style="margin-top:18px"><div><span class="muted sm">Pemasukan bulan ini</span><br><b class="in">${rp(Pub.bulanIni(d.transaksi, 'Pemasukan'))}</b></div><div><span class="muted sm">Pengeluaran bulan ini</span><br><b class="out">${rp(Pub.bulanIni(d.transaksi, 'Pengeluaran'))}</b></div></div>
      <div style="margin-top:22px"><b>Transaksi publik terbaru</b>${trxPub.length ? trxPub.slice(0, 5).map(Pub.txRow).join('') : Pub.empty('Belum ada transaksi yang dipublikasikan.')}</div></div>
    <div class="card"><b>Pemasukan vs pengeluaran</b><p class="muted sm" style="margin-bottom:10px">6 bulan terakhir</p>${chartBlock(d.transaksi)}</div></div></div></section>

  <section><div class="wrap"><div class="sh"><h2>Kegiatan mendatang</h2><a class="btn" href="kegiatan.html">Semua kegiatan</a></div>
    ${mendatang.length ? `<div class="grid g3">${mendatang.map(Pub.kgCard).join('')}</div>` : Pub.empty('Belum ada kegiatan mendatang. Pengurus bisa menambahkannya lewat panel admin.')}</div></section>

  <section><div class="wrap"><div class="sh"><h2>Inventaris basecamp</h2></div>
    ${d.inventaris.length ? `<div class="grid g4">${d.inventaris.slice(0, 8).map(i => `<div class="card"><b>${esc(i.nama)}</b><br><span class="muted sm">${esc(i.kategori || '')}</span><div style="margin-top:8px">${Math.max(0, i.total - pinjam(i))}/${i.total} tersedia</div></div>`).join('')}</div>` : Pub.empty('Belum ada data inventaris.')}</div></section>

  <section><div class="wrap"><div class="sh"><h2>Pencapaian bersama, bukan ranking orang</h2></div>
    ${d.achievement.length ? `<div class="grid g3">${d.achievement.map(a => { const pct = a.target ? Math.min(100, Math.round(a.progress / a.target * 100)) : 0; return `<div class="card">${statusBadge(a.tingkat || 'Perunggu')}<h3 style="margin:8px 0 2px;font-size:16px">${esc(a.judul)}</h3><p class="muted sm">${esc(a.deskripsi || '')}</p><div class="bar"><i style="width:${pct}%"></i></div><span class="muted sm">${a.progress || 0}/${a.target || 0}</span></div>`; }).join('')}</div>` : Pub.empty('Belum ada achievement.')}</div></section>

  <section><div class="wrap"><div class="sh"><h2>Dokumentasi</h2><a class="btn" href="dokumentasi.html">Buka semua dokumentasi</a></div>
    ${galeri.length ? Pub.driveList(galeri) : Pub.empty('Belum ada dokumentasi yang dipublikasikan. Link Google Drive akan tampil di sini setelah dipilih pengurus untuk publik.')}</div></section>

  <section><div class="wrap"><div class="card cta-box"><h2>Punya ide kegiatan atau mau ikut gabung?</h2><p class="muted">Mampir ke sekretariat ${esc(s.nama)} atau hubungi pengurus. Pengurus dan anggota bisa langsung masuk ke basecamp.</p><div class="cta"><a class="btn pri" href="login.html">Masuk Basecamp</a><a class="btn" href="kegiatan.html">Lihat Kegiatan</a></div></div></div></section>`);
})();
