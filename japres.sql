-- =====================================================================
--  JAPRES : Aplikasi Pengaturan Jadwal Presentasi Tugas Besar
--  Database `japres`  |  MySQL / MariaDB (XAMPP)
--  Mengikuti Dokumen Teknis: bab 7.2 (Normalisasi) dan 7.3 (Rancangan Fisik),
--  class diagram (6.2), serta aturan bisnis di bab 1 dan FR/NFR (bab 2).
--  Data dummy berasal dari Dummy_data_FRS-RPL.xlsx
--
--  CARA IMPORT (phpMyAdmin): http://localhost/phpmyadmin -> tab "Import" ->
--  pilih japres.sql -> Go.  Aman di-import berulang (database `japres` lama dihapus lalu dibuat ulang).
--
--  AKUN DUMMY (password ter-hash bcrypt, cocok dengan password_verify() PHP)
--     Admin      : lina@unpar.ac.id                    / admin123
--     Dosen      : haryanto.wijaya@unpar.ac.id         / dosen123
--     Mahasiswa  : aditya.pratama@student.unpar.ac.id  / mhs123
--
--  PERBAIKAN DATA EXCEL
--   1. Tanggal: kolom campur teks dd/mm/yyyy dan tanggal Excel yang hari-bulannya
--      terbalik. Semua dikoreksi (cocok dengan contoh di dokumen 7.2: UTS 12/10/2026,
--      UAS 11/12/2026, pengawas 09/12/2026).
--   2. ID Admin/NID memakai ADM001..ADM003 dan NID001..NID006 (sesuai dokumen 7.2).
--   3. Password teks biasa diganti hash bcrypt (NFR-5.3.6).
--   4. Satu baris ganda di FRS_Mengambil dibuang.
--
--  DI LUAR DOKUMEN
--   * Presentasi.Terkunci      : ada di class diagram (Presentasi.terkunci), tetapi
--                                belum ada di tabel 7.3 -> tambahkan ke dokumen.
--   * View V_Kelompok_Info & V_Jadwal_Presentasi : hanya kemudahan query.
--
--  ATURAN BISNIS YANG DIJAGA DATABASE
--   * 1 mata kuliah = 1 tugas besar per semester      UNIQUE (Kode_MK, Semester)
--   * 1 kelompok = 1 jadwal presentasi                 UNIQUE (ID_Kelompok)
--   * 1 mahasiswa = 1 kelompok per mata kuliah         trigger trg_anggota_masuk
--   * kuota kelompok tidak boleh terlewati             trigger trg_anggota_masuk
--   * keluar/masuk kelompok ditolak jika jadwal dikunci trigger (masuk & keluar)
--   * Jam_Selesai harus setelah Jam_Mulai              CHECK (FR-4.3.2)
--   * durasi presentasi = durasi tugas besar           trigger trg_presentasi_*
--   * 2 kelompok se-mata kuliah tidak boleh bentrok    trigger trg_presentasi_*
--   * jadwal terkunci tidak bisa diubah sebelum dibuka trigger trg_presentasi_ubah
-- =====================================================================

