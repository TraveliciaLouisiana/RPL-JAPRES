-- JAPRES - dosen_kelompok.sql
-- Skrip SIMULASI peran Dosen (karena halaman Dosen belum tersambung ke database).
-- Prasyarat: skema.sql, data.sql, dan tambahan.sql (kolom tugas_besar.dikunci) sudah dijalankan.
--
-- ALUR YANG DISIMULASIKAN
--   LANGKAH 1  Dosen menentukan JUMLAH KELOMPOK        (kelompok dibuat kosong)
--   LANGKAH 2  Mahasiswa memilih kelompok + klik Simpan (dilakukan di aplikasi, bukan di SQL)
--   LANGKAH 3  Dosen MENGUNCI kelompok                  (mahasiswa tidak bisa pindah lagi)
--   LANGKAH 4  Dosen menetapkan jadwal presentasi       (baru terlihat mahasiswa setelah LANGKAH 3)

-- ------------------------------------------------------------------------------------------
-- (Opsional, untuk uji coba) Kembalikan RPL / TB01 ke kondisi awal: kelompok ada tapi KOSONG & belum dikunci.
-- Jadwal presentasi di tabel presentasi TIDAK dihapus; backend menyembunyikannya selama belum dikunci.
-- ------------------------------------------------------------------------------------------
DELETE FROM anggota_kelompok
 WHERE id_kelompok IN (SELECT id_kelompok FROM kelompok WHERE id_tugas_besar = 'TB01');
UPDATE tugas_besar SET dikunci = FALSE WHERE id_tugas_besar = 'TB01';

-- ------------------------------------------------------------------------------------------
-- LANGKAH 1: Dosen menentukan jumlah kelompok. Contoh: RPL (TB01) dibuat 6 kelompok.
-- Ubah angka 6 sesuai kebutuhan. Kelompok yang sudah ada tidak diduplikasi.
-- (Untuk mata kuliah lain: ganti 'TB01' dan awalan 'KLP-RPL-' mengikuti pola id yang sudah ada di data.sql.)
-- ------------------------------------------------------------------------------------------
INSERT INTO kelompok (id_kelompok, nama_kelompok, id_tugas_besar)
SELECT 'KLP-RPL-' || LPAD(n::text, 2, '0'), 'Kelompok ' || n, 'TB01'
FROM generate_series(1, 6) AS n
ON CONFLICT (id_kelompok) DO NOTHING;

-- ------------------------------------------------------------------------------------------
-- LANGKAH 3: Dosen MENGUNCI kelompok (jalankan SETELAH mahasiswa selesai memilih kelompok).
-- ------------------------------------------------------------------------------------------
-- UPDATE tugas_besar SET dikunci = TRUE  WHERE id_tugas_besar = 'TB01';   -- kunci
-- UPDATE tugas_besar SET dikunci = FALSE WHERE id_tugas_besar = 'TB01';   -- buka lagi

-- ------------------------------------------------------------------------------------------
-- LANGKAH 4: Dosen menetapkan jadwal presentasi per kelompok (contoh). Format sama dengan data.sql.
-- Mahasiswa baru MELIHAT jadwal ini setelah LANGKAH 3 (dikunci = TRUE).
-- ------------------------------------------------------------------------------------------
-- INSERT INTO presentasi (id_presentasi, tanggal, jam_mulai, jam_selesai, ruangan, id_kelompok, nid)
-- VALUES ('PR101', '2026-12-07', '10:00', '10:30', '9018', 'KLP-RPL-01', 'NID001');
