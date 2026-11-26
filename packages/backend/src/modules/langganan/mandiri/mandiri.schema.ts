import { t } from "elysia";

export const submitMandiriPublicBodySchema = t.Object({
  thbl: t.String({
    minLength: 6,
    maxLength: 6,
    description: "Periode THBL e.g. 202601",
  }),
  nolg: t.String({ minLength: 1, description: "Nomor Langganan" }),
  stma: t.Number({
    minimum: 0,
    description: "Angka Stand Meter Akhir yang dilaporkan",
  }),
  fotoMeterUrl: t.String({ minLength: 1, description: "URL foto water meter" }),
  fotoRumahUrl: t.Optional(t.String()),
  longitude: t.Optional(t.Number()),
  latitude: t.Optional(t.Number()),
  channel: t.Optional(
    t.Union([t.Literal("WEB_PORTAL"), t.Literal("MOBILE_APP")]),
  ),
});

export const verifikasiMandiriBodySchema = t.Object({
  mandiriId: t.String({ minLength: 1 }),
  action: t.Union([t.Literal("APPROVE"), t.Literal("REJECT")]),
  standDilaporkan: t.Optional(t.Number({ minimum: 0 })),
  alasanPenolakan: t.Optional(t.String()),
});
