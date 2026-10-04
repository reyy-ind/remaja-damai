(async () => {
  const d = await DB.all(['transaksi']), all = d.transaksi, pub = all.filter(t => t.publik !== false).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  let f = 'Semua';
  await Public.shell(`<section><div class="wrap"><div class="sh"><h2>Transparansi kas</h2><button class="btn noprint" onclick="print()">Cetak</button></div>
    <div class="grid g4"><div class="card stat"><b>${rp(Pub.saldo(all))}</b><span>Saldo kas</span></div><div class="card stat"><b class="in">${rp(sum(all.filter(t => t.jenis === 'Pemasukan'), t => t.jumlah))}</b><span>Total pemasukan</span></div><div class="card stat"><b class="out">${rp(sum(all.filter(t => t.jenis === 'Pengeluaran'), t => t.jumlah))}</b><span>Total pengeluaran</span></div><div class="card stat"><b>${pub.length}</b><span>Transaksi publik</span></div></div>
    <div class="card" style="margin-top:16px"><b>Pemasukan vs pengeluaran</b><p class="muted sm" style="margin-bottom:10px">6 bulan terakhir</p>${chartBlock(all)}</div>
    <div class="sh" style="margin-top:36px"><h2 style="font-size:24px">Transaksi publik</h2></div>
    <div class="chips" id="chips">${['Semua', 'Pemasukan', 'Pengeluaran'].map(c => `<button class="chip ${c === f ? 'on' : ''}" data-f="${c}">${c}</button>`).join('')}</div><div class="card" id="list"></div></div></section>`);
  const draw = () => { const l = pub.filter(t => f === 'Semua' || t.jenis === f); $('#list').innerHTML = l.length ? l.map(Pub.txRow).join('') : Pub.empty('Belum ada transaksi publik.'); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); draw(); };
  draw();
})();
