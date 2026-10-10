(async () => {
  const id = new URLSearchParams(location.search).get('id');
  const k = Pub.publikKg((await DB.all(['kegiatan'])).kegiatan).find(x => x.id === id);
  if (!k) { await Public.shell(`<section><div class="wrap">${Pub.empty('Kegiatan tidak ditemukan.')}<p style="text-align:center;margin-top:16px"><a class="btn" href="kegiatan.html">Kembali ke daftar</a></p></div></section>`); return; }
  document.title = k.judul;
  const row = (l, v) => v ? `<div><span class="muted sm">${l}</span><br><b>${esc(v)}</b></div>` : '';
  await Public.shell(`<section><div class="wrap" style="max-width:760px"><a class="muted sm" href="kegiatan.html">← Semua kegiatan</a>
    <div style="display:flex;gap:6px;margin:14px 0 8px">${statusBadge(k.status || 'Persiapan')}<span class="badge">${esc(k.jenis || 'Kegiatan')}</span></div>
    <h1 style="font-size:clamp(28px,4vw,40px);line-height:1.15;margin-bottom:20px">${esc(k.judul)}</h1>
    <div class="card grid g2">${row('Tanggal', tgl(k.tanggal))}${row('Jam', k.waktu)}${row('Lokasi', k.lokasi)}${row('Target peserta', k.target ? k.target + ' orang' : '')}${row('Budget', k.budget ? rp(k.budget) : '')}</div>
    ${k.progress ? `<div class="card" style="margin-top:16px"><b>Progres persiapan ${k.progress}%</b><div class="bar"><i style="width:${Math.min(100, k.progress)}%"></i></div></div>` : ''}
    ${k.deskripsi ? `<p style="margin-top:20px;white-space:pre-line" class="muted">${esc(k.deskripsi)}</p>` : ''}</div></section>`);
})();
