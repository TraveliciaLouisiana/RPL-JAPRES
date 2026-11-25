package com.example.japres.portal;

import java.util.List;

/** Bentuk data (JSON) yang dikirim backend ke halaman mahasiswa. */
public final class PortalModels {

    private PortalModels() {}

    public record Profil(String npm, String nama, String email, String angkatan, String prodi, String status) {}

    /** Satu mata kuliah yang diambil mahasiswa (dari FRS) DAN punya tugas besar. */
    public record MataKuliah(String kode, String singkatan, String nama, int sks,
                             String kelas, String idKelas, String semester,
                             String idTugasBesar, int kuota, int durasi, boolean dikunci) {}

    public record JadwalKuliah(String hari, String mulai, String selesai, String ruangan,
                               String mataKuliah, String kelas, String dosen) {}

    public record Anggota(String npm, String nama) {}

    public record JadwalPresentasi(String hari, String tanggal, String tanggalIso,
                                   String mulai, String selesai, String ruangan, String dosen) {}

    public record Kelompok(String id, String nomor, String nama, List<Anggota> anggota, JadwalPresentasi jadwal) {}

    public record DataKelompok(String idTugasBesar, int kuota, boolean dikunci,
                               String idKelompokSaya, List<Kelompok> kelompok) {}
}
