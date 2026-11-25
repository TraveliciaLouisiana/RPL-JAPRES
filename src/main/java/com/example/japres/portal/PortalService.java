package com.example.japres.portal;

import com.example.japres.common.ApiException;
import com.example.japres.portal.PortalModels.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PortalService {

    private static final String[] HARI = {"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"};
    private static final String[] BULAN = {"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
            "Agustus", "September", "Oktober", "November", "Desember"};

    private final JdbcTemplate jdbc;

    public PortalService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------------ PROFIL

    public Profil profil(String npm) {
        List<Profil> hasil = jdbc.query("SELECT npm, nama, email FROM mahasiswa WHERE npm = ?",
                (rs, i) -> new Profil(rs.getString("npm"), rs.getString("nama"), rs.getString("email"),
                        angkatan(rs.getString("npm")), "Informatika", "Mahasiswa Aktif"),
                npm);
        if (hasil.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Data mahasiswa tidak ditemukan.");
        }
        return hasil.get(0);
    }

    // NPM 6182601002 -> digit ke-4 dan ke-5 ("26") = angkatan 2026
    private static String angkatan(String npm) {
        return npm != null && npm.length() >= 5 && npm.substring(3, 5).matches("\\d{2}")
                ? "20" + npm.substring(3, 5) : "-";
    }

    // ------------------------------------------------------------- MATA KULIAH

    /** Mata kuliah yang diambil mahasiswa di FRS dan memiliki tugas besar pada semester yang sama. */
    public List<MataKuliah> mataKuliah(String npm) {
        return jdbc.query("""
                SELECT mk.kode_mk, mk.nama_mk, mk.sks,
                       k.id_kelas, k.nama_kelas, k.semester,
                       tb.id_tugas_besar, tb.kuota, tb.durasi_presentasi, tb.dikunci
                FROM frs_mengambil f
                JOIN kelas k        ON k.id_kelas = f.id_kelas
                JOIN mata_kuliah mk ON mk.kode_mk = k.kode_mk
                JOIN tugas_besar tb ON tb.kode_mk = k.kode_mk AND tb.semester = k.semester
                WHERE f.npm = ?
                ORDER BY mk.kode_mk
                """,
                (rs, i) -> new MataKuliah(
                        rs.getString("kode_mk"), singkatan(rs.getString("nama_mk")), rs.getString("nama_mk"),
                        rs.getInt("sks"), rs.getString("nama_kelas"), rs.getString("id_kelas"),
                        rs.getString("semester"), rs.getString("id_tugas_besar"),
                        rs.getInt("kuota"), rs.getInt("durasi_presentasi"), rs.getBoolean("dikunci")),
                npm);
    }

    /** "Rekayasa Perangkat Lunak" -> "RPL" */
    static String singkatan(String nama) {
        StringBuilder sb = new StringBuilder();
        for (String kata : nama.trim().split("\\s+")) {
            if (!kata.isEmpty()) sb.append(Character.toUpperCase(kata.charAt(0)));
        }
        return sb.toString();
    }

    private MataKuliah mkByKode(String npm, String kode) {
        return mataKuliah(npm).stream().filter(m -> m.kode().equals(kode)).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Anda tidak terdaftar pada mata kuliah ini."));
    }

    private MataKuliah mkByTugasBesar(String npm, String idTugasBesar) {
        return mataKuliah(npm).stream().filter(m -> m.idTugasBesar().equals(idTugasBesar)).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Anda tidak terdaftar pada mata kuliah ini."));
    }

    // ---------------------------------------------------------- JADWAL KULIAH

    public List<JadwalKuliah> jadwalKuliah(String npm) {
        return jdbc.query("""
                SELECT jk.hari, jk.ruangan, jk.jam_mulai, jk.jam_selesai,
                       mk.nama_mk, k.nama_kelas, d.nama AS dosen
                FROM frs_mengambil f
                JOIN kelas k          ON k.id_kelas = f.id_kelas
                JOIN jadwal_kuliah jk ON jk.id_kelas = k.id_kelas
                JOIN mata_kuliah mk   ON mk.kode_mk = k.kode_mk
                JOIN dosen d          ON d.nid = k.nid
                WHERE f.npm = ?
                ORDER BY jk.jam_mulai
                """,
                (rs, i) -> new JadwalKuliah(
                        rs.getString("hari"),
                        jam(rs.getObject("jam_mulai", LocalTime.class), ':'),
                        jam(rs.getObject("jam_selesai", LocalTime.class), ':'),
                        rs.getString("ruangan"), rs.getString("nama_mk"),
                        rs.getString("nama_kelas"), rs.getString("dosen")),
                npm);
    }

    // ---------------------------------------------------------------- KELOMPOK

    private record AnggotaRow(String idKelompok, Anggota anggota) {}
    private record PresentasiRow(String idKelompok, JadwalPresentasi jadwal) {}

    public DataKelompok kelompok(String npm, String kode) {
        MataKuliah mk = mkByKode(npm, kode);
        String tb = mk.idTugasBesar();

        List<String[]> daftar = jdbc.query(
                "SELECT id_kelompok, nama_kelompok FROM kelompok WHERE id_tugas_besar = ? ORDER BY id_kelompok",
                (rs, i) -> new String[]{rs.getString("id_kelompok"), rs.getString("nama_kelompok")}, tb);

        Map<String, List<Anggota>> anggota = jdbc.query("""
                SELECT ak.id_kelompok, m.npm, m.nama
                FROM anggota_kelompok ak
                JOIN kelompok kl  ON kl.id_kelompok = ak.id_kelompok
                JOIN mahasiswa m  ON m.npm = ak.npm
                WHERE kl.id_tugas_besar = ?
                ORDER BY m.nama
                """,
                (rs, i) -> new AnggotaRow(rs.getString("id_kelompok"), new Anggota(rs.getString("npm"), rs.getString("nama"))),
                tb).stream()
                .collect(Collectors.groupingBy(AnggotaRow::idKelompok, LinkedHashMap::new,
                        Collectors.mapping(AnggotaRow::anggota, Collectors.toList())));

        Map<String, JadwalPresentasi> jadwal = jdbc.query("""
                SELECT p.id_kelompok, p.tanggal, p.jam_mulai, p.jam_selesai, p.ruangan, d.nama AS dosen
                FROM presentasi p
                JOIN kelompok kl ON kl.id_kelompok = p.id_kelompok
                JOIN dosen d     ON d.nid = p.nid
                WHERE kl.id_tugas_besar = ?
                """,
                (rs, i) -> {
                    LocalDate tgl = rs.getObject("tanggal", LocalDate.class);
                    return new PresentasiRow(rs.getString("id_kelompok"), new JadwalPresentasi(
                            HARI[tgl.getDayOfWeek().getValue() - 1],
                            tgl.getDayOfMonth() + " " + BULAN[tgl.getMonthValue() - 1] + " " + tgl.getYear(),
                            tgl.toString(),
                            jam(rs.getObject("jam_mulai", LocalTime.class), '.'),
                            jam(rs.getObject("jam_selesai", LocalTime.class), '.'),
                            rs.getString("ruangan"), rs.getString("dosen")));
                },
                tb).stream().collect(Collectors.toMap(PresentasiRow::idKelompok, PresentasiRow::jadwal));

        List<Kelompok> hasil = new ArrayList<>();
        String idSaya = null;
        for (String[] k : daftar) {
            List<Anggota> a = anggota.getOrDefault(k[0], List.of());
            if (a.stream().anyMatch(x -> x.npm().equals(npm))) idSaya = k[0];
            hasil.add(new Kelompok(k[0], k[1].replaceFirst("(?i)^kelompok\\s*", ""), k[1], a, jadwal.get(k[0])));
        }
        return new DataKelompok(tb, mk.kuota(), cekDikunci(tb), idSaya, hasil);
    }

    /** Membuat kelompok baru; pembuatnya otomatis jadi anggota pertama. */
    @Transactional
    public Map<String, String> buatKelompok(String npm, String kode) {
        MataKuliah mk = mkByKode(npm, kode);
        String tb = mk.idTugasBesar();

        if (kunciTugasBesar(tb)) {
            throw new ApiException(HttpStatus.CONFLICT, "Dosen sudah mengunci jadwal, sehingga kelompok baru tidak dapat dibuat.");
        }
        if (sudahDiKelompok(npm, tb)) {
            throw new ApiException(HttpStatus.CONFLICT, "Anda sudah tergabung di sebuah kelompok untuk mata kuliah ini.");
        }

        Integer maks = jdbc.queryForObject("""
                SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(nama_kelompok, '\\D', '', 'g'), '') AS INTEGER)), 0)
                FROM kelompok WHERE id_tugas_besar = ?
                """, Integer.class, tb);
        int nomor = (maks == null ? 0 : maks) + 1;

        // Mengikuti pola data yang sudah ada: KLP-RPL-01. Kalau bentrok / terlalu panjang, pakai id tugas besar.
        String id = "KLP-" + mk.singkatan() + "-" + String.format("%02d", nomor);
        Integer sudahAda = jdbc.queryForObject("SELECT COUNT(*) FROM kelompok WHERE id_kelompok = ?", Integer.class, id);
        if (id.length() > 15 || (sudahAda != null && sudahAda > 0)) {
            id = "KLP-" + tb + "-" + String.format("%02d", nomor);
        }

        jdbc.update("INSERT INTO kelompok (id_kelompok, nama_kelompok, id_tugas_besar) VALUES (?, ?, ?)",
                id, "Kelompok " + nomor, tb);
        jdbc.update("INSERT INTO anggota_kelompok (id_kelompok, npm) VALUES (?, ?)", id, npm);
        return Map.of("idKelompok", id, "nomor", String.valueOf(nomor));
    }

    /** Masuk ke kelompok yang sudah ada. */
    @Transactional
    public void gabung(String npm, String idKelompok) {
        String tb = tugasBesarDariKelompok(idKelompok);
        MataKuliah mk = mkByTugasBesar(npm, tb);

        if (kunciTugasBesar(tb)) {
            throw new ApiException(HttpStatus.CONFLICT, "Dosen sudah mengunci jadwal, sehingga Anda tidak dapat masuk ke kelompok.");
        }
        if (sudahDiKelompok(npm, tb)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Anda sudah tergabung di sebuah kelompok. Setiap mahasiswa hanya dapat berada di maksimal 1 kelompok per mata kuliah.");
        }
        Integer jumlah = jdbc.queryForObject("SELECT COUNT(*) FROM anggota_kelompok WHERE id_kelompok = ?", Integer.class, idKelompok);
        if (jumlah != null && jumlah >= mk.kuota()) {
            throw new ApiException(HttpStatus.CONFLICT, "Kelompok ini sudah penuh (kuota " + mk.kuota() + " anggota).");
        }
        jdbc.update("INSERT INTO anggota_kelompok (id_kelompok, npm) VALUES (?, ?)", idKelompok, npm);
    }

    /** Keluar dari kelompok. Kelompok yang jadi kosong (dan belum punya jadwal presentasi) ikut dihapus. */
    @Transactional
    public void keluar(String npm, String idKelompok) {
        String tb = tugasBesarDariKelompok(idKelompok);

        if (kunciTugasBesar(tb)) {
            throw new ApiException(HttpStatus.CONFLICT, "Jadwal sudah dikunci oleh Dosen, sehingga Anda tidak dapat keluar dari kelompok.");
        }
        int terhapus = jdbc.update("DELETE FROM anggota_kelompok WHERE id_kelompok = ? AND npm = ?", idKelompok, npm);
        if (terhapus == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Anda bukan anggota kelompok ini.");
        }
        Integer sisa = jdbc.queryForObject("SELECT COUNT(*) FROM anggota_kelompok WHERE id_kelompok = ?", Integer.class, idKelompok);
        Integer presentasi = jdbc.queryForObject("SELECT COUNT(*) FROM presentasi WHERE id_kelompok = ?", Integer.class, idKelompok);
        if (sisa != null && sisa == 0 && presentasi != null && presentasi == 0) {
            jdbc.update("DELETE FROM kelompok WHERE id_kelompok = ?", idKelompok);
        }
    }

    // ------------------------------------------------------------------ HELPER

    private String tugasBesarDariKelompok(String idKelompok) {
        List<String> tb = jdbc.queryForList("SELECT id_tugas_besar FROM kelompok WHERE id_kelompok = ?", String.class, idKelompok);
        if (tb.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Kelompok tidak ditemukan.");
        }
        return tb.get(0);
    }

    private boolean sudahDiKelompok(String npm, String idTugasBesar) {
        Integer n = jdbc.queryForObject("""
                SELECT COUNT(*) FROM anggota_kelompok ak
                JOIN kelompok kl ON kl.id_kelompok = ak.id_kelompok
                WHERE ak.npm = ? AND kl.id_tugas_besar = ?
                """, Integer.class, npm, idTugasBesar);
        return n != null && n > 0;
    }

    private boolean cekDikunci(String idTugasBesar) {
        Boolean b = jdbc.queryForObject("SELECT dikunci FROM tugas_besar WHERE id_tugas_besar = ?", Boolean.class, idTugasBesar);
        return Boolean.TRUE.equals(b);
    }

    /**
     * Mengunci baris tugas_besar (SELECT ... FOR UPDATE) sampai transaksi selesai, sehingga dua mahasiswa
     * yang menekan "Masuk" bersamaan tidak bisa sama-sama lolos melewati batas kuota. Mengembalikan status dikunci.
     */
    private boolean kunciTugasBesar(String idTugasBesar) {
        Boolean b = jdbc.queryForObject("SELECT dikunci FROM tugas_besar WHERE id_tugas_besar = ? FOR UPDATE", Boolean.class, idTugasBesar);
        return Boolean.TRUE.equals(b);
    }

    private static String jam(LocalTime t, char pemisah) {
        return String.format("%02d%c%02d", t.getHour(), pemisah, t.getMinute());
    }
}
