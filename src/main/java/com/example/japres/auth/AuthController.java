package com.example.japres.auth;

import com.example.japres.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // {role, nama tabel, nama kolom id}. Ini konstanta di kode (bukan input user) jadi aman dipakai di SQL.
    private static final String[][] SUMBER = {
            {"mahasiswa", "mahasiswa", "npm"},
            {"dosen", "dosen", "nid"},
            {"admin", "admin", "id_admin"}
    };

    private final JdbcTemplate jdbc;

    public AuthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        if (req == null || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email dan kata sandi wajib diisi.");
        }
        String email = req.email().trim().toLowerCase();

        for (String[] s : SUMBER) {
            String sql = "SELECT " + s[2] + " AS id, nama, email FROM " + s[1]
                    + " WHERE LOWER(email) = ? AND password = ?";
            List<SessionUser> hasil = jdbc.query(sql,
                    (rs, i) -> new SessionUser(rs.getString("id"), s[0], rs.getString("nama"), rs.getString("email")),
                    email, req.password());

            if (!hasil.isEmpty()) {
                HttpSession lama = request.getSession(false);
                if (lama != null) lama.invalidate();               // cegah session fixation
                request.getSession(true).setAttribute(SessionUser.KEY, hasil.get(0));
                return ringkas(hasil.get(0));
            }
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Email atau password tidak sesuai!");
    }

    @GetMapping("/me")
    public Map<String, String> me(HttpServletRequest request) {
        SessionUser user = SessionUser.dari(request);
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sesi berakhir. Silakan login kembali.");
        }
        return ringkas(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    private static Map<String, String> ringkas(SessionUser u) {
        return Map.of("id", u.id(), "role", u.role(), "nama", u.nama(), "email", u.email());
    }
}
