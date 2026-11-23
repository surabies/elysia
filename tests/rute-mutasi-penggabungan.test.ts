import { describe, expect, it } from 'bun:test';
import { app } from '@/server/app';

describe('Fitur Mutasi Rute & Penggabungan Rute Pelanggan (Elysia + Drizzle)', () => {
  const adminHeaders = {
    'x-test-role': 'SUPERADMIN',
    'x-test-user-id': 'test-admin',
    'content-type': 'application/json',
  };

  it('1. Otorisasi: request tanpa role ditolak (401)', async () => {
    const res = await app.handle(new Request('http://localhost/api/rute/wilayah'));
    expect(res.status).toBe(401);
  });

  it('2. GET /api/rute/wilayah mengembalikan daftar opsi wilayah', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/wilayah', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0]).toHaveProperty('value');
    expect(json.data[0]).toHaveProperty('label');
  });

  it('3. GET /api/rute/zona mengembalikan daftar zona', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/zona', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('4. GET /api/rute/petugas mengembalikan daftar petugas cater', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/petugas', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('5. GET /api/rute/tujuan mengembalikan rute tujuan dengan nama petugas', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/tujuan?kecuali=BD502', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    // Rute yang dikecualikan tidak boleh muncul
    const hasBD502 = json.data.some((r: any) => r.value === 'BD502');
    expect(hasBD502).toBe(false);
  });

  it('6. GET /api/rute/pelanggan mengembalikan daftar pelanggan per rute', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/pelanggan?ruteId=BD502', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    const first = json.data[0];
    expect(first).toHaveProperty('noPel');
    expect(first).toHaveProperty('nama');
    expect(first).toHaveProperty('urut');
    expect(first).toHaveProperty('rute');
  });

  it('7. GET /api/rute/pelanggan/:noPel mengembalikan 404 jika nomor pelanggan tidak ada', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/pelanggan/99999999999', { headers: adminHeaders })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('8. POST /api/rute/mutasi menolak jika rute & no urut sama persis (409 Conflict)', async () => {
    // Ambil sampel pelanggan
    const resList = await app.handle(
      new Request('http://localhost/api/rute/pelanggan?ruteId=BD502', { headers: adminHeaders })
    );
    const listJson = await resList.json();
    const target = listJson.data[0];

    const resMutasi = await app.handle(
      new Request('http://localhost/api/rute/mutasi', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          noPel: target.noPel,
          wilayahId: target.wilayah,
          ruteKode: target.rute,
          noUrut: Math.max(1, target.urut || 1),
        }),
      })
    );

    expect(resMutasi.status).toBe(409);
    const json = await resMutasi.json();
    expect(json.success).toBe(false);
  });

  it('9. POST /api/rute/mutasi berhasil memindahkan pelanggan dan mencatat riwayat', async () => {
    // Ambil sampel pelanggan dari BD502
    const resList = await app.handle(
      new Request('http://localhost/api/rute/pelanggan?ruteId=BD502', { headers: adminHeaders })
    );
    const listJson = await resList.json();
    const target = listJson.data[0];

    // Mutasi ke BD501 nomor urut 999
    const resMutasi = await app.handle(
      new Request('http://localhost/api/rute/mutasi', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          noPel: target.noPel,
          wilayahId: 'WP 5',
          ruteKode: 'BD501',
          noUrut: 999,
          zona: 'Zona 1',
        }),
      })
    );

    expect(resMutasi.status).toBe(200);
    const json = await resMutasi.json();
    expect(json.success).toBe(true);
    expect(json.data.noPel).toBe(target.noPel);
    expect(json.data.baru.rute).toBe('BD501');
    expect(json.data.baru.urut).toBe(999);
    expect(json.data.lama.rute).toBe(target.rute);

    // Verifikasi pelanggan terupdate di database
    const resCari = await app.handle(
      new Request(`http://localhost/api/rute/pelanggan/${target.noPel}`, { headers: adminHeaders })
    );
    const jsonCari = await resCari.json();
    expect(jsonCari.data.rute).toBe('BD501');
    expect(jsonCari.data.urut).toBe(999);

    // Kembalikan lagi ke rute asal
    await app.handle(
      new Request('http://localhost/api/rute/mutasi', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          noPel: target.noPel,
          wilayahId: target.wilayah,
          ruteKode: target.rute,
          noUrut: target.urut || 1,
        }),
      })
    );
  });

  it('10. POST /api/rute/penggabungan menolak jika rute tujuan sama dengan rute asal (409)', async () => {
    const resList = await app.handle(
      new Request('http://localhost/api/rute/pelanggan?ruteId=BD502', { headers: adminHeaders })
    );
    const listJson = await resList.json();
    const p1 = listJson.data[0];

    const resGabung = await app.handle(
      new Request('http://localhost/api/rute/penggabungan', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          noPelList: [p1.noPel],
          ruteTujuan: 'BD502', // sama dengan asal
        }),
      })
    );

    expect(resGabung.status).toBe(409);
    const json = await resGabung.json();
    expect(json.success).toBe(false);
  });

  it('11. GET /api/rute/riwayat mengembalikan riwayat mutasi audit log', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/rute/riwayat', { headers: adminHeaders })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    const first = json.data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('tglInput');
    expect(first).toHaveProperty('noPel');
    expect(first).toHaveProperty('baru');
    expect(first).toHaveProperty('lama');
    expect(first).toHaveProperty('inputBy');
  });
});
