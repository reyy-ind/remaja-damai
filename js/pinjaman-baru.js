(async () => {
  if (!Auth.isSuper()) { location.replace('pinjaman.html'); return; }
  const S = SCHEMA.pinjaman, fields = S.fields.filter(f => f.k !== 'status');
  await Admin.shell('Pinjaman baru', '<a class="btn" href="pinjaman.html">Kembali</a>', '<div class="card" style="max-width:640px"><div class="muted">Memuat…</div></div>');
  const d = await DB.all(['inventaris', 'pinjaman_aktif']);
  const tersedia = n => { const i = d.inventaris.find(x => x.nama === n); return i ? i.total - sum(d.pinjaman_aktif.filter(p => p.barang === n), p => p.jumlah) : null; };
  $('#content').innerHTML = `<div class="card" style="max-width:640px"><form id="frm"><div class="fgrid">${Form.build(fields, { tgl_pinjam: today() }, d)}</div><p class="muted sm" id="info"></p><div class="err" id="err"></div><button class="btn pri">Simpan pinjaman</button></form></div>`;
  $('#f_barang').oninput = e => { const t = tersedia(e.target.value); $('#info').textContent = t === null ? '' : `Stok tersedia: ${t}`; };
  $('#frm').onsubmit = async e => {
    e.preventDefault();
    const x = await Form.read(fields), miss = Form.missing(fields, x);
    if (miss) return $('#err').textContent = miss;
    const t = tersedia(x.barang);
    if (t !== null && x.jumlah > t) return $('#err').textContent = `Stok ${x.barang} hanya tersisa ${t}.`;
    try { await DB.add('pinjaman', { ...x, status: 'Dipinjam' }); location.href = 'pinjaman.html'; } catch (er) { $('#err').textContent = 'Gagal menyimpan: ' + er.message; }
  };
})();
