/* Potongan tampilan yang dipakai halaman publik */
const Pub = {
  saldo: trx => sum(trx, t => t.jenis === 'Pemasukan' ? t.jumlah : -t.jumlah),
  bulanIni(trx, jenis) { const k = today().slice(0, 7); return sum(trx.filter(t => t.jenis === jenis && String(t.tanggal || '').startsWith(k)), t => t.jumlah); },
  publikKg: a => a.filter(k => k.publik !== false),
  kgCard(k) {
    const d = k.tanggal ? new Date(k.tanggal) : null;
    return `<a class="card kg" href="kegiatan-detail.html?id=${encodeURIComponent(k.id)}">
      <div class="date"><b>${d ? d.getDate() : '-'}</b><span>${d ? d.toLocaleDateString('id-ID', { month: 'short' }) : ''}</span></div>
      <div style="flex:1;min-width:0"><div style="display:flex;gap:6px;margin-bottom:6px">${statusBadge(k.status || 'Persiapan')}<span class="badge">${esc(k.jenis || 'Kegiatan')}</span></div>
      <h3>${esc(k.judul)}</h3>
      <p class="muted sm">${[k.waktu, k.lokasi].filter(Boolean).map(esc).join(' · ')}${k.target ? ` · Target ${k.target} peserta` : ''}</p>
      ${k.progress ? `<div class="bar" aria-label="Progres ${k.progress}%"><i style="width:${Math.min(100, k.progress)}%"></i></div>` : ''}</div></a>`;
  },
  txRow: t => `<div class="tx"><div><b>${esc(t.keterangan)}</b><span class="muted sm">${tgl(t.tanggal)}${t.kategori ? ' · ' + esc(t.kategori) : ''}${t.kegiatan_terkait ? ' · ' + esc(t.kegiatan_terkait) : ''}</span></div><b class="${t.jenis === 'Pemasukan' ? 'in' : 'out'}" style="white-space:nowrap">${t.jenis === 'Pemasukan' ? '+' : '−'}${rp(t.jumlah)}</b></div>`,
  driveCard: g => `<a class="card drv" href="${esc(g.link)}" target="_blank" rel="noopener noreferrer">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="drv-ic">${icon('file')}</div>
      <div style="flex:1;min-width:0"><h3 style="font-size:15px;line-height:1.3">${esc(g.judul)}</h3>
      <p class="muted sm">${tgl(g.tanggal)}${g.kegiatan ? ' · ' + esc(g.kegiatan) : ''}</p></div>
    </div>
    <span class="badge ok" style="margin-top:12px">Buka di Google Drive →</span></a>`,
  driveList: items => `<div class="grid g3">${items.map(Pub.driveCard).join('')}</div>`,
  empty: msg => `<div class="empty">${msg}</div>`
};
