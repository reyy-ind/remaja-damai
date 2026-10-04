(async () => {
  await Admin.shell('Laporan', '<button class="btn" onclick="print()">Cetak / simpan PDF</button>', `<div class="tools"><input type="month" id="per" value="${today().slice(0, 7)}" style="flex:none"></div><div id="out"></div>`);
  const s = await Settings.get(), d = await DB.all(['transaksi', 'kegiatan', 'iuran', 'pinjaman']);
  const draw = () => {
    const p = $('#per').value, trx = d.transaksi.filter(t => String(t.tanggal || '').startsWith(p));
    const pm = sum(trx.filter(t => t.jenis === 'Pemasukan'), t => t.jumlah), pk = sum(trx.filter(t => t.jenis === 'Pengeluaran'), t => t.jumlah);
    const kat = {}; trx.forEach(t => { const k = (t.kategori || 'Tanpa kategori') + '|' + t.jenis; kat[k] = (kat[k] || 0) + Number(t.jumlah); });
    const kg = d.kegiatan.filter(k => String(k.tanggal || '').startsWith(p)), iu = d.iuran.filter(i => i.periode === p);
    $('#out').innerHTML = `<h2 style="margin-bottom:4px">Laporan ${new Date(p + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2><p class="muted" style="margin-bottom:16px">${esc(s.nama)}</p>
    <div class="grid g4"><div class="card stat"><b class="in">${rp(pm)}</b><span>Pemasukan</span></div><div class="card stat"><b class="out">${rp(pk)}</b><span>Pengeluaran</span></div><div class="card stat"><b>${rp(pm - pk)}</b><span>Selisih bulan ini</span></div><div class="card stat"><b>${rp(Pub.saldo(d.transaksi))}</b><span>Saldo kas keseluruhan</span></div></div>
    <h3 style="margin:24px 0 10px">Rincian per kategori</h3>${Object.keys(kat).length ? `<div class="tw"><table><thead><tr><th>Kategori</th><th>Jenis</th><th class="right">Jumlah</th></tr></thead><tbody>${Object.entries(kat).map(([k, v]) => { const [a, b] = k.split('|'); return `<tr><td>${esc(a)}</td><td>${statusBadge(b)}</td><td class="right">${rp(v)}</td></tr>`; }).join('')}</tbody></table></div>` : Pub.empty('Tidak ada transaksi pada periode ini.')}
    <h3 style="margin:24px 0 10px">Kegiatan bulan ini</h3>${kg.length ? `<div class="tw"><table><thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Status</th></tr></thead><tbody>${kg.map(k => `<tr><td>${esc(k.judul)}</td><td>${tgl(k.tanggal)}</td><td>${statusBadge(k.status)}</td></tr>`).join('')}</tbody></table></div>` : Pub.empty('Tidak ada kegiatan pada periode ini.')}
    <h3 style="margin:24px 0 10px">Iuran</h3><div class="card">${iu.filter(i => i.status === 'Lunas').length} lunas (${rp(sum(iu.filter(i => i.status === 'Lunas'), i => i.jumlah))}) · ${iu.filter(i => i.status === 'Belum').length} belum bayar</div>`;
  };
  $('#per').oninput = draw; draw();
})();
