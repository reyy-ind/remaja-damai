(async () => {
  const kg = Pub.publikKg((await DB.all(['kegiatan'])).kegiatan).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  let f = 'Semua';
  await Public.shell(`<section><div class="wrap"><div class="sh"><h2>Kegiatan & Event</h2></div><div class="chips" id="chips">${['Semua', 'Kegiatan', 'Event', 'Persiapan', 'Siap', 'Terlaksana'].map(c => `<button class="chip ${c === f ? 'on' : ''}" data-f="${c}">${c}</button>`).join('')}</div><div id="list"></div></div></section>`);
  const draw = () => {
    const l = kg.filter(k => f === 'Semua' || k.jenis === f || k.status === f);
    $('#list').innerHTML = l.length ? `<div class="grid g3">${l.map(Pub.kgCard).join('')}</div>` : Pub.empty('Belum ada kegiatan untuk filter ini.');
  };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); draw(); };
  draw();
})();
