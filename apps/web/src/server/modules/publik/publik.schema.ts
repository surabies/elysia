import { t } from 'elysia';
import {
  createPengaduanBodySchema,
  detailPengaduanParamsSchema,
  ratingPengaduanBodySchema,
} from '../pengaduan/pengaduan.schema';

export const inquiryTagihanParamsSchema = t.Object({
  nolg: t.String({ minLength: 1, maxLength: 20, description: 'Nomor Langganan PDAM' }),
});

export {
  createPengaduanBodySchema as publicCreatePengaduanBodySchema,
  detailPengaduanParamsSchema as publicDetailPengaduanParamsSchema,
  ratingPengaduanBodySchema as publicRatingPengaduanBodySchema,
};
