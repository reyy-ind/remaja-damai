crudPage('anggota', {
  autoFields: { kode: randKode8 },
  actions: [
    { l: 'Lihat QR', fn: async r => {
        if (!r.kode) { toast('Anggota ini belum punya kode QR. Klik Ubah lalu Simpan untuk membuatkan kode.', 1); return; }
        const url = new URL('jimpitan.html?anggota=' + encodeURIComponent(r.kode), location.href).href;
        const m = modal(`<h3>Kartu QR — ${esc(r.nama)}</h3><div id="qrbox" style="display:flex;justify-content:center;padding:12px;background:#fff;border-radius:12px"></div><p class="sm" style="margin-top:14px">Kode manual: <b style="letter-spacing:.06em">${esc(r.kode)}</b></p><div style="text-align:right;margin-top:14px"><button type="button" class="btn" id="tutup">Tutup</button></div>`);
        $('#tutup', m).onclick = () => m.remove();
        if (window.QRCode) new QRCode($('#qrbox', m), { text: url, width: 220, height: 220 });
        else $('#qrbox', m).innerHTML = '<p class="muted sm">Pembuat QR gagal dimuat.</p>';
      } }
  ]
});