-- Database lama dihapus seluruhnya agar tidak bentrok dengan versi sebelumnya
-- (termasuk tabel berhuruf kecil dari japres.sql lama). Aman untuk data dummy.
DROP DATABASE IF EXISTS japres;
CREATE DATABASE japres CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE japres;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  STRUKTUR TABEL  (tipe & panjang kolom mengikuti tabel 7.3 dokumen)
-- ---------------------------------------------------------------------
CREATE TABLE Admin (
  ID_Admin  VARCHAR(10)  NOT NULL,
  Nama      VARCHAR(100) NOT NULL,
  Email     VARCHAR(100) NOT NULL,
  Password  VARCHAR(255) NOT NULL,
  PRIMARY KEY (ID_Admin),
  UNIQUE KEY uq_admin_email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Dosen (
  NID       VARCHAR(20)  NOT NULL,
  Nama      VARCHAR(100) NOT NULL,
  Email     VARCHAR(100) NOT NULL,
  Password  VARCHAR(255) NOT NULL,
  ID_Admin  VARCHAR(10)  NOT NULL,
  PRIMARY KEY (NID),
  UNIQUE KEY uq_dosen_email (Email),
  CONSTRAINT fk_dosen_admin FOREIGN KEY (ID_Admin) REFERENCES Admin (ID_Admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Mahasiswa (
  NPM       VARCHAR(10)  NOT NULL,
  Nama      VARCHAR(100) NOT NULL,
  Email     VARCHAR(100) NOT NULL,
  Password  VARCHAR(255) NOT NULL,
  ID_Admin  VARCHAR(10)  NOT NULL,
  PRIMARY KEY (NPM),
  UNIQUE KEY uq_mhs_email (Email),
  CONSTRAINT fk_mhs_admin FOREIGN KEY (ID_Admin) REFERENCES Admin (ID_Admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Mata_Kuliah (
  Kode_MK  VARCHAR(10)  NOT NULL,
  Nama_MK  VARCHAR(100) NOT NULL,
  SKS      INT          NOT NULL,
  PRIMARY KEY (Kode_MK),
  CONSTRAINT ck_mk_sks CHECK (SKS > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Kelas (
  ID_Kelas    VARCHAR(20) NOT NULL,
  Nama_Kelas  VARCHAR(10) NOT NULL,
  Semester    VARCHAR(20) NOT NULL,
  Kode_MK     VARCHAR(10) NOT NULL,
  NID         VARCHAR(20) NOT NULL,
  PRIMARY KEY (ID_Kelas),
  CONSTRAINT fk_kelas_mk    FOREIGN KEY (Kode_MK) REFERENCES Mata_Kuliah (Kode_MK),
  CONSTRAINT fk_kelas_dosen FOREIGN KEY (NID)     REFERENCES Dosen (NID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Jadwal_Kuliah (
  ID_Jadwal_Kuliah VARCHAR(10) NOT NULL,
  Hari        VARCHAR(10) NOT NULL,
  Ruangan     VARCHAR(10) NOT NULL,
  Jam_Mulai   TIME        NOT NULL,
  Jam_Selesai TIME        NOT NULL,
  ID_Kelas    VARCHAR(20) NOT NULL,
  PRIMARY KEY (ID_Jadwal_Kuliah),
  CONSTRAINT fk_jk_kelas FOREIGN KEY (ID_Kelas) REFERENCES Kelas (ID_Kelas),
  CONSTRAINT ck_jk_hari CHECK (Hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')),
  CONSTRAINT ck_jk_jam  CHECK (Jam_Selesai > Jam_Mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Jadwal_Ujian (
  ID_Jadwal_Ujian VARCHAR(10) NOT NULL,
  Jenis_Ujian   VARCHAR(5)  NOT NULL,
  Tanggal_Ujian DATE        NOT NULL,
  Jam_Mulai     TIME        NOT NULL,
  Jam_Selesai   TIME        NOT NULL,
  ID_Kelas      VARCHAR(20) NOT NULL,
  PRIMARY KEY (ID_Jadwal_Ujian),
  CONSTRAINT fk_ju_kelas FOREIGN KEY (ID_Kelas) REFERENCES Kelas (ID_Kelas),
  CONSTRAINT ck_ju_jenis CHECK (Jenis_Ujian IN ('UTS','UAS')),
  CONSTRAINT ck_ju_jam   CHECK (Jam_Selesai > Jam_Mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Jadwal_Pengawas_Ujian (
  ID_Pengawas VARCHAR(10) NOT NULL,
  Tanggal     DATE        NOT NULL,
  Jam_Mulai   TIME        NOT NULL,
  Jam_Selesai TIME        NOT NULL,
  NID         VARCHAR(20) NOT NULL,
  PRIMARY KEY (ID_Pengawas),
  CONSTRAINT fk_pw_dosen FOREIGN KEY (NID) REFERENCES Dosen (NID),
  CONSTRAINT ck_pw_jam   CHECK (Jam_Selesai > Jam_Mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE FRS_Mengambil (
  NPM      VARCHAR(10) NOT NULL,
  ID_Kelas VARCHAR(20) NOT NULL,
  PRIMARY KEY (NPM, ID_Kelas),
  CONSTRAINT fk_frs_mhs   FOREIGN KEY (NPM)      REFERENCES Mahasiswa (NPM),
  CONSTRAINT fk_frs_kelas FOREIGN KEY (ID_Kelas) REFERENCES Kelas (ID_Kelas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Tugas_Besar (
  ID_Tugas_Besar    VARCHAR(10) NOT NULL,
  Kode_MK           VARCHAR(10) NOT NULL,
  Semester          VARCHAR(20) NOT NULL,
  Kuota             INT         NOT NULL,      -- jumlah maksimal anggota per kelompok
  Durasi_Presentasi INT         NOT NULL,      -- menit
  PRIMARY KEY (ID_Tugas_Besar),
  UNIQUE KEY uq_tb_mk_semester (Kode_MK, Semester),   -- 1 mata kuliah = 1 tugas besar per semester
  CONSTRAINT fk_tb_mk    FOREIGN KEY (Kode_MK) REFERENCES Mata_Kuliah (Kode_MK),
  CONSTRAINT ck_tb_kuota CHECK (Kuota > 0),
  CONSTRAINT ck_tb_durasi CHECK (Durasi_Presentasi > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Kelompok (
  ID_Kelompok    VARCHAR(15) NOT NULL,
  Nama_Kelompok  VARCHAR(30) NOT NULL,
  ID_Tugas_Besar VARCHAR(10) NOT NULL,
  PRIMARY KEY (ID_Kelompok),
  CONSTRAINT fk_kelompok_tb FOREIGN KEY (ID_Tugas_Besar) REFERENCES Tugas_Besar (ID_Tugas_Besar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Anggota_Kelompok (
  ID_Kelompok VARCHAR(15) NOT NULL,
  NPM         VARCHAR(10) NOT NULL,
  PRIMARY KEY (ID_Kelompok, NPM),
  CONSTRAINT fk_ak_kelompok FOREIGN KEY (ID_Kelompok) REFERENCES Kelompok (ID_Kelompok) ON DELETE CASCADE,
  CONSTRAINT fk_ak_mhs      FOREIGN KEY (NPM)         REFERENCES Mahasiswa (NPM)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Presentasi (
  ID_Presentasi VARCHAR(10) NOT NULL,
  Tanggal       DATE        NOT NULL,
  Jam_Mulai     TIME        NOT NULL,
  Jam_Selesai   TIME        NOT NULL,
  Ruangan       VARCHAR(10) NOT NULL,
  ID_Kelompok   VARCHAR(15) NOT NULL,
  NID           VARCHAR(20) NOT NULL,
  Terkunci      TINYINT(1)  NOT NULL DEFAULT 0,        -- sesuai class diagram: Presentasi.terkunci (1 = dikunci Dosen)
  PRIMARY KEY (ID_Presentasi),
  UNIQUE KEY uq_presentasi_kelompok (ID_Kelompok),     -- 1 kelompok = 1 jadwal presentasi
  CONSTRAINT fk_pr_kelompok FOREIGN KEY (ID_Kelompok) REFERENCES Kelompok (ID_Kelompok) ON DELETE CASCADE,
  CONSTRAINT fk_pr_dosen    FOREIGN KEY (NID)         REFERENCES Dosen (NID),
  CONSTRAINT ck_pr_jam CHECK (Jam_Selesai > Jam_Mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  DATA DUMMY
-- ---------------------------------------------------------------------

INSERT INTO Admin (ID_Admin, Nama, Email, Password) VALUES
  ('ADM001', 'Akbar Wirawan', 'akbar.wirawan@unpar.ac.id', '$2b$10$ULYeTiTvyUCyJZIisGFFJOyeCReCDbrSV8MPCiFXT5o00GdUeswa6'),
  ('ADM002', 'Doni Kurniawan', 'doni.kurniawan@unpar.ac.id', '$2b$10$SzY5s/7VBzfMW1IvLTEOH.dricvsGp5J9inKThe5/LySuQWD4fvLS'),
  ('ADM003', 'Lina', 'lina@unpar.ac.id', '$2b$10$dTH0/yeDVD3vMyyrxcYl4uSKgkUdcLn/Ip6jOtxILa13g8c5o/MOS');

INSERT INTO Dosen (NID, Nama, Email, Password, ID_Admin) VALUES
  ('NID001', 'Dr. Haryanto Wijaya, M.T.', 'haryanto.wijaya@unpar.ac.id', '$2b$10$2hypyLkhii/IMYqi.uHXPOMSZXOCbyToBTypgKT16..7Fo5TT7uVC', 'ADM001'),
  ('NID002', 'Maria Susilowati, M.Kom.', 'maria.susilowati@unpar.ac.id', '$2b$10$l5p9mCwx9lhY3RuBdoi7Rervv5Ql9sAM/kQphy/Qb9RL6Crlx1CwK', 'ADM002'),
  ('NID003', 'Dr. Agus Budiman, M.Sc.', 'agus.budiman@unpar.ac.id', '$2b$10$KKu3XMCVGNyATmJ/uA/kvupBLKNbP43yLxj2fquyRFD92.l.WZn8e', 'ADM003'),
  ('NID004', 'Ir. Veronika Handayani, M.T.', 'veronika.handayani@unpar.ac.id', '$2b$10$zTQgveG4XT3X16WPrIbJwurO5L.SnBlSbZ.BurueNV62EdDAASG1e', 'ADM001'),
  ('NID005', 'Dr. Bambang Kusuma, M.M.', 'bambang.kusuma@unpar.ac.id', '$2b$10$IK/ATlY3fMt3VPOeOZ/PmOLu7rS3EbTywqg9Qk.4/Bf5yPKJsx2qa', 'ADM002'),
  ('NID006', 'Ratna Dewanti, Ph.D.', 'ratna.dewanti@unpar.ac.id', '$2b$10$f725hFIYVxP/qPlC44lPfeHLzcgZleH77NMENnkVATRjI/d2sgdqq', 'ADM003');

INSERT INTO Mahasiswa (NPM, Nama, Email, Password, ID_Admin) VALUES
  ('6182401101', 'Aditya Pratama', 'aditya.pratama@student.unpar.ac.id', '$2b$10$FcrLt5o.J2zM.PqHcp3yyONJkqoKvzi7gsbnifyQJhSV7VnhzrcoW', 'ADM001'),
  ('6182401102', 'Bunga Maharani', 'bunga.maharani@student.unpar.ac.id', '$2b$10$aqd4nygxz.CsJQ/PXkLntegFLRSKS4R3WXJwl8DqEthljqrYrmz2O', 'ADM002'),
  ('6182401103', 'Cahya Wijaya', 'cahya.wijaya@student.unpar.ac.id', '$2b$10$k8L30lKUnvHXtQSAO11jJOnHJ.Ll4OLrk8NDB9m5akyfgh9or23Oq', 'ADM003'),
  ('6182401104', 'Dewi Lestari', 'dewi.lestari@student.unpar.ac.id', '$2b$10$qsgWe1.t/hp9e1OyAm4j2eVAUstnsEiIWdu8LF52cIvRycTWULWQS', 'ADM001'),
  ('6182401105', 'Eko Prasetyo', 'eko.prasetyo@student.unpar.ac.id', '$2b$10$982zwYficM.vx9Xx9UzTtuKYnF0cIsEFiO/9YHTnuiKgc.o8Qat92', 'ADM002'),
  ('6182401106', 'Farhan Alamsyah', 'farhan.alamsyah@student.unpar.ac.id', '$2b$10$YVlJCoFV1uaFXXYtjMOiWe7fMYuhiOu6dN9wyt1EQ/9B.UwoMfalu', 'ADM003'),
  ('6182401107', 'Gita Permata', 'gita.permata@student.unpar.ac.id', '$2b$10$m3JzK2OzuysGRqVdvqRyGe5HbamNyqAhzwPs8YD0ZzhHB/h0BpCfW', 'ADM001'),
  ('6182401108', 'Hendra Gunawan', 'hendra.gunawan@student.unpar.ac.id', '$2b$10$DYhvufrDu3lwWO8vnMIRC.Ewgq0KgnF5HH6Xv5MOh.ZOEZJPWwqmG', 'ADM002'),
  ('6182401109', 'Indah Puspita', 'indah.puspita@student.unpar.ac.id', '$2b$10$.vTBZvML./dcXi8YosgQoOhzOJC/ABMMJq.wXPQscUQ0d66iQVW/C', 'ADM003'),
  ('6182401110', 'Joko Santoso', 'joko.santoso@student.unpar.ac.id', '$2b$10$JqwXQjoL4u.qOrxPu1N.0uuE7iJd0Zntgk7.lwKqW6NZs1faAVHLy', 'ADM001'),
  ('6182401111', 'Kirana Anjani', 'kirana.anjani@student.unpar.ac.id', '$2b$10$W1mO72erle6Mtq0vSpoZTedhoi.Sg/3Ly8ZGyq7ylbiewG/xnJ98W', 'ADM002'),
  ('6182401112', 'Lukas Hartono', 'lukas.hartono@student.unpar.ac.id', '$2b$10$Z2lXLgHiAjj8x0Oqng2aB.B.djgbplJjJbwqxQ.yFDtdtNDluFXOa', 'ADM003'),
  ('6182401113', 'Maya Sari', 'maya.sari@student.unpar.ac.id', '$2b$10$iPQvpdd7VuriaJFzccbWZucOxiIkvGXpS8GFeWNjNqgrCgLaJqwPG', 'ADM001'),
  ('6182401114', 'Nadia Rahma', 'nadia.rahma@student.unpar.ac.id', '$2b$10$dYQprJ/41fUCaxzFlKruVO3WnmY/iqczkcPiDnvZ0SYnc9H7UqM8.', 'ADM002'),
  ('6182401115', 'Oscar Wibowo', 'oscar.wibowo@student.unpar.ac.id', '$2b$10$ye1fqWC/XDLEw7Uupp2YJ.W.ki60.mSSR2/Lv2.rI5wGRLDqLGULG', 'ADM003'),
  ('6182501101', 'Putri Ayu', 'putri.ayu@student.unpar.ac.id', '$2b$10$xbdoTwoVpJxoeaYaIwqID.dMc.x6ELxjZo6Cg1bQuzVOgSSXVPwGu', 'ADM001'),
  ('6182501102', 'Qori Ramadhan', 'qori.ramadhan@student.unpar.ac.id', '$2b$10$cCKdI9Vj90ASwDnLPPEY3e0Dp6ySo3AV.CvvTU3s9pxoEQt2NbDJC', 'ADM002'),
  ('6182501103', 'Rizky Firmansyah', 'rizky.firmansyah@student.unpar.ac.id', '$2b$10$ngiM5ttYwLTvjN9BeqlWL.q.x4l9ZBoU..iW9JmYAfkquFiH8bAvy', 'ADM003'),
  ('6182501104', 'Salsabila Putri', 'salsabila.putri@student.unpar.ac.id', '$2b$10$IcNokGKJCd6kqt6jSccHv.GBHFN4NzhCb87cJVufoR95wKYSEecuS', 'ADM001'),
  ('6182501105', 'Tegar Nugroho', 'tegar.nugroho@student.unpar.ac.id', '$2b$10$gBT2G4veK3cwCbvHBRS.NOrn232GOq.oIm2u/kZf8OZArjgGUnBV6', 'ADM002'),
  ('6182501106', 'Ursula Maria', 'ursula.maria@student.unpar.ac.id', '$2b$10$HecQFdH0vPpBBD3QhPX/TOkL1rul2JB.HJrssAgm8VREDg0g.2rT2', 'ADM003'),
  ('6182501107', 'Vino Kurniawan', 'vino.kurniawan@student.unpar.ac.id', '$2b$10$GWAQ8R6m2JSPCW1K2Av0f.aRrjmnngrZ8jS9gvw9hdQWJQ5QGLezO', 'ADM001'),
  ('6182501108', 'Winda Safitri', 'winda.safitri@student.unpar.ac.id', '$2b$10$RQ2uhh3BdLH8hZMAFxn0POD9KVjoPDtF7Yu4hFLOPN7I6Rc5b6mFu', 'ADM002'),
  ('6182501109', 'Yoga Saputra', 'yoga.saputra@student.unpar.ac.id', '$2b$10$Vfh.hax1UkxZeKzbheF8q.PUhWwdh6isQWuQFNrRQJ7DuXKNuKGGC', 'ADM003'),
  ('6182501110', 'Zahra Amelia', 'zahra.amelia@student.unpar.ac.id', '$2b$10$M5ERQSWZ0RK4y2xVDqKVDObnHEzV5J0GIn6RQ0wrdaSQ0lZCMCutm', 'ADM001'),
  ('6182501111', 'Alvin Setiawan', 'alvin.setiawan@student.unpar.ac.id', '$2b$10$EOA3CKeoelz79P3RHJcSkeJjDOrJUtZV43zJ.5plOHGaEb2Is3LHe', 'ADM002'),
  ('6182501112', 'Bella Christina', 'bella.christina@student.unpar.ac.id', '$2b$10$AXyvctu/3aEQ2KeB9JX4e.2.0w.ODvKPAutZ6JWEGTsC9pxmHDL1q', 'ADM003'),
  ('6182501113', 'Clarissa Tan', 'clarissa.tan@student.unpar.ac.id', '$2b$10$alkZAeVAMHEevJq3O42OE.xhiTcoJlctTX6OJTGDHw15NGPOlDF.y', 'ADM001'),
  ('6182501114', 'Daniel Susanto', 'daniel.susanto@student.unpar.ac.id', '$2b$10$IR9.XUdDOrU4UGTlSXaVu.Rj5tq7XJsQn9qzM93FOt00eE8EZe4pm', 'ADM002'),
  ('6182501115', 'Evelyn Gunadi', 'evelyn.gunadi@student.unpar.ac.id', '$2b$10$q77kYNt0DaPxPhYhV81k4.bJtxPW2flcs29OpD9sHW/ugJrIvYGfS', 'ADM003');

INSERT INTO Mata_Kuliah (Kode_MK, Nama_MK, SKS) VALUES
  ('AIF233101', 'Rekayasa Perangkat Lunak', 3),
  ('AIF233201', 'Pemrograman Berbasis Web', 3),
  ('AIF233301', 'Kecerdasan Buatan', 3),
  ('AIF233401', 'Desain Antarmuka Grafis', 3),
  ('AIF233501', 'Manajemen Proyek', 2),
  ('AIF233601', 'Visualisasi Data', 3);

INSERT INTO Kelas (ID_Kelas, Nama_Kelas, Semester, Kode_MK, NID) VALUES
  ('AIF233101-A', 'A', 'Ganjil 2026/2027', 'AIF233101', 'NID001'),
  ('AIF233101-B', 'B', 'Ganjil 2026/2027', 'AIF233101', 'NID001'),
  ('AIF233201-A', 'A', 'Ganjil 2026/2027', 'AIF233201', 'NID002'),
  ('AIF233201-B', 'B', 'Ganjil 2026/2027', 'AIF233201', 'NID002'),
  ('AIF233301-A', 'A', 'Ganjil 2026/2027', 'AIF233301', 'NID003'),
  ('AIF233301-B', 'B', 'Ganjil 2026/2027', 'AIF233301', 'NID003'),
  ('AIF233401-A', 'A', 'Ganjil 2026/2027', 'AIF233401', 'NID004'),
  ('AIF233401-B', 'B', 'Ganjil 2026/2027', 'AIF233401', 'NID004'),
  ('AIF233501-A', 'A', 'Ganjil 2026/2027', 'AIF233501', 'NID005'),
  ('AIF233501-B', 'B', 'Ganjil 2026/2027', 'AIF233501', 'NID005'),
  ('AIF233601-A', 'A', 'Ganjil 2026/2027', 'AIF233601', 'NID006'),
  ('AIF233601-B', 'B', 'Ganjil 2026/2027', 'AIF233601', 'NID006');

INSERT INTO Jadwal_Kuliah (ID_Jadwal_Kuliah, Hari, Ruangan, Jam_Mulai, Jam_Selesai, ID_Kelas) VALUES
  ('JK001', 'Senin', '9211', '14:50:00', '16:30:00', 'AIF233101-A'),
  ('JK002', 'Rabu', '9111', '07:00:00', '08:40:00', 'AIF233101-A'),
  ('JK003', 'Jumat', '9211', '14:50:00', '16:30:00', 'AIF233101-B'),
  ('JK004', 'Kamis', '9212', '13:00:00', '14:40:00', 'AIF233101-B'),
  ('JK005', 'Kamis', '9212', '07:00:00', '08:40:00', 'AIF233201-A'),
  ('JK006', 'Selasa', '9017', '07:00:00', '08:40:00', 'AIF233201-A'),
  ('JK007', 'Rabu', '9016', '13:00:00', '14:40:00', 'AIF233201-B'),
  ('JK008', 'Senin', '9113', '13:00:00', '14:40:00', 'AIF233201-B'),
  ('JK009', 'Selasa', '9113', '10:40:00', '12:20:00', 'AIF233301-A'),
  ('JK010', 'Kamis', '9114', '10:40:00', '12:20:00', 'AIF233301-A'),
  ('JK011', 'Jumat', '9017', '10:40:00', '12:20:00', 'AIF233301-B'),
  ('JK012', 'Senin', '9212', '14:50:00', '16:30:00', 'AIF233301-B'),
  ('JK013', 'Rabu', '9111', '13:00:00', '14:40:00', 'AIF233401-A'),
  ('JK014', 'Jumat', '9112', '14:50:00', '16:30:00', 'AIF233401-A'),
  ('JK015', 'Senin', '9115', '10:40:00', '12:20:00', 'AIF233401-B'),
  ('JK016', 'Rabu', '9115', '07:00:00', '08:40:00', 'AIF233401-B'),
  ('JK017', 'Jumat', '9114', '07:00:00', '08:40:00', 'AIF233501-A'),
  ('JK018', 'Kamis', '9212', '14:50:00', '16:30:00', 'AIF233501-A'),
  ('JK019', 'Kamis', '9115', '10:40:00', '12:20:00', 'AIF233501-B'),
  ('JK020', 'Jumat', '9212', '14:50:00', '16:30:00', 'AIF233501-B'),
  ('JK021', 'Jumat', '9017', '14:50:00', '16:30:00', 'AIF233601-A'),
  ('JK022', 'Senin', '9016', '08:50:00', '10:30:00', 'AIF233601-A'),
  ('JK023', 'Jumat', '9115', '13:00:00', '14:40:00', 'AIF233601-B'),
  ('JK024', 'Senin', '9111', '13:00:00', '14:40:00', 'AIF233601-B');

INSERT INTO Jadwal_Ujian (ID_Jadwal_Ujian, Jenis_Ujian, Tanggal_Ujian, Jam_Mulai, Jam_Selesai, ID_Kelas) VALUES
  ('JU001', 'UTS', '2026-10-12', '08:00:00', '10:00:00', 'AIF233101-A'),
  ('JU002', 'UAS', '2026-12-11', '10:30:00', '12:30:00', 'AIF233101-A'),
  ('JU003', 'UTS', '2026-10-12', '08:00:00', '10:00:00', 'AIF233101-B'),
  ('JU004', 'UAS', '2026-12-11', '10:30:00', '12:30:00', 'AIF233101-B'),
  ('JU005', 'UTS', '2026-10-14', '08:00:00', '10:00:00', 'AIF233201-A'),
  ('JU006', 'UAS', '2026-12-09', '10:30:00', '12:30:00', 'AIF233201-A'),
  ('JU007', 'UTS', '2026-10-14', '08:00:00', '10:00:00', 'AIF233201-B'),
  ('JU008', 'UAS', '2026-12-09', '10:30:00', '12:30:00', 'AIF233201-B'),
  ('JU009', 'UTS', '2026-10-15', '13:30:00', '15:30:00', 'AIF233301-A'),
  ('JU010', 'UAS', '2026-12-10', '08:00:00', '10:00:00', 'AIF233301-A'),
  ('JU011', 'UTS', '2026-10-15', '13:30:00', '15:30:00', 'AIF233301-B'),
  ('JU012', 'UAS', '2026-12-10', '08:00:00', '10:00:00', 'AIF233301-B'),
  ('JU013', 'UTS', '2026-10-13', '10:30:00', '12:30:00', 'AIF233401-A'),
  ('JU014', 'UAS', '2026-12-08', '13:30:00', '15:30:00', 'AIF233401-A'),
  ('JU015', 'UTS', '2026-10-13', '10:30:00', '12:30:00', 'AIF233401-B'),
  ('JU016', 'UAS', '2026-12-08', '13:30:00', '15:30:00', 'AIF233401-B'),
  ('JU017', 'UTS', '2026-10-12', '13:30:00', '15:30:00', 'AIF233501-A'),
  ('JU018', 'UAS', '2026-12-10', '13:30:00', '15:30:00', 'AIF233501-A'),
  ('JU019', 'UTS', '2026-10-12', '13:30:00', '15:30:00', 'AIF233501-B'),
  ('JU020', 'UAS', '2026-12-10', '13:30:00', '15:30:00', 'AIF233501-B'),
  ('JU021', 'UTS', '2026-10-16', '10:30:00', '12:30:00', 'AIF233601-A'),
  ('JU022', 'UAS', '2026-12-07', '08:00:00', '10:00:00', 'AIF233601-A'),
  ('JU023', 'UTS', '2026-10-16', '10:30:00', '12:30:00', 'AIF233601-B'),
  ('JU024', 'UAS', '2026-12-07', '08:00:00', '10:00:00', 'AIF233601-B');

INSERT INTO Jadwal_Pengawas_Ujian (ID_Pengawas, Tanggal, Jam_Mulai, Jam_Selesai, NID) VALUES
  ('PW001', '2026-10-13', '10:30:00', '12:30:00', 'NID001'),
  ('PW002', '2026-12-09', '10:30:00', '12:30:00', 'NID001'),
  ('PW003', '2026-12-07', '08:00:00', '10:00:00', 'NID001'),
  ('PW004', '2026-10-12', '08:00:00', '10:00:00', 'NID002'),
  ('PW005', '2026-12-08', '13:30:00', '15:30:00', 'NID002'),
  ('PW006', '2026-12-10', '13:30:00', '15:30:00', 'NID002'),
  ('PW007', '2026-10-14', '08:00:00', '10:00:00', 'NID003'),
  ('PW008', '2026-12-10', '13:30:00', '15:30:00', 'NID003'),
  ('PW009', '2026-12-10', '08:00:00', '10:00:00', 'NID003'),
  ('PW010', '2026-10-13', '10:30:00', '12:30:00', 'NID004'),
  ('PW011', '2026-12-08', '13:30:00', '15:30:00', 'NID004'),
  ('PW012', '2026-12-09', '10:30:00', '12:30:00', 'NID004'),
  ('PW013', '2026-10-16', '10:30:00', '12:30:00', 'NID005'),
  ('PW014', '2026-12-10', '08:00:00', '10:00:00', 'NID005'),
  ('PW015', '2026-12-11', '10:30:00', '12:30:00', 'NID005'),
  ('PW016', '2026-10-15', '13:30:00', '15:30:00', 'NID006'),
  ('PW017', '2026-12-10', '08:00:00', '10:00:00', 'NID006'),
  ('PW018', '2026-12-11', '10:30:00', '12:30:00', 'NID006');

INSERT INTO FRS_Mengambil (NPM, ID_Kelas) VALUES
  ('6182401101', 'AIF233301-A'),
  ('6182401101', 'AIF233601-A'),
  ('6182401101', 'AIF233401-B'),
  ('6182401102', 'AIF233601-A'),
  ('6182401102', 'AIF233401-B'),
  ('6182401102', 'AIF233301-B'),
  ('6182401102', 'AIF233201-A'),
  ('6182401103', 'AIF233401-B'),
  ('6182401103', 'AIF233101-B'),
  ('6182401103', 'AIF233501-A'),
  ('6182401103', 'AIF233601-B'),
  ('6182401103', 'AIF233201-A'),
  ('6182401104', 'AIF233601-A'),
  ('6182401104', 'AIF233301-B'),
  ('6182401104', 'AIF233201-B'),
  ('6182401104', 'AIF233401-B'),
  ('6182401105', 'AIF233101-A'),
  ('6182401105', 'AIF233401-A'),
  ('6182401105', 'AIF233201-A'),
  ('6182401105', 'AIF233601-B'),
  ('6182401105', 'AIF233501-A'),
  ('6182401106', 'AIF233101-A'),
  ('6182401106', 'AIF233401-A'),
  ('6182401106', 'AIF233601-B'),
  ('6182401106', 'AIF233501-A'),
  ('6182401107', 'AIF233301-A'),
  ('6182401107', 'AIF233601-A'),
  ('6182401107', 'AIF233401-B'),
  ('6182401107', 'AIF233201-B'),
  ('6182401108', 'AIF233501-B'),
  ('6182401108', 'AIF233301-B'),
  ('6182401108', 'AIF233401-B'),
  ('6182401108', 'AIF233601-B'),
  ('6182401109', 'AIF233601-B'),
  ('6182401109', 'AIF233501-A'),
  ('6182401109', 'AIF233101-B'),
  ('6182401109', 'AIF233201-A'),
  ('6182401110', 'AIF233501-A'),
  ('6182401110', 'AIF233201-A'),
  ('6182401110', 'AIF233601-A'),
  ('6182401110', 'AIF233301-A'),
  ('6182401110', 'AIF233101-A'),
  ('6182401111', 'AIF233301-A'),
  ('6182401111', 'AIF233201-A'),
  ('6182401111', 'AIF233601-A'),
  ('6182401111', 'AIF233101-A'),
  ('6182401111', 'AIF233501-A'),
  ('6182401112', 'AIF233301-A'),
  ('6182401112', 'AIF233501-A'),
  ('6182401112', 'AIF233401-B'),
  ('6182401112', 'AIF233201-B'),
  ('6182401112', 'AIF233101-B'),
  ('6182401113', 'AIF233401-B'),
  ('6182401113', 'AIF233301-B'),
  ('6182401113', 'AIF233601-A'),
  ('6182401113', 'AIF233501-A'),
  ('6182401114', 'AIF233501-B'),
  ('6182401114', 'AIF233601-B'),
  ('6182401114', 'AIF233201-A'),
  ('6182401114', 'AIF233101-A'),
  ('6182401115', 'AIF233101-A'),
  ('6182401115', 'AIF233401-A'),
  ('6182401115', 'AIF233201-A'),
  ('6182401115', 'AIF233601-B'),
  ('6182401115', 'AIF233301-A'),
  ('6182501101', 'AIF233301-A'),
  ('6182501101', 'AIF233601-B'),
  ('6182501101', 'AIF233201-A'),
  ('6182501101', 'AIF233401-A'),
  ('6182501102', 'AIF233401-B'),
  ('6182501102', 'AIF233101-B'),
  ('6182501102', 'AIF233501-A'),
  ('6182501102', 'AIF233601-B'),
  ('6182501102', 'AIF233301-A'),
  ('6182501103', 'AIF233401-B'),
  ('6182501103', 'AIF233501-A'),
  ('6182501103', 'AIF233101-B'),
  ('6182501103', 'AIF233201-B'),
  ('6182501103', 'AIF233301-A'),
  ('6182501104', 'AIF233401-B'),
  ('6182501104', 'AIF233301-A'),
  ('6182501104', 'AIF233501-A'),
  ('6182501104', 'AIF233101-B'),
  ('6182501104', 'AIF233201-B'),
  ('6182501105', 'AIF233401-B'),
  ('6182501105', 'AIF233301-B'),
  ('6182501105', 'AIF233101-B'),
  ('6182501105', 'AIF233501-A'),
  ('6182501105', 'AIF233201-B'),
  ('6182501106', 'AIF233101-A'),
  ('6182501106', 'AIF233201-B'),
  ('6182501106', 'AIF233301-A'),
  ('6182501107', 'AIF233401-B'),
  ('6182501107', 'AIF233601-B'),
  ('6182501107', 'AIF233501-B'),
  ('6182501107', 'AIF233201-A'),
  ('6182501108', 'AIF233201-A'),
  ('6182501108', 'AIF233601-A'),
  ('6182501108', 'AIF233101-A'),
  ('6182501108', 'AIF233501-A'),
  ('6182501109', 'AIF233201-A'),
  ('6182501109', 'AIF233501-A'),
  ('6182501109', 'AIF233101-A'),
  ('6182501109', 'AIF233301-A'),
  ('6182501110', 'AIF233601-B'),
  ('6182501110', 'AIF233201-A'),
  ('6182501110', 'AIF233401-A'),
  ('6182501110', 'AIF233101-A'),
  ('6182501111', 'AIF233501-A'),
  ('6182501111', 'AIF233301-A'),
  ('6182501111', 'AIF233601-A'),
  ('6182501111', 'AIF233101-A'),
  ('6182501111', 'AIF233201-A'),
  ('6182501112', 'AIF233201-A'),
  ('6182501112', 'AIF233401-A'),
  ('6182501112', 'AIF233601-B'),
  ('6182501112', 'AIF233501-A'),
  ('6182501112', 'AIF233101-A'),
  ('6182501113', 'AIF233301-B'),
  ('6182501113', 'AIF233501-B'),
  ('6182501113', 'AIF233601-B'),
  ('6182501113', 'AIF233401-B'),
  ('6182501114', 'AIF233501-B'),
  ('6182501114', 'AIF233601-B'),
  ('6182501114', 'AIF233201-A'),
  ('6182501114', 'AIF233301-B'),
  ('6182501115', 'AIF233101-A'),
  ('6182501115', 'AIF233501-A'),
  ('6182501115', 'AIF233201-A'),
  ('6182501115', 'AIF233601-B'),
  ('6182501115', 'AIF233401-A');

INSERT INTO Tugas_Besar (ID_Tugas_Besar, Kode_MK, Semester, Kuota, Durasi_Presentasi) VALUES
  ('TB01', 'AIF233101', 'Ganjil 2026/2027', 5, 30),
  ('TB02', 'AIF233201', 'Ganjil 2026/2027', 5, 25),
  ('TB03', 'AIF233301', 'Ganjil 2026/2027', 5, 20),
  ('TB04', 'AIF233401', 'Ganjil 2026/2027', 5, 30),
  ('TB05', 'AIF233501', 'Ganjil 2026/2027', 4, 20),
  ('TB06', 'AIF233601', 'Ganjil 2026/2027', 5, 25);

INSERT INTO Kelompok (ID_Kelompok, Nama_Kelompok, ID_Tugas_Besar) VALUES
  ('KLP-RPL-01', 'Kelompok 1', 'TB01'),
  ('KLP-RPL-02', 'Kelompok 2', 'TB01'),
  ('KLP-RPL-03', 'Kelompok 3', 'TB01'),
  ('KLP-RPL-04', 'Kelompok 4', 'TB01'),
  ('KLP-PBW-01', 'Kelompok 1', 'TB02'),
  ('KLP-PBW-02', 'Kelompok 2', 'TB02'),
  ('KLP-PBW-03', 'Kelompok 3', 'TB02'),
  ('KLP-PBW-04', 'Kelompok 4', 'TB02'),
  ('KLP-PBW-05', 'Kelompok 5', 'TB02'),
  ('KLP-KB-01', 'Kelompok 1', 'TB03'),
  ('KLP-KB-02', 'Kelompok 2', 'TB03'),
  ('KLP-KB-03', 'Kelompok 3', 'TB03'),
  ('KLP-KB-04', 'Kelompok 4', 'TB03'),
  ('KLP-DAG-01', 'Kelompok 1', 'TB04'),
  ('KLP-DAG-02', 'Kelompok 2', 'TB04'),
  ('KLP-DAG-03', 'Kelompok 3', 'TB04'),
  ('KLP-DAG-04', 'Kelompok 4', 'TB04'),
  ('KLP-MP-01', 'Kelompok 1', 'TB05'),
  ('KLP-MP-02', 'Kelompok 2', 'TB05'),
  ('KLP-MP-03', 'Kelompok 3', 'TB05'),
  ('KLP-MP-04', 'Kelompok 4', 'TB05'),
  ('KLP-MP-05', 'Kelompok 5', 'TB05'),
  ('KLP-VD-01', 'Kelompok 1', 'TB06'),
  ('KLP-VD-02', 'Kelompok 2', 'TB06'),
  ('KLP-VD-03', 'Kelompok 3', 'TB06'),
  ('KLP-VD-04', 'Kelompok 4', 'TB06'),
  ('KLP-VD-05', 'Kelompok 5', 'TB06');

INSERT INTO Anggota_Kelompok (ID_Kelompok, NPM) VALUES
  ('KLP-RPL-01', '6182401109'),
  ('KLP-RPL-01', '6182501115'),
  ('KLP-RPL-01', '6182501102'),
  ('KLP-RPL-01', '6182401111'),
  ('KLP-RPL-01', '6182401105'),
  ('KLP-RPL-02', '6182401110'),
  ('KLP-RPL-02', '6182401114'),
  ('KLP-RPL-02', '6182501103'),
  ('KLP-RPL-02', '6182501112'),
  ('KLP-RPL-02', '6182501111'),
  ('KLP-RPL-03', '6182401106'),
  ('KLP-RPL-03', '6182401115'),
  ('KLP-RPL-03', '6182501110'),
  ('KLP-RPL-03', '6182501108'),
  ('KLP-RPL-04', '6182501105'),
  ('KLP-RPL-04', '6182501104'),
  ('KLP-RPL-04', '6182501106'),
  ('KLP-RPL-04', '6182501109'),
  ('KLP-PBW-01', '6182401107'),
  ('KLP-PBW-01', '6182501108'),
  ('KLP-PBW-01', '6182501105'),
  ('KLP-PBW-01', '6182501106'),
  ('KLP-PBW-01', '6182401111'),
  ('KLP-PBW-02', '6182501114'),
  ('KLP-PBW-02', '6182401115'),
  ('KLP-PBW-02', '6182401109'),
  ('KLP-PBW-02', '6182401103'),
  ('KLP-PBW-02', '6182501104'),
  ('KLP-PBW-03', '6182401105'),
  ('KLP-PBW-03', '6182501103'),
  ('KLP-PBW-03', '6182501115'),
  ('KLP-PBW-03', '6182501109'),
  ('KLP-PBW-04', '6182401112'),
  ('KLP-PBW-04', '6182401110'),
  ('KLP-PBW-04', '6182401114'),
  ('KLP-PBW-04', '6182501110'),
  ('KLP-PBW-05', '6182401104'),
  ('KLP-PBW-05', '6182501101'),
  ('KLP-PBW-05', '6182401102'),
  ('KLP-PBW-05', '6182501111'),
  ('KLP-KB-01', '6182401108'),
  ('KLP-KB-01', '6182501104'),
  ('KLP-KB-01', '6182401115'),
  ('KLP-KB-01', '6182401104'),
  ('KLP-KB-01', '6182501103'),
  ('KLP-KB-02', '6182401111'),
  ('KLP-KB-02', '6182401101'),
  ('KLP-KB-02', '6182401102'),
  ('KLP-KB-02', '6182501113'),
  ('KLP-KB-02', '6182401112'),
  ('KLP-KB-03', '6182501101'),
  ('KLP-KB-03', '6182401110'),
  ('KLP-KB-03', '6182501109'),
  ('KLP-KB-03', '6182501105'),
  ('KLP-KB-04', '6182401113'),
  ('KLP-KB-04', '6182501114'),
  ('KLP-KB-04', '6182501111'),
  ('KLP-KB-04', '6182501106'),
  ('KLP-DAG-01', '6182401101'),
  ('KLP-DAG-01', '6182401113'),
  ('KLP-DAG-01', '6182401105'),
  ('KLP-DAG-01', '6182401112'),
  ('KLP-DAG-01', '6182401102'),
  ('KLP-DAG-02', '6182501112'),
  ('KLP-DAG-02', '6182501102'),
  ('KLP-DAG-02', '6182401104'),
  ('KLP-DAG-02', '6182401103'),
  ('KLP-DAG-02', '6182501115'),
  ('KLP-DAG-03', '6182401107'),
  ('KLP-DAG-03', '6182401108'),
  ('KLP-DAG-03', '6182501105'),
  ('KLP-DAG-03', '6182501101'),
  ('KLP-DAG-03', '6182501104'),
  ('KLP-DAG-04', '6182501110'),
  ('KLP-DAG-04', '6182501113'),
  ('KLP-DAG-04', '6182501107'),
  ('KLP-DAG-04', '6182501103'),
  ('KLP-MP-01', '6182501113'),
  ('KLP-MP-01', '6182401103'),
  ('KLP-MP-01', '6182401108'),
  ('KLP-MP-01', '6182501114'),
  ('KLP-MP-02', '6182401114'),
  ('KLP-MP-02', '6182501103'),
  ('KLP-MP-02', '6182401113'),
  ('KLP-MP-02', '6182401106'),
  ('KLP-MP-03', '6182501102'),
  ('KLP-MP-03', '6182401112'),
  ('KLP-MP-03', '6182501111'),
  ('KLP-MP-03', '6182501108'),
  ('KLP-MP-04', '6182401105'),
  ('KLP-MP-04', '6182401110'),
  ('KLP-MP-04', '6182501109'),
  ('KLP-MP-04', '6182501105'),
  ('KLP-MP-05', '6182501115'),
  ('KLP-MP-05', '6182501107'),
  ('KLP-MP-05', '6182401109'),
  ('KLP-MP-05', '6182401111'),
  ('KLP-VD-01', '6182501102'),
  ('KLP-VD-01', '6182401103'),
  ('KLP-VD-01', '6182501114'),
  ('KLP-VD-01', '6182501111'),
  ('KLP-VD-01', '6182401105'),
  ('KLP-VD-02', '6182401115'),
  ('KLP-VD-02', '6182501112'),
  ('KLP-VD-02', '6182401108'),
  ('KLP-VD-02', '6182401102'),
  ('KLP-VD-02', '6182501107'),
  ('KLP-VD-03', '6182401107'),
  ('KLP-VD-03', '6182401111'),
  ('KLP-VD-03', '6182401106'),
  ('KLP-VD-03', '6182401113'),
  ('KLP-VD-04', '6182501113'),
  ('KLP-VD-04', '6182401101'),
  ('KLP-VD-04', '6182501115'),
  ('KLP-VD-04', '6182401114'),
  ('KLP-VD-05', '6182501101'),
  ('KLP-VD-05', '6182501110'),
  ('KLP-VD-05', '6182401110'),
  ('KLP-VD-05', '6182401109');

INSERT INTO Presentasi (ID_Presentasi, Tanggal, Jam_Mulai, Jam_Selesai, Ruangan, ID_Kelompok, NID) VALUES
  ('PR001', '2026-11-23', '07:00:00', '07:30:00', '9018', 'KLP-RPL-01', 'NID001'),
  ('PR002', '2026-11-24', '16:30:00', '17:00:00', '9211', 'KLP-DAG-02', 'NID004'),
  ('PR003', '2026-11-25', '09:00:00', '09:30:00', '9018', 'KLP-DAG-01', 'NID004'),
  ('PR004', '2026-11-25', '16:30:00', '16:50:00', '9114', 'KLP-MP-01', 'NID005'),
  ('PR005', '2026-11-26', '09:30:00', '09:55:00', '9111', 'KLP-PBW-04', 'NID002'),
  ('PR006', '2026-11-30', '08:30:00', '08:50:00', '9212', 'KLP-MP-04', 'NID005'),
  ('PR007', '2026-12-01', '12:30:00', '12:55:00', '9115', 'KLP-VD-02', 'NID006'),
  ('PR008', '2026-12-02', '15:00:00', '15:20:00', '9115', 'KLP-KB-03', 'NID003'),
  ('PR009', '2026-12-03', '09:30:00', '09:55:00', '9016', 'KLP-PBW-02', 'NID002'),
  ('PR010', '2026-12-03', '13:00:00', '13:25:00', '9211', 'KLP-PBW-05', 'NID002'),
  ('PR011', '2026-12-07', '10:00:00', '10:30:00', '9018', 'KLP-RPL-02', 'NID001'),
  ('PR012', '2026-12-07', '12:30:00', '12:50:00', '9212', 'KLP-KB-02', 'NID003'),
  ('PR013', '2026-12-09', '09:00:00', '09:20:00', '9111', 'KLP-KB-04', 'NID003'),
  ('PR014', '2026-12-11', '14:00:00', '14:25:00', '9113', 'KLP-VD-05', 'NID006'),
  ('PR015', '2026-12-11', '14:00:00', '14:30:00', '9111', 'KLP-DAG-03', 'NID004'),
  ('PR016', '2026-12-11', '14:30:00', '14:55:00', '9016', 'KLP-VD-04', 'NID006'),
  ('PR017', '2026-12-11', '15:00:00', '15:25:00', '9111', 'KLP-PBW-01', 'NID002');

-- ---------------------------------------------------------------------
--  VIEW (kemudahan query untuk halaman Informasi Kelompok & Jadwal)
-- ---------------------------------------------------------------------
CREATE VIEW V_Kelompok_Info AS
SELECT k.ID_Kelompok, k.Nama_Kelompok, k.ID_Tugas_Besar, tb.Kode_MK, mk.Nama_MK, tb.Kuota,
       COUNT(a.NPM)             AS Jumlah_Anggota,
       tb.Kuota - COUNT(a.NPM)  AS Sisa_Slot,
       CASE WHEN COUNT(a.NPM) >= tb.Kuota THEN 'Penuh' ELSE 'Tersedia' END AS Status
FROM Kelompok k
JOIN Tugas_Besar tb ON tb.ID_Tugas_Besar = k.ID_Tugas_Besar
JOIN Mata_Kuliah mk ON mk.Kode_MK = tb.Kode_MK
LEFT JOIN Anggota_Kelompok a ON a.ID_Kelompok = k.ID_Kelompok
GROUP BY k.ID_Kelompok, k.Nama_Kelompok, k.ID_Tugas_Besar, tb.Kode_MK, mk.Nama_MK, tb.Kuota;

CREATE VIEW V_Jadwal_Presentasi AS
SELECT p.ID_Presentasi, p.ID_Kelompok, k.Nama_Kelompok, tb.Kode_MK, mk.Nama_MK, p.Tanggal,
       ELT(WEEKDAY(p.Tanggal) + 1, 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') AS Hari,
       p.Jam_Mulai, p.Jam_Selesai, p.Ruangan, p.Terkunci, d.Nama AS Dosen_Penguji
FROM Presentasi p
JOIN Kelompok k     ON k.ID_Kelompok = p.ID_Kelompok
JOIN Tugas_Besar tb ON tb.ID_Tugas_Besar = k.ID_Tugas_Besar
JOIN Mata_Kuliah mk ON mk.Kode_MK = tb.Kode_MK
JOIN Dosen d        ON d.NID = p.NID;

-- ---------------------------------------------------------------------
--  TRIGGER: aturan bisnis bab 1 (dibuat setelah data terisi)
-- ---------------------------------------------------------------------
DELIMITER $$

-- FR-4.2.2/4.2.3: masuk kelompok. Cek: 1 kelompok per mata kuliah, jadwal belum dikunci, kuota.
CREATE TRIGGER trg_anggota_masuk BEFORE INSERT ON Anggota_Kelompok
FOR EACH ROW
BEGIN
  DECLARE v_tb VARCHAR(10);
  DECLARE v_kuota INT;
  DECLARE v_lain INT;
  DECLARE v_kunci INT;
  DECLARE v_jumlah INT;
  SELECT k.ID_Tugas_Besar, tb.Kuota INTO v_tb, v_kuota
    FROM Kelompok k JOIN Tugas_Besar tb ON tb.ID_Tugas_Besar = k.ID_Tugas_Besar
   WHERE k.ID_Kelompok = NEW.ID_Kelompok;
  SELECT COUNT(*) INTO v_lain
    FROM Anggota_Kelompok a JOIN Kelompok k ON k.ID_Kelompok = a.ID_Kelompok
   WHERE a.NPM = NEW.NPM AND k.ID_Tugas_Besar = v_tb;
  IF v_lain > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mahasiswa sudah tergabung di kelompok pada mata kuliah yang sama';
  END IF;
  SELECT COUNT(*) INTO v_kunci FROM Presentasi WHERE ID_Kelompok = NEW.ID_Kelompok AND Terkunci = 1;
  IF v_kunci > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jadwal sudah dikunci oleh Dosen';
  END IF;
  SELECT COUNT(*) INTO v_jumlah FROM Anggota_Kelompok WHERE ID_Kelompok = NEW.ID_Kelompok;
  IF v_jumlah >= v_kuota THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kuota kelompok sudah penuh';
  END IF;
END$$

-- FR-4.2.4: keluar kelompok hanya boleh selama jadwal belum dikunci Dosen.
CREATE TRIGGER trg_anggota_keluar BEFORE DELETE ON Anggota_Kelompok
FOR EACH ROW
BEGIN
  DECLARE v_kunci INT;
  SELECT COUNT(*) INTO v_kunci FROM Presentasi WHERE ID_Kelompok = OLD.ID_Kelompok AND Terkunci = 1;
  IF v_kunci > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jadwal sudah dikunci oleh Dosen';
  END IF;
END$$

-- FR-4.4.4: durasi sama untuk satu mata kuliah + tidak boleh bentrok antar kelompok se-mata kuliah.
CREATE TRIGGER trg_presentasi_tambah BEFORE INSERT ON Presentasi
FOR EACH ROW
BEGIN
  DECLARE v_tb VARCHAR(10);
  DECLARE v_durasi INT;
  DECLARE v_bentrok INT;
  SELECT k.ID_Tugas_Besar, tb.Durasi_Presentasi INTO v_tb, v_durasi
    FROM Kelompok k JOIN Tugas_Besar tb ON tb.ID_Tugas_Besar = k.ID_Tugas_Besar
   WHERE k.ID_Kelompok = NEW.ID_Kelompok;
  IF (TIME_TO_SEC(NEW.Jam_Selesai) - TIME_TO_SEC(NEW.Jam_Mulai)) / 60 <> v_durasi THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Durasi presentasi harus sama dengan durasi tugas besar mata kuliah ini';
  END IF;
  SELECT COUNT(*) INTO v_bentrok
    FROM Presentasi p JOIN Kelompok k ON k.ID_Kelompok = p.ID_Kelompok
   WHERE k.ID_Tugas_Besar = v_tb AND p.Tanggal = NEW.Tanggal
     AND NEW.Jam_Mulai < p.Jam_Selesai AND NEW.Jam_Selesai > p.Jam_Mulai;
  IF v_bentrok > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot bentrok dengan presentasi kelompok lain pada mata kuliah yang sama';
  END IF;
END$$

CREATE TRIGGER trg_presentasi_ubah BEFORE UPDATE ON Presentasi
FOR EACH ROW
BEGIN
  DECLARE v_tb VARCHAR(10);
  DECLARE v_durasi INT;
  DECLARE v_bentrok INT;
  IF OLD.Terkunci = 1 AND NEW.Terkunci = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jadwal sudah dikunci oleh Dosen. Buka kunci terlebih dahulu untuk mengubah';
  END IF;
  SELECT k.ID_Tugas_Besar, tb.Durasi_Presentasi INTO v_tb, v_durasi
    FROM Kelompok k JOIN Tugas_Besar tb ON tb.ID_Tugas_Besar = k.ID_Tugas_Besar
   WHERE k.ID_Kelompok = NEW.ID_Kelompok;
  IF (TIME_TO_SEC(NEW.Jam_Selesai) - TIME_TO_SEC(NEW.Jam_Mulai)) / 60 <> v_durasi THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Durasi presentasi harus sama dengan durasi tugas besar mata kuliah ini';
  END IF;
  SELECT COUNT(*) INTO v_bentrok
    FROM Presentasi p JOIN Kelompok k ON k.ID_Kelompok = p.ID_Kelompok
   WHERE k.ID_Tugas_Besar = v_tb AND p.Tanggal = NEW.Tanggal AND p.ID_Presentasi <> NEW.ID_Presentasi
     AND NEW.Jam_Mulai < p.Jam_Selesai AND NEW.Jam_Selesai > p.Jam_Mulai;
  IF v_bentrok > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot bentrok dengan presentasi kelompok lain pada mata kuliah yang sama';
  END IF;
END$$

DELIMITER ;

-- Simulasi Dosen mengunci / membuka jadwal sebuah kelompok:
-- UPDATE Presentasi SET Terkunci = 1 WHERE ID_Kelompok = 'KLP-RPL-01';
-- UPDATE Presentasi SET Terkunci = 0 WHERE ID_Kelompok = 'KLP-RPL-01';
