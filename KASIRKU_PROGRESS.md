# KasirKu — Catatan Progres & Serah Terima

Dokumen ini dibuat supaya pekerjaan bisa dilanjutkan di chat baru tanpa kehilangan konteks.
Kondisi per **12 Oktober 2026**.

## 1. Gambaran proyek

Aplikasi kasir (POS) full-stack untuk toko kecil.

| Bagian | Teknologi | Repo |
|---|---|---|
| Frontend | Angular (standalone components), Bootstrap + Bootstrap Icons, Angular Material, Chart.js, exceljs/jspdf | `github.com/Procyonoides/kasirku-frontend` |
| Backend | Node.js + Express + MongoDB (Mongoose), auth JWT | `github.com/Procyonoides/kasirku-backend` |

- Dua repo terpisah. Perintah git dijalankan di masing-masing folder.
- Lokasi lokal: `D:\New Z\Angular\kasirku\` (Windows).
- Backend: `npm run dev` (nodemon), port **3000**. Frontend: `ng serve`, port **4200**.
- **MongoDB harus menyala** di `localhost:27017`. Kalau backend crash dengan `ECONNREFUSED ::1:27017`, jalankan
  `Get-Service *mongo*` lalu `net start MongoDB` (PowerShell sebagai Administrator).
- Pengguna memakai Firefox (private browsing). **Kolom tanggal tampil bulan/tanggal/tahun** (mengikuti bahasa browser),
  jadi `09/06/2026` berarti 6 September. Ini bukan bug aplikasi.
- **Dua komputer:** komputer A adalah tempat pengembangan dan **tidak dipakai sebagai kasir**. Komputer B (di rumah)
  adalah yang dipakai sebagai kasir. Karena itu produk dummy di komputer A sengaja **dibiarkan**, tidak dihapus.
  Setelah perubahan di-commit dan di-push, di komputer B perlu `git pull` di kedua repo (dan `npm install` kalau ada paket baru).
  Tidak ada migrasi data yang diperlukan untuk perubahan terbaru (field baru punya nilai bawaan).

## 2. Cara bekerja yang disukai pengguna

- Bahasa: **Indonesia**.
- Pekerjaan coding dipandu **satu langkah per giliran** (jangan scaffold semuanya sekaligus).
- **Format petunjuk edit (diubah 9 Okt 2026):** per file, tunjukkan **bagian yang dicari** ("Cari ..."), lalu **penggantinya**
  ("Ganti dengan ..."), disertai penjelasan singkat apa fungsinya dan hasil yang akan terlihat, supaya pengguna sekalian belajar.
  Sertakan baris di sekitarnya sebagai patokan tempat menempel (jangan `...`). **Seluruh isi file hanya** untuk kasus
  tertentu (perubahan menyebar ke seluruh file) atau kalau pengguna meminta karena sudah pusing.
- Komponen Angular dipisah `.ts` / `.html` / `.css` (jangan template inline).
- Pesan commit: pendek, huruf kecil, bahasa Inggris (contoh: `fix pay debt`, `add debt reminders`).
- Pengguna biasanya `git add .` lalu commit dan push per repo. Pastikan `.env` tidak ikut ter-commit (cek `git status`).
- Pengguna menempel isi file atau screenshot untuk dicek. Tab Network di DevTools (tab Response) berguna untuk
  memastikan backend mengirim data yang diharapkan.
- Pengguna lebih suka usulan yang konkret dengan alasan. Beri pendapat jujur, termasuk kalau idenya punya risiko.
- Kalau pengguna menyerahkan pilihan ("terserah", "ikut"), pilih sendiri dengan alasan singkat lalu kerjakan.

### Catatan untuk asisten (lingkungan sandbox)
- Fetch langsung ke GitHub diblokir (robots). **Clone repo** ke sandbox (`git clone`).
- Di sandbox **tidak ada MongoDB**. Query tidak bisa dijalankan sungguhan. Yang bisa dilakukan:
  `node --check`, `npm ci` lalu `npx ng build --configuration development` (frontend), `npm ci` lalu uji fungsi murni
  (mis. `utils/cashIn.js`) dengan `node -e`, dan uji logika agregasi dengan paket `mingo`.
  Selalu sampaikan bahwa query MongoDB baru teruji setelah pengguna mencobanya.
- Sebelum bekerja, **clone ulang repo terbaru** dan periksa kondisinya. Jangan percaya salinan lama di sandbox.
- Perubahan di sandbox tidak otomatis ada di komputer pengguna. Yang berlaku adalah yang pengguna tempel dan commit.
  Kalau pengguna belum commit, salinan clone tidak memuat perubahan terbarunya.

## 3. Struktur penting

**Backend (`kasirku-backend/src`)**
- `controllers/` transaction, customer, product, category, unit, report, dashboard, finance, setting, backup, auth, user
- `models/` transaction/Transaction.js, customer/{Customer, DebtPayment, PointHistory}.js, finance/Finance.js, product, category, unit, user, setting
- `routes/*.routes.js` (di `product.routes.js`, rute spesifik seperti `/low-stock`, `/top-selling`, `/search` **harus di atas** `/:id`)
- `utils/`
  - `reportFilters.js` aturan "omzet saat lunas" (`settledBetween`, `settledDate`)
  - `cashIn.js` kas masuk (`getCashIn`, `getCashInEntries`, `buildCashflow`, `AUTO_CATEGORIES`)
  - `addProducts.js` produk dummy untuk uji coba
  - `fixCustomerStats.js` hitung ulang statistik pelanggan dari transaksi yang ada
  - `seeder.js` (**menghapus semua data**, jangan dipakai sembarangan), `migrateUnits.js`

**Frontend (`kasirku-frontend/src/app`)**
- `features/` dashboard, pos, products, transactions (list + detail), customers (list + detail), finance, reports (sales, profit-loss, top-products, cashflow, custom price), settings, users
- `shared/components/` `pagination`, `pay-debt-modal`, `confirm-dialog`, `loading-spinner`
- `core/services/` `api.service.ts` (semua service HTTP), `receipt.service.ts` (cetak struk), `toast.service.ts`, auth
- Gaya modal kustom (`modal-custom`, `modal-backdrop-custom`) ada di `src/styles.css` (global, mendukung tema gelap).
- Aturan global `.btn { font-size: 14px }` membuat tombol lebih pendek dari kolom isian; halaman Transaksi memakai
  `.filter-btn` untuk menyamakan tinggi.

## 4. Aturan bisnis yang sudah disepakati

### Omzet dan laporan
- **Omzet dihitung saat transaksi lunas.** Transaksi biasa dihitung di tanggal penjualan; **hutang dihitung di tanggal
  dilunasi** (`debtPaidAt`). Hutang belum lunas dan transaksi dibatalkan tidak ikut.
- Dipakai di: Dashboard (kartu, grafik penjualan, rekap harian), Laporan (penjualan, laba rugi, produk terlaris,
  kategori, diskon manual), dan `GET /transactions/today`.
- Konsekuensi: hutang lama yang dilunasi hari ini masuk omzet hari ini, bukan tanggal penjualannya.

### Kas masuk (uang yang benar-benar diterima)
- Dashboard → kartu **Kas Masuk Hari Ini**: kolom Penjualan, Uang Muka, Cicilan Hutang, Pemasukan Lain, Total.
- Penjualan non-hutang dicatat saat dibuat; **uang muka saat transaksi dibuat, per metode uang muka**
  (`Transaction.downPaymentMethod`; data lama tanpa field itu dibaca sebagai tunai); cicilan saat dibayar
  (per metode); pemasukan lain dari menu Keuangan.
- **Laporan → Arus Kas** menggabungkan kas otomatis (penjualan, uang muka, cicilan) dengan catatan manual Keuangan.
  Entri uang muka berbunyi "Uang muka hutang <Metode> (n transaksi)".
  Pemasukan Arus Kas harian harus sama dengan Kas Masuk Dashboard.
- Pengelompokan hari memakai zona waktu **Asia/Jakarta**.

### Menu Keuangan (manual)
- Hanya untuk modal, pinjaman, pemasukan lain, dan pengeluaran. Penjualan, uang muka, dan cicilan dicatat otomatis.
- Kategori **Penjualan** dan **Piutang Masuk** disembunyikan dari dropdown dan catatan manual berkategori itu tidak
  dihitung di Kas Masuk maupun Arus Kas (supaya tidak dobel).

### Hutang
- Metode pembayaran **Hutang** di kasir. Pelanggan terdaftar atau tanpa nama. Tanpa pelanggan terdaftar, **catatan wajib**
  (nama atau ciri-ciri, misalnya "Bpk jaket hijau, beli kertas A4"). Catatan disimpan dengan awalan
  `[Hutang tanpa pelanggan terdaftar]`.
- **Hutang sebagian (uang muka):** kolom "Dibayar Sekarang (opsional)", disimpan di `Transaction.downPayment`. Harus
  kurang dari total (kalau sama, pakai Tunai). Saldo hutang pelanggan bertambah sebesar *sisa*, bukan total.
- **Metode uang muka:** dropdown "Dibayar via ..." di kasir (muncul kalau uang muka > 0; pilihan = metode kasir tanpa Hutang),
  disimpan di `Transaction.downPaymentMethod` (enum: tunai, transfer, qris, kartu_debit, kartu_kredit; bawaan `tunai`).
  Dikirim lewat `downPaymentMethod` pada pembuatan transaksi; nilai tidak valid ditolak. Tampil di riwayat pembayaran
  halaman detail dan di struk ("Dibayar sekarang (TRANSFER)").
- Sisa hutang = `grandTotal − downPayment − jumlah semua DebtPayment`. **Jangan memakai `Transaction.amountPaid`**
  untuk hutang (di data lama berisi total penuh).
- Pembayaran: `POST /transactions/debt/:id/pay` (nominal > 0 dan ≤ sisa). Info: `GET /transactions/debt/:id`
  (total, uang muka, sudah dibayar, sisa, riwayat). Berlaku juga untuk hutang tanpa pelanggan terdaftar
  (`DebtPayment.customer` boleh kosong).
- Lunas → `status: 'selesai'`, `isDebt: false`, `debtPaidAt` terisi.
- **Pembatalan:** transaksi hutang yang sudah ada **cicilan susulan** (DebtPayment) **tidak bisa dibatalkan**.
  Uang muka tidak dihitung sebagai cicilan, jadi masih bisa dibatalkan (uang dikembalikan manual).
  Pembatalan membalik statistik pelanggan: `currentDebt` (total − uang muka), `totalTransactions`, `totalSpent`, dan poin
  (dengan catatan PointHistory). Hapus permanen hanya untuk **owner** dan hanya transaksi berstatus dibatalkan.

### Pengingat hutang (Dashboard, kartu "Piutang Perlu Ditagih")
- Sumber: `GET /customers/debt-reminders` (`getDebtReminders`, ambang bawaan 7 hari, bisa `?days=`).
- **Pelanggan terdaftar** dihitung dari `Customer.currentDebt`. **Hutang tanpa pelanggan terdaftar** dihitung **per transaksi**
  (`customer: null, isDebt: true, status: 'hutang'`; sisa = total − uang muka − cicilan; umur dari tanggal transaksinya).
  Item ini bertanda `isAnonymous: true`, punya `transactionId`, `customerId: null`, `name` dari catatan kasir (awalan teknis dibuang).
- Daftar digabung dan diurutkan dari yang paling lama menunggak; badge dan total ikut menghitung semuanya.
- Klik baris: hutang tanpa nama → `/transactions/:id`; pelanggan terdaftar → `/customers/:id`.
  Tombol **Lihat Semua** → `/transactions?status=hutang` (langsung membuka filter Hutang).

### Kembalian tidak diambil
- Kotak centang di kasir, muncul hanya untuk **tunai dengan kembalian > 0**. Centang otomatis lepas kalau nominal kembalian
  berubah.
- Menyimpan `Transaction.keptChange` dan otomatis membuat catatan Keuangan (Pemasukan, Lain-lain, `transactionRef`),
  dalam sesi database yang sama. Dibatalkan → catatan itu dihapus. Struk menampilkan "Kembalian (tidak diambil)".

### Nomor invoice
- Format `INV-yyyymmdd-NNNN` (tanggal lokal). NNNN = **nomor tertinggi yang ada + 1** (urutan global), bukan jumlah
  transaksi. Ini memperbaiki bentrok nomor setelah hapus permanen.
- Keterbatasan yang diterima: dua transaksi tersimpan di detik yang persis sama bisa menghasilkan nomor kembar
  (toko satu kasir, dianggap aman).

### Produk terlaris (tab di kasir)
- `GET /products/top-selling?limit=30&days=30`: jumlah terjual (`qty`) per produk dalam N hari terakhir, transaksi dibatalkan
  tidak dihitung, **hutang dihitung sebagai terjual** (barang sudah keluar). Hanya produk aktif dan berstok.
- Ukurannya **jumlah terjual**, bukan omzet, jadi berbeda dari aturan "omzet saat lunas" dan dari laporan Produk Terlaris.

### Backup & Restore (Pengaturan → Backup & Restore, hanya owner)
- **Download Backup:** `GET /backup/download`. Server menjalankan `mongodump`, men-zip di `C:\kasirku-temp-backup`, mengirim ke browser, lalu
  menghapus salinan sementara. File akhirnya ada di **folder Download browser** (bukan di server). Inilah alasan dulu file backup
  "tidak ketemu".
- **Simpan Backup ke Folder (baru):** folder tujuan diketik di Pengaturan (`Setting.backupDir`, bawaan `C:\KasirKu-Backup`,
  harus lokasi lengkap seperti `D:\Backup KasirKu` atau alamat jaringan `\\server\folder`). Folder berada di **komputer server**
  (komputer B, tempat backend jalan), dibuat otomatis kalau belum ada. `POST /backup/save` menyimpan
  `kasirku-backup-YYYY-MM-DD_HH-mm-ss.zip` (jam WIB) langsung ke folder itu dan mengembalikan lokasi lengkap + ukuran.
  `GET /backup/list` menampilkan maksimal 50 file `kasirku-backup-*.zip` terbaru di folder itu.
  Tombol Backup Sekarang nonaktif selama isi kolom folder belum disimpan.
- **Restore:** `POST /backup/restore` (upload zip, maks 100 MB, hanya `.zip`). Zip harus berisi folder bernama sama dengan database yang
  sedang dipakai di akar (kedua jenis backup di atas memenuhi ini). Dijalankan `mongorestore --drop`, jadi **menimpa data sekarang**.
  Belum ada dialog konfirmasi dan belum ada backup otomatis sebelum restore.
- Aplikasi dijalankan lewat nginx di komputer B. Untuk upload restore, `client_max_body_size` nginx harus cukup besar, dan untuk
  backup/restore yang lama perlu `proxy_read_timeout` yang cukup (kalau terlalu kecil muncul 413/504 padahal server tetap menyelesaikan prosesnya).

## 5. Fitur yang sudah selesai (ringkas)

**Kasir (POS)**
- Produk dimuat dari server per 30 item (infinite scroll dengan `IntersectionObserver`), pencarian dan filter kategori
  di server (debounce 300 ms), hanya produk berstok (`inStock=true`). Perbaikan CSS grid (`grid-auto-rows: max-content`).
- Uang muka hutang (dengan pilihan metode), kotak centang kembalian, teks petunjuk hutang tanpa nama, struk yang sesuai.
- **Enter di kolom cari** memasukkan produk ke keranjang (cocok untuk scan barcode): memakai pencarian sendiri ke server,
  prioritas barcode/SKU yang persis sama, atau satu-satunya hasil; kalau hasilnya banyak atau kosong, muncul toast dan tidak ada yang dimasukkan.
- **Tab Terlaris** (setelah tab Semua). Nilai khusus `selectedCategory = 'terlaris'`; mengetik pencarian otomatis pindah ke Semua.
- Info "Menampilkan x dari y produk" di atas grid.
- **Posisi scroll tetap setelah checkout:** `refreshProducts()` memuat ulang sebanyak produk yang sudah tampil tanpa spinner
  (dengan `trackBy`). Kalau ada produk yang stoknya habis (urutan halaman bergeser), otomatis mengalah ke muat ulang dari awal.

**Komponen bersama**
- `PaginationComponent`: pertama, sebelumnya, nomor dengan titik-titik, berikutnya, terakhir, pilihan 10/20/50/100 per
  halaman, teks "Menampilkan x–y dari z". Dipakai di Produk, Transaksi, Pelanggan, Keuangan.
- `PayDebtModalComponent`: ringkasan hutang, nominal (default = sisa, tombol Lunas), metode, catatan, riwayat
  pembayaran. Dipakai di daftar Transaksi, detail Pelanggan, dan detail Transaksi.

**Halaman Transaksi**
- Filter: tanggal, status, kategori, **Cari Produk** (nama/SKU, dengan kotak ringkasan terjual per produk),
  **Cari Transaksi** (invoice, nama pelanggan, catatan).
- Tombol cepat **Hari ini / Bulan ini** di atas kolom tanggal (memakai tanggal lokal; tombol menyala sesuai rentang aktif).
- Tombol **Hutang**: semua hutang tanpa batas tanggal, urut terlama, banner total hutang belum lunas, kolom Sisa,
  catatan, ringkasan barang, tombol **Bayar**. Bisa dibuka langsung lewat `/transactions?status=hutang`.
- Kartu "Pendapatan (Selesai)" kini dihitung dari seluruh hasil filter (`totalRevenue` dari backend).

**Detail transaksi (`/transactions/:id`)**
- Untuk transaksi hutang: tombol **Bayar** (header dan kartu), kartu **Hutang** (total, uang muka, sudah dibayar, sisa,
  pesan lunas), tabel **Riwayat Pembayaran Hutang** (uang muka sebagai baris pertama dengan metodenya, lalu cicilan).
  Memakai `PayDebtModalComponent` dan `GET /transactions/debt/:id`; setelah bayar halaman dimuat ulang.
  Fungsi `getMethodLabel()` memetakan kode metode ke teks ("Kartu Debit", "QRIS", dst).

**Dashboard**: kartu Kas Masuk Hari Ini, rekap harian, grafik, aturan omzet saat lunas, kartu pengingat hutang
(termasuk hutang tanpa nama, lihat bagian 4).
**Keuangan**: kolom Nominal menghapus angka 0 saat difokuskan; kategori otomatis disembunyikan; teks penjelasan di bawah judul sudah terpasang.

**Backup ke folder pilihan (Pengaturan → Backup & Restore):** kartu "Simpan Backup ke Folder" berisi kolom folder tujuan
(+ tombol Simpan Folder), tombol Backup Sekarang, kotak hijau berisi lokasi lengkap file yang baru dibuat, dan daftar backup di folder itu
(nama, waktu, ukuran). Kartu "Download Backup" lama tetap ada dengan teks yang dijelaskan ulang. Pengguna melaporkan fitur ini **sudah berjalan**.
Detail di bagian 4.

**Skrip bantu (jalankan dari folder `kasirku-backend`)**
- `node src/utils/addProducts.js 100` (tambah produk dummy, SKU `DUMMY-xxxxx`), opsi `--dry` untuk pratinjau,
  `node src/utils/addProducts.js hapus` untuk menghapus produk dummy. **Produk dummy di komputer A sengaja dibiarkan.**
- `node src/utils/fixCustomerStats.js` (pratinjau) lalu `--apply`; tambah `--poin` untuk ikut menghitung ulang poin.

## 6. Yang belum dikerjakan

Item 1 sampai 4 dari daftar lama (detail transaksi, pengingat hutang tanpa nama, metode uang muka, kenyamanan kasir)
**sudah selesai**, begitu juga rapi-rapi (`console.log` di Keuangan sudah dihapus; penjelasan menu Keuangan sudah ada).

1. **Ide lanjutan (belum dimulai):** fitur "hapus sisa hutang (tak tertagih)", retur barang, ringkasan Laba Rugi yang
   memisahkan omzet yang belum tertagih.
2. **Perbaikan kecil:** pesan "Stok tidak cukup" di kasir dan pesan kosong di tab Terlaris **sudah dikerjakan**.
   Dua yang sengaja **dilewati** karena manfaatnya kecil:
   - Tanggal bawaan memakai `toISOString().split('T')[0]` (UTC) di **14 tempat pada 6 file** (Transaksi, Keuangan, Laporan,
     Dashboard, Pengaturan). Hanya berpengaruh antara 00.00 dan 07.00 WIB, di luar jam buka toko. Kalau suatu hari dikerjakan,
     buat satu fungsi bersama "tanggal lokal" (contoh: `toLocaleDateString('en-CA')`) dan ganti satu per satu; hati-hati dengan
     tanggal catatan Keuangan yang disimpan.
   - Menyimpan `downPaymentMethod` di respons `GET /transactions/debt/:id` (murni kerapian; detail transaksi sudah membacanya dari transaksi).
3. **Pengaman restore (opsional, belum dikerjakan):** (a) dialog konfirmasi sebelum restore (komponen `confirm-dialog` sudah ada),
   (b) backup otomatis ke folder pilihan sebelum restore, dengan nama seperti `kasirku-backup-sebelum-restore-...zip`
   (bisa memakai `createBackupZip` yang sudah ada di `backup.controller.js`). Hal kecil lain: `.ZIP` huruf besar ditolak,
   restore memakai `fetch` biasa (tidak ikut pembaruan token otomatis), belum ada pembersihan backup lama (mis. simpan N terakhir).
4. **Status git:** perubahan 9 Oktober sudah di-commit dan di-push (backend sampai `31c2c7b`, frontend sampai `b25a2c4`).
   Fitur **backup ke folder** (backend: model Setting, `backup.controller.js`, `backup.routes.js`; frontend: halaman Pengaturan)
   dibuat setelahnya dan perlu di-commit/push (cek `git status`), lalu `git pull` di komputer B.

## 7. Hal yang perlu diwaspadai

- **Belum diuji di aplikasi sungguhan:** perubahan 9 Oktober lolos build/`node --check` di sandbox dan fungsi murninya
  diuji (pengguna belum melaporkan hasil uji untuk bagian ini), tetapi query MongoDB (pengingat hutang tanpa nama, agregasi uang muka per metode, `top-selling`) dan perilaku layar
  (scroll tetap, scan Enter) baru terbukti setelah pengguna mencobanya. Daftar uji cepat:
  hutang tanpa nama muncul di Dashboard dan bisa dibayar dari detail; uang muka via Transfer pindah ke baris Transfer di Kas Masuk
  dan Arus Kas; tab Terlaris terisi; Enter + SKU memasukkan produk; scroll tidak lompat setelah checkout.
- **Backup ke folder:** pengguna melaporkan berhasil. Yang belum dicoba: me-restore file yang dibuat dari folder baru itu (struktur zip-nya
  sama dengan Download, jadi seharusnya bisa). Cara uji aman: Backup Sekarang, lalu restore file yang baru dibuat itu (isinya sama dengan data sekarang).
  Restore versi lama (upload) pernah dicoba pengguna dan berhasil.
- Folder backup ada di komputer server (B). Kalau aplikasi dibuka dari perangkat lain, file tetap tersimpan di B.
- Catatan alat: saat menguji kode backend di sandbox (Linux), memuat `backup.controller.js` membuat folder literal bernama
  `C:\kasirku-temp-backup` di folder kerja; itu hanya efek sandbox dan tidak boleh ikut di-commit.
- Scanner barcode diasumsikan mengirim Enter di akhir. Kalau scanner pengguna tidak, perlu penyesuaian.
- Hutang lama yang pernah dicicil sebelum perbaikan cicilan bisa punya status tidak sinkron (total cicilan sudah penuh
  tetapi status masih "hutang"). Belum ada alat perbaikannya. Di detail transaksi, sisanya tampil Rp 0 dan tombol Bayar tidak muncul.
- Ada 1 catatan `DebtPayment` yatim (transaksinya sudah dihapus). Tidak berpengaruh pada perhitungan.
- `PointHistory` yang dibuat saat transaksi memakai `transaction: null`, jadi tidak tertaut ke transaksinya.
- Rentang tanggal laporan lama memakai `new Date(startDate)` (UTC tengah malam). Tidak berpengaruh untuk jam buka
  toko, tetapi perlu diingat kalau ada transaksi dini hari.
- Kartu "Pendapatan (Selesai)" di Transaksi mengikuti **tanggal penjualan** (sama seperti daftar), sedangkan Laporan
  mengikuti **tanggal lunas**. Untuk angka omzet resmi, gunakan Laporan.
- "Terlaris" di kasir (jumlah terjual, hutang ikut dihitung) berbeda dengan laporan Produk Terlaris (mengikuti aturan omzet saat lunas).
- Hutang tanpa nama tidak punya saldo pelanggan, jadi hanya terlihat lewat Dashboard, daftar Transaksi (tombol Hutang), dan detail transaksi.

## 8. Cara memulai di chat baru

1. Unggah file ini ke chat baru.
2. Minta asisten meng-clone kedua repo dan memeriksa kondisi terbaru (`git log`, build, penanda fitur di atas).
3. Pastikan fitur backup ke folder sudah di-commit (bagian 6, nomor 4), lalu sebutkan apa yang ingin dikerjakan
   (bagian 6, nomor 1 atau 3; ide lanjutan sengaja dihentikan dulu karena pengguna punya proyek lain yang ingin dikerjakan).
4. Ingatkan preferensi di bagian 2 (satu langkah per giliran, format "cari lalu ganti dengan" beserta penjelasan,
   Bahasa Indonesia).