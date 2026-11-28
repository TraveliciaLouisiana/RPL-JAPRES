package com.example.japres.portal;

import com.example.japres.auth.SessionUser;
import com.example.japres.portal.PortalModels.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Semua endpoint halaman mahasiswa. NPM selalu diambil dari sesi login (bukan dari parameter),
 * jadi mahasiswa tidak bisa melihat / mengubah data mahasiswa lain.
 *
 * Perubahan konsep kelompok:
 *  - Endpoint "buat kelompok" (POST /kelompok) DIHAPUS: kelompok dibuat oleh Dosen.
 *  - Endpoint "gabung" diganti "simpan" (PUT): memilih kelompok lalu menekan tombol Simpan (sekaligus bisa pindah).
 */
@RestController
@RequestMapping("/api/portal")
public class PortalController {

    private final PortalService service;

    public PortalController(PortalService service) {
        this.service = service;
    }

    private static String npm(HttpServletRequest request) {
        return SessionUser.wajib(request, "mahasiswa").id();
    }

    @GetMapping("/profil")
    public Profil profil(HttpServletRequest request) {
        return service.profil(npm(request));
    }

    @GetMapping("/mata-kuliah")
    public List<MataKuliah> mataKuliah(HttpServletRequest request) {
        return service.mataKuliah(npm(request));
    }

    @GetMapping("/jadwal-kuliah")
    public List<JadwalKuliah> jadwalKuliah(HttpServletRequest request) {
        return service.jadwalKuliah(npm(request));
    }

    @GetMapping("/kelompok")
    public DataKelompok kelompok(@RequestParam("kode") String kode, HttpServletRequest request) {
        return service.kelompok(npm(request), kode);
    }

    /** Tombol "Simpan": masuk (atau pindah) ke kelompok {id}. */
    @PutMapping("/kelompok/{id}/simpan")
    public ResponseEntity<Void> simpan(@PathVariable("id") String id, HttpServletRequest request) {
        service.simpan(npm(request), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/kelompok/{id}/anggota-saya")
    public ResponseEntity<Void> keluar(@PathVariable("id") String id, HttpServletRequest request) {
        service.keluar(npm(request), id);
        return ResponseEntity.noContent().build();
    }
}
