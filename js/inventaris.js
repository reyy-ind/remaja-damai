const dipinjam = (r, ctx) => sum((ctx.pinjaman_aktif || []).filter(p => p.barang === r.nama), p => p.jumlah);
crudPage('inventaris', { load: ['pinjaman_aktif'], cols: [{ l: 'Dipinjam', fn: (r, c) => dipinjam(r, c) }, { l: 'Tersedia', fn: (r, c) => `<b>${Math.max(0, r.total - dipinjam(r, c))}</b>` }] });
