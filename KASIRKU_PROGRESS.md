# KasirKu — Catatan Progres & Serah Terima

Dokumen ini dibuat supaya pekerjaan bisa dilanjutkan di chat baru tanpa kehilangan konteks.
Kondisi per **7 Oktober 2026**.

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

## 2. Cara bekerja yang disukai pengguna

- Bahasa: **Indonesia**.
- Pekerjaan coding dipandu **satu langkah per giliran** (jangan scaffold semuanya sekaligus).
- Komponen Angular dipisah `.ts` / `.html` / `.css` (jangan template inline).
- Pesan commit: pendek, huruf kecil, bahasa Inggris (contoh: `fix pay debt`, `add debt reminders`).
- Pengguna biasanya `git add .` lalu commit dan push per repo. Pastikan `.env` tidak ikut ter-commit.
- Saat memberi petunjuk edit, tulis **kode lengkap**, jangan potongan dengan `...` (pernah menyebabkan bagian terlewat).
  Untuk file yang banyak berubah, lebih aman memberikan **seluruh isi file**.
- Pengguna menempel isi file atau screenshot untuk dicek. Tab Network di DevTools (tab Response) berguna untuk
  memastikan backend mengirim data yang diharapkan.
- Pengguna lebih suka usulan yang konkret dengan alasan. Beri pendapat jujur, termasuk kalau idenya punya risiko.

### Catatan untuk asisten (lingkungan sandbox)
- Fetch langsung ke GitHub diblokir (robots). **Clone repo** ke sandbox (`git clone`).
- Di sandbox **tidak ada MongoDB**. Query tidak bisa dijalankan sungguhan. Yang bisa dilakukan: `node --check`,
  `npx ng build --configuration development` (symlink `node_modules`), dan uji logika agregasi dengan paket `mingo`.
  Selalu sampaikan bahwa query MongoDB baru teruji setelah pengguna mencobanya.
- Sebelum bekerja, **clone ulang repo terbaru** dan periksa kondisinya. Jangan percaya salinan lama di sandbox.
- Perubahan di sandbox tidak otomatis ada di komputer pengguna. Yang berlaku adalah yang pengguna tempel dan commit.

## 3. Struktur penting

**Backend (`kasirku-backend/src`)**
- `controllers/` transaction, customer, product, category, unit, report, dashboard, finance, setting, backup, auth, user
- `models/` transaction/Transaction.js, customer/{Customer, DebtPayment, PointHistory}.js, finance/Finance.js, product, category, unit, user, setting
- `routes/*.routes.js`
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
- Penjualan non-hutang dicatat saat dibuat; uang muka saat transaksi dibuat (**dianggap tunai**); cicilan saat dibayar
  (per metode); pemasukan lain dari menu Keuangan.
- **Laporan → Arus Kas** menggabungkan kas otomatis (penjualan, uang muka, cicilan) dengan catatan manual Keuangan.
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

## 5. Fitur yang sudah selesai (ringkas)

**Kasir (POS)**
- Produk dimuat dari server per 30 item (infinite scroll dengan `IntersectionObserver`), pencarian dan filter kategori
  di server (debounce 300 ms), hanya produk berstok (`inStock=true`). Perbaikan CSS grid (`grid-auto-rows: max-content`).
- Uang muka hutang, kotak centang kembalian, teks petunjuk hutang tanpa nama, struk yang sesuai.

**Komponen bersama**
- `PaginationComponent`: pertama, sebelumnya, nomor dengan titik-titik, berikutnya, terakhir, pilihan 10/20/50/100 per
  halaman, teks "Menampilkan x–y dari z". Dipakai di Produk, Transaksi, Pelanggan, Keuangan.
- `PayDebtModalComponent`: ringkasan hutang, nominal (default = sisa, tombol Lunas), metode, catatan, riwayat
  pembayaran. Dipakai di daftar Transaksi dan detail Pelanggan.

**Halaman Transaksi**
- Filter: tanggal, status, kategori, **Cari Produk** (nama/SKU, dengan kotak ringkasan terjual per produk),
  **Cari Transaksi** (invoice, nama pelanggan, catatan).
