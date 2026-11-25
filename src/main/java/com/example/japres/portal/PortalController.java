package com.example.japres.portal;

import com.example.japres.auth.SessionUser;
import com.example.japres.portal.PortalModels.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Semua endpoint halaman mahasiswa. NPM selalu diambil dari sesi login (bukan dari parameter),
 * jadi mahasiswa tidak bisa melihat / mengubah data mahasiswa lain.
 */
@RestController
@RequestMapping("/api/portal")
public class PortalController {

    private final PortalService service;

    public PortalController(PortalService service) {
        this.service = service;
    }

    public record BuatKelompokRequest(String kodeMk) {}

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

    @PostMapping("/kelompok")
    public Map<String, String> buatKelompok(@RequestBody BuatKelompokRequest body, HttpServletRequest request) {
        return service.buatKelompok(npm(request), body.kodeMk());
    }

    @PostMapping("/kelompok/{id}/gabung")
    public ResponseEntity<Void> gabung(@PathVariable("id") String id, HttpServletRequest request) {
        service.gabung(npm(request), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/kelompok/{id}/anggota-saya")
    public ResponseEntity<Void> keluar(@PathVariable("id") String id, HttpServletRequest request) {
        service.keluar(npm(request), id);
        return ResponseEntity.noContent().build();
    }
}
