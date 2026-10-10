(async () => {
  const g = (await DB.all(['dokumentasi'])).dokumentasi.filter(x => x.publik === true && x.link).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  const ks = ['Semua', ...new Set(g.map(x => x.kegiatan).filter(Boolean))]; let f = 'Semua';
  await Public.shell(`<section><div class="wrap"><div class="sh"><h2>Dokumentasi kegiatan</h2></div><p class="muted sm" style="margin:-14px 0 18px">Kumpulan link Google Drive dokumentasi kegiatan. Klik untuk membuka.</p><div class="chips" id="chips">${ks.map(c => `<button class="chip ${c === f ? 'on' : ''}" data-f="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="list"></div></div></section>`);
  const draw = () => { const l = g.filter(x => f === 'Semua' || x.kegiatan === f); $('#list').innerHTML = l.length ? Pub.driveList(l) : Pub.empty('Belum ada dokumentasi yang dipublikasikan. Link Google Drive akan tampil di sini setelah dipilih pengurus untuk publik.'); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); draw(); };
  draw();
})();
