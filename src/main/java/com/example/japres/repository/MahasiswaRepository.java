package com.example.japres.repository;

import com.example.japres.model.Mahasiswa;
import java.util.List;
import java.util.Optional;

public interface MahasiswaRepository {
    List<Mahasiswa> findAll();
    Optional<Mahasiswa> findByNpm(String npm);
}