package com.example.japres.repository;

import com.example.japres.model.Mahasiswa;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcMahasiswaRepository implements MahasiswaRepository {

    private final JdbcTemplate jdbc;

    public JdbcMahasiswaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Mahasiswa> MAPPER = (rs, i) -> new Mahasiswa(rs.getString("npm"), rs.getString("nama"), rs.getString("email"));

    @Override
    public List<Mahasiswa> findAll() {
        return jdbc.query("SELECT npm, nama, email FROM mahasiswa ORDER BY npm", MAPPER);
    }

    @Override
    public Optional<Mahasiswa> findByNpm(String npm) {
        return jdbc.query("SELECT npm, nama, email FROM mahasiswa WHERE npm = ?", MAPPER, npm).stream().findFirst();
    }
}