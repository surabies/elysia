import { db } from '../client';
import { aturanAnomali } from '../schema';

async function main() {
  const rules = await db.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
  console.table(rules.map(r => ({
    urutan: r.urutan,
    kode: r.kode,
    tipeAturan: r.tipeAturan,
    arah: r.arah,
    ring: r.ringTingkat,
    keparahan: r.tingkatKeparahan,
    minM3: r.minM3,
    maxM3: r.maxM3,
    minPersen: r.minPersen,
    maxPersen: r.maxPersen,
    syaratPakaiLaluMinM3: r.syaratPakaiLaluMinM3,
    isAnomali: r.dihitungSebagaiAnomali,
    aktif: r.aktif
  })));
  process.exit(0);
}
main();
