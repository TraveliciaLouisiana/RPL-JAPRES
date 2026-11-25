-- JAPRES - tambahan.sql
-- Jalankan SEKALI pada database japres (setelah skema.sql dan data.sql).
--
-- Kenapa perlu? Di UI ada fitur "Dosen mengunci jadwal" (mahasiswa tidak boleh lagi masuk / keluar / membuat kelompok),
-- tetapi di skema.sql belum ada kolom untuk menyimpan status itu.
ALTER TABLE tugas_besar ADD COLUMN IF NOT EXISTS dikunci BOOLEAN NOT NULL DEFAULT FALSE;

-- Untuk uji coba:
--   UPDATE tugas_besar SET dikunci = TRUE  WHERE id_tugas_besar = 'TB01';   -- kunci
--   UPDATE tugas_besar SET dikunci = FALSE WHERE id_tugas_besar = 'TB01';   -- buka lagi