- Tombol **Hutang**: semua hutang tanpa batas tanggal, urut terlama, banner total hutang belum lunas, kolom Sisa,
  catatan, ringkasan barang, tombol **Bayar**.
- Kartu "Pendapatan (Selesai)" kini dihitung dari seluruh hasil filter (`totalRevenue` dari backend).

**Dashboard**: kartu Kas Masuk Hari Ini, rekap harian, grafik, aturan omzet saat lunas.
**Keuangan**: kolom Nominal menghapus angka 0 saat difokuskan; kategori otomatis disembunyikan.

**Skrip bantu (jalankan dari folder `kasirku-backend`)**
- `node src/utils/addProducts.js 100` (tambah produk dummy, SKU `DUMMY-xxxxx`), opsi `--dry` untuk pratinjau,
  `node src/utils/addProducts.js hapus` untuk menghapus produk dummy.
- `node src/utils/fixCustomerStats.js` (pratinjau) lalu `--apply`; tambah `--poin` untuk ikut menghitung ulang poin.

## 6. Yang belum dikerjakan (urutan yang disarankan)

1. **Detail transaksi** (`/transactions/:id`): tombol Bayar, riwayat cicilan, baris uang muka (memakai
   `PayDebtModalComponent` dan `GET /transactions/debt/:id`).
2. **Pengingat jatuh tempo untuk hutang tanpa nama.** Pengingat (lonceng) dan daftar penghutang saat ini dibangun dari
   `Customer.currentDebt`, jadi hutang tanpa pelanggan terdaftar tidak pernah muncul.
3. **Metode pembayaran uang muka** (sekarang selalu dianggap tunai). Perlu field baru (mis. `downPaymentMethod`) dan
   penyesuaian `cashIn.js` serta Arus Kas.
4. **Kenyamanan:** tombol cepat "Hari ini / Bulan ini" di filter tanggal; tab **Terlaris** di kasir; Enter di kolom cari
   kasir untuk langsung memasukkan produk (scan barcode); info "30 dari 120 produk"; posisi scroll kasir tetap setelah
   checkout.
5. **Ide lanjutan:** fitur "hapus sisa hutang (tak tertagih)", retur barang, ringkasan Laba Rugi yang memisahkan
   omzet yang belum tertagih.
6. **Rapi-rapi:** hapus produk dummy kalau sudah tidak dipakai; hapus sisa `console.log('summary:', ...)` di
   `loadSummary()` halaman Keuangan; penjelasan baru di bawah judul menu Keuangan ("Catat modal, pengeluaran, dan
   pemasukan di luar penjualan...") jika belum dipasang.

## 7. Hal yang perlu diwaspadai

- Hutang lama yang pernah dicicil sebelum perbaikan cicilan bisa punya status tidak sinkron (total cicilan sudah penuh
  tetapi status masih "hutang"). Belum ada alat perbaikannya.
- Ada 1 catatan `DebtPayment` yatim (transaksinya sudah dihapus). Tidak berpengaruh pada perhitungan.
- `PointHistory` yang dibuat saat transaksi memakai `transaction: null`, jadi tidak tertaut ke transaksinya.
- Rentang tanggal laporan lama memakai `new Date(startDate)` (UTC tengah malam). Tidak berpengaruh untuk jam buka
  toko, tetapi perlu diingat kalau ada transaksi dini hari.
- Kartu "Pendapatan (Selesai)" di Transaksi mengikuti **tanggal penjualan** (sama seperti daftar), sedangkan Laporan
  mengikuti **tanggal lunas**. Untuk angka omzet resmi, gunakan Laporan.

## 8. Cara memulai di chat baru

1. Unggah file ini ke chat baru.
2. Minta asisten meng-clone kedua repo dan memeriksa kondisi terbaru (`git log`, build, penanda fitur di atas).
3. Sebutkan item dari bagian 6 yang ingin dikerjakan. Saran: mulai dari nomor 1 (detail transaksi).
4. Ingatkan preferensi di bagian 2 (satu langkah per giliran, kode lengkap, Bahasa Indonesia).