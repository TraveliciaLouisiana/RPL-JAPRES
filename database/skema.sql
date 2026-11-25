-- JAPRES - skema.sql

DROP TABLE IF EXISTS presentasi            CASCADE;
DROP TABLE IF EXISTS anggota_kelompok      CASCADE;
DROP TABLE IF EXISTS kelompok              CASCADE;
DROP TABLE IF EXISTS tugas_besar           CASCADE;
DROP TABLE IF EXISTS frs_mengambil         CASCADE;
DROP TABLE IF EXISTS jadwal_pengawas_ujian CASCADE;
DROP TABLE IF EXISTS jadwal_ujian          CASCADE;
DROP TABLE IF EXISTS jadwal_kuliah         CASCADE;
DROP TABLE IF EXISTS kelas                 CASCADE;
DROP TABLE IF EXISTS mata_kuliah           CASCADE;
DROP TABLE IF EXISTS mahasiswa             CASCADE;
DROP TABLE IF EXISTS dosen                 CASCADE;
DROP TABLE IF EXISTS admin                 CASCADE;

CREATE TABLE admin (
    id_admin   VARCHAR(10)  PRIMARY KEY,
    nama       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL
);

CREATE TABLE dosen (
    nid        VARCHAR(20)  PRIMARY KEY,
    nama       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    id_admin   VARCHAR(10)  NOT NULL REFERENCES admin(id_admin)
);

CREATE TABLE mahasiswa (
    npm        VARCHAR(10)  PRIMARY KEY,
    nama       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    id_admin   VARCHAR(10)  NOT NULL REFERENCES admin(id_admin)
);

CREATE TABLE mata_kuliah (
    kode_mk    VARCHAR(10)  PRIMARY KEY,
    nama_mk    VARCHAR(100) NOT NULL,
    sks        INT          NOT NULL CHECK (sks BETWEEN 1 AND 9)
);

CREATE TABLE kelas (
    id_kelas   VARCHAR(20)  PRIMARY KEY,
    nama_kelas VARCHAR(10)  NOT NULL,
    semester   VARCHAR(20)  NOT NULL,
    kode_mk    VARCHAR(10)  NOT NULL REFERENCES mata_kuliah(kode_mk),
    nid        VARCHAR(20)  NOT NULL REFERENCES dosen(nid)
);

CREATE TABLE jadwal_kuliah (
    id_jadwal_kuliah VARCHAR(10) PRIMARY KEY,
    hari        VARCHAR(10) NOT NULL,
    ruangan     VARCHAR(10) NOT NULL,
    jam_mulai   TIME        NOT NULL,
    jam_selesai TIME        NOT NULL,
    id_kelas    VARCHAR(20) NOT NULL REFERENCES kelas(id_kelas),
    CHECK (jam_selesai > jam_mulai)
);

CREATE TABLE jadwal_ujian (
    id_jadwal_ujian VARCHAR(10) PRIMARY KEY,
    jenis_ujian   VARCHAR(5)  NOT NULL CHECK (jenis_ujian IN ('UTS','UAS')),
    tanggal_ujian DATE        NOT NULL,
    jam_mulai     TIME        NOT NULL,
    jam_selesai   TIME        NOT NULL,
    id_kelas      VARCHAR(20) NOT NULL REFERENCES kelas(id_kelas),
    CHECK (jam_selesai > jam_mulai)
);

CREATE TABLE jadwal_pengawas_ujian (
    id_pengawas VARCHAR(10) PRIMARY KEY,
    tanggal     DATE        NOT NULL,
    jam_mulai   TIME        NOT NULL,
    jam_selesai TIME        NOT NULL,
    nid         VARCHAR(20) NOT NULL REFERENCES dosen(nid),
    CHECK (jam_selesai > jam_mulai)
);

CREATE TABLE frs_mengambil (
    npm      VARCHAR(10) NOT NULL REFERENCES mahasiswa(npm),
    id_kelas VARCHAR(20) NOT NULL REFERENCES kelas(id_kelas),
    PRIMARY KEY (npm, id_kelas)
);

CREATE TABLE tugas_besar (
    id_tugas_besar    VARCHAR(10) PRIMARY KEY,
    kode_mk           VARCHAR(10) NOT NULL REFERENCES mata_kuliah(kode_mk),
    semester          VARCHAR(20) NOT NULL,
    kuota             INT         NOT NULL CHECK (kuota > 0),
    durasi_presentasi INT         NOT NULL CHECK (durasi_presentasi > 0),  -- menit
    UNIQUE (kode_mk, semester)   -- satu mata kuliah cukup satu tugas besar per semester
);

CREATE TABLE kelompok (
    id_kelompok    VARCHAR(15) PRIMARY KEY,
    nama_kelompok  VARCHAR(30) NOT NULL,
    id_tugas_besar VARCHAR(10) NOT NULL REFERENCES tugas_besar(id_tugas_besar)
);

CREATE TABLE anggota_kelompok (
    id_kelompok VARCHAR(15) NOT NULL REFERENCES kelompok(id_kelompok),
    npm         VARCHAR(10) NOT NULL REFERENCES mahasiswa(npm),
    PRIMARY KEY (id_kelompok, npm)
);

CREATE TABLE presentasi (
    id_presentasi VARCHAR(10) PRIMARY KEY,
    tanggal       DATE        NOT NULL,
    jam_mulai     TIME        NOT NULL,
    jam_selesai   TIME        NOT NULL,
    ruangan       VARCHAR(10) NOT NULL,
    id_kelompok   VARCHAR(15) NOT NULL UNIQUE REFERENCES kelompok(id_kelompok),  -- 1 kelompok = 1 jadwal
    nid           VARCHAR(20) NOT NULL REFERENCES dosen(nid),
    CHECK (jam_selesai > jam_mulai)
);