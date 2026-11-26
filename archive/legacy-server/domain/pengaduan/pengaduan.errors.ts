/**
 * Hirarki Domain Error Modul Pengaduan (B13)
 * Mendefinisikan kode status HTTP dan format respon terstandar { success: false, error: string }
 */

export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 404 Not Found — Entitas pengaduan, riwayat, atau user tidak ditemukan
 */
export class NotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(message: string = 'Data pengaduan tidak ditemukan.') {
    super(message);
  }
}

/**
 * 403 Forbidden — Aktor tidak memiliki hak akses/wewenang sesuai matriks izin
 */
export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';

  constructor(message: string = 'Anda tidak memiliki wewenang untuk melakukan tindakan ini.') {
    super(message);
  }
}

/**
 * 409 Conflict — Perubahan status ilegal atau race condition optimistik
 */
export class ConflictError extends DomainError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string = 'Status tiket sudah berubah oleh proses lain, silakan muat ulang.') {
    super(message);
  }
}

export class InvalidTransitionError extends DomainError {
  readonly statusCode = 409;
  readonly code = 'INVALID_TRANSITION';

  constructor(message: string = 'Transisi status pengaduan tidak sah.') {
    super(message);
  }
}

/**
 * 422 Unprocessable Entity — Pelanggaran aturan validasi bisnis domain
 */
export class ValidationError extends DomainError {
  readonly statusCode = 422;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string = 'Data masukan tidak memenuhi aturan bisnis pengaduan.') {
    super(message);
  }
}
