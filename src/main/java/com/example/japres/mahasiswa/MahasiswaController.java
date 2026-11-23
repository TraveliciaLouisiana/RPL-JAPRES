package com.example.japres.mahasiswa;

import com.example.japres.model.Mahasiswa;
import com.example.japres.repository.MahasiswaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/mahasiswa")
public class MahasiswaController {

    private final MahasiswaRepository repo;

    public MahasiswaController(MahasiswaRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Mahasiswa> semua() {
        return repo.findAll();
    }

    @GetMapping("/{npm}")
    public ResponseEntity<Mahasiswa> detail(@PathVariable("npm") String npm) {
        return repo.findByNpm(npm).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}