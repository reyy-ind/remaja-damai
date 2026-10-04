crudPage('iuran', {
  load: ['pengaturan'],
  summary: (rows, ctx) => {
    const s = (ctx.pengaturan || [])[0] || {};
    const belum = rows.filter(r => r.status === 'Belum'), lunas = rows.filter(r => r.status === 'Lunas');
    return `<div class="grid g3" style="margin-bottom:16px">
      <div class="card stat"><b>${lunas.length}</b><span>Lunas · ${rp(sum(lunas, r => r.jumlah))}</span></div>
      <div class="card stat"><b>${belum.length}</b><span>Belum lunas · ${rp(sum(belum, r => r.jumlah))}</span></div>
      <div class="card">${s.qris ? `<div style="display:flex;gap:12px;align-items:center"><img src="${esc(s.qris)}" alt="QRIS iuran" style="width:64px;height:64px;object-fit:contain;border-radius:8px;background:#fff;padding:4px"><div><b>QRIS tersedia</b><p class="muted sm">Scan untuk bayar iuran</p></div></div>` : '<span class="muted sm">QRIS belum diatur admin (menu Pengaturan)</span>'}</div>
    </div>
    ${s.qris ? `<div class="card" style="margin-bottom:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap"><img src="${esc(s.qris)}" alt="QRIS pembayaran iuran" style="width:180px;height:180px;object-fit:contain;border-radius:12px;background:#fff;padding:10px"><div><b>Bayar iuran via QRIS</b><p class="muted sm" style="margin-top:4px;max-width:420px">Scan kode ini dari aplikasi pembayaran (m-banking/e-wallet apa saja yang mendukung QRIS), lalu konfirmasi ke pengurus. Status akan diubah menjadi <b>Lunas</b> oleh admin setelah pembayaran diverifikasi.</p></div></div>` : ''}`;
  }
});
