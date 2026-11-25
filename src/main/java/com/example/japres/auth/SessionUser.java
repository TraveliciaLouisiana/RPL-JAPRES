package com.example.japres.auth;

import com.example.japres.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;

import java.io.Serializable;

/**
 * Data user yang disimpan di HttpSession (di server) setelah login berhasil.
 * id = npm (mahasiswa) / nid (dosen) / id_admin (admin).
 */
public record SessionUser(String id, String role, String nama, String email) implements Serializable {

    public static final String KEY = "japres.user";

    /** Mengembalikan user yang sedang login, atau null bila belum login / sesi habis. */
    public static SessionUser dari(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session == null ? null : (SessionUser) session.getAttribute(KEY);
    }

    /** Wajib login dengan role tertentu; kalau tidak, lempar 401 / 403. */
    public static SessionUser wajib(HttpServletRequest request, String role) {
        SessionUser user = dari(request);
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sesi berakhir. Silakan login kembali.");
        }
        if (!role.equals(user.role())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Anda tidak memiliki akses ke halaman ini.");
        }
        return user;
    }
}
