import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function inspectPoint1() {
  console.log('=== POINT 1: SELECT kode, nama, urutan, aktif FROM aturan_anomali ORDER BY urutan ===');
  const aturan = await sql`
    SELECT kode, nama, urutan, aktif 
    FROM aturan_anomali 
    ORDER BY urutan ASC
  `;
  console.table(aturan);

  const maxVersi = await sql`SELECT MAX(versi) as max_versi FROM aturan_anomali_versi`;
  console.log('MAX(versi):', maxVersi);

  const auditLog = await sql`
    SELECT id, aturan_id, versi_sebelum, versi_sesudah, diubah_oleh, role_pengubah, alasan, created_at 
    FROM aturan_anomali_audit_log 
    ORDER BY id ASC
  `;
  console.log('Audit Log count:', auditLog.length);
  console.table(auditLog);

  // Check distinct kode_anomali_utama in cater_baca_meter
  console.log('=== DISTINCT KODE ANOMALI UTAMA IN CATER_BACA_METER ===');
  const distinctKodes = await sql`
    SELECT kode_anomali_utama, COUNT(*) as cnt 
    FROM cater_baca_meter 
    WHERE kode_anomali_utama IS NOT NULL 
    GROUP BY kode_anomali_utama 
    ORDER BY cnt DESC
  `;
  console.table(distinctKodes);

  await sql.end();
}

inspectPoint1().catch(console.error);
