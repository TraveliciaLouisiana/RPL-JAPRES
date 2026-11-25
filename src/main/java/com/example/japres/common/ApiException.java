package com.example.japres.common;

import org.springframework.http.HttpStatus;

/** Error yang sengaja kita lempar (mis. "kelompok penuh"). Pesannya langsung ditampilkan ke pengguna. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String pesan) {
        super(pesan);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
