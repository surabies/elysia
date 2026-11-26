import { afterAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db, user as userTable, places as placesTable } from "@cater/db";
import { app } from "@cater/backend";
import { errorHandler } from "../packages/backend/src/plugins/error-handler";
import { auth } from "../apps/web/src/lib/auth";

function extractCookieHeader(res: Response): string {
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : ([res.headers.get("set-cookie")].filter(Boolean) as string[]);

  return setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

describe("Full-Stack E2E: Error Handling, Better Auth Lifecycle & PostGIS Places", () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const emailA = `e2e-owner-${suffix}@example.com`;
  const emailB = `e2e-other-${suffix}@example.com`;
  const password = "TestPassword12345!";

  let cookieA = "";
  let cookieB = "";
  let userIdA = "";
  let userIdB = "";
  const createdPlaceIds: string[] = [];

  afterAll(async () => {
    for (const id of createdPlaceIds) {
      await db.delete(placesTable).where(eq(placesTable.id, id));
    }
    if (userIdA) await db.delete(userTable).where(eq(userTable.id, userIdA));
    if (userIdB) await db.delete(userTable).where(eq(userTable.id, userIdB));
  });

  it("1. Error handler returns consistent 404 JSON for unknown routes", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/non-existent-route-xyz"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("2. Error handler suppresses stack traces in production mode", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    try {
      const testApp = new Elysia().use(errorHandler).get("/boom", () => {
        throw new Error("Sensitive internal DB failure detail");
      });

      const res = await testApp.handle(
        new Request("http://localhost:3000/boom"),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("Internal server error");
      expect(body.error.details).toBeUndefined();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    }
  });

  it("3. Better Auth sign-up & sign-in produce valid session for GET /api/me", async () => {
    const signUpA = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "E2E Owner",
          email: emailA,
          password,
        }),
      }),
    );
    expect(signUpA.status).toBe(200);
    const dataA = await signUpA.json();
    userIdA = dataA.user.id;
    cookieA = extractCookieHeader(signUpA);
    expect(cookieA).toContain("better-auth.session_token");

    // Sign-in check
    const signInA = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: emailA, password }),
      }),
    );
    expect(signInA.status).toBe(200);
    cookieA = extractCookieHeader(signInA);

    // GET /api/me with session cookie
    const meRes = await app.handle(
      new Request("http://localhost:3000/api/me", {
        headers: { Cookie: cookieA },
      }),
    );
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.email).toBe(emailA);

    // Create second user (User B) for ownership tests
    const signUpB = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "E2E Non-Owner",
          email: emailB,
          password,
        }),
      }),
    );
    expect(signUpB.status).toBe(200);
    const dataB = await signUpB.json();
    userIdB = dataB.user.id;
    cookieB = extractCookieHeader(signUpB);
  });

  it("4. Places PostGIS CRUD, nearby search (with boundary case), and owner-only DELETE", async () => {
    // Create Monas (106.827153, -6.175392)
    const createMonas = await app.handle(
      new Request("http://localhost:3000/api/peta-spasial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieA,
        },
        body: JSON.stringify({
          name: `Monas ${suffix}`,
          description: "National Monument Jakarta",
          longitude: 106.827153,
          latitude: -6.175392,
        }),
      }),
    );
    expect(createMonas.status).toBe(201);
    const monas = (await createMonas.json()).data;
    createdPlaceIds.push(monas.id);

    // Create Istiqlal (106.831389, -6.170278) ~735m away from Monas
    const createIstiqlal = await app.handle(
      new Request("http://localhost:3000/api/peta-spasial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieA,
        },
        body: JSON.stringify({
          name: `Istiqlal ${suffix}`,
          description: "Istiqlal Mosque Jakarta",
          longitude: 106.831389,
          latitude: -6.170278,
        }),
      }),
    );
    expect(createIstiqlal.status).toBe(201);
    const istiqlal = (await createIstiqlal.json()).data;
    createdPlaceIds.push(istiqlal.id);

    // List paginated places
    const listRes = await app.handle(
      new Request("http://localhost:3000/api/peta-spasial?page=1&limit=10"),
    );
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data.pagination.total).toBeGreaterThanOrEqual(2);

    // Get single place by ID
    const getRes = await app.handle(
      new Request(`http://localhost:3000/api/peta-spasial/${monas.id}`),
    );
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.name).toBe(`Monas ${suffix}`);

    // Nearby search: 1000m radius around Monas should include both Monas (~0m) & Istiqlal (~735m)
    const nearby1000 = await app.handle(
      new Request(
        "http://localhost:3000/api/peta-spasial/nearby?lon=106.827153&lat=-6.175392&radius=1000",
      ),
    );
    expect(nearby1000.status).toBe(200);
    const nearby1000Body = await nearby1000.json();
    const ids1000 = nearby1000Body.data.map((p: { id: string }) => p.id);
    expect(ids1000).toContain(monas.id);
    expect(ids1000).toContain(istiqlal.id);

    const istiqlalEntry = nearby1000Body.data.find(
      (p: { id: string }) => p.id === istiqlal.id,
    );
    expect(Number(istiqlalEntry.distanceMeters)).toBeGreaterThan(600);
    expect(Number(istiqlalEntry.distanceMeters)).toBeLessThan(900);

    // Boundary case: 500m radius around Monas should include Monas but EXCLUDE Istiqlal (~735m)
    const nearby500 = await app.handle(
      new Request(
        "http://localhost:3000/api/peta-spasial/nearby?lon=106.827153&lat=-6.175392&radius=500",
      ),
    );
    expect(nearby500.status).toBe(200);
    const nearby500Body = await nearby500.json();
    const ids500 = nearby500Body.data.map((p: { id: string }) => p.id);
    expect(ids500).toContain(monas.id);
    expect(ids500).not.toContain(istiqlal.id);

    // Ownership check: User B must get 403 when trying to delete User A's place
    const forbiddenDel = await app.handle(
      new Request(`http://localhost:3000/api/peta-spasial/${monas.id}`, {
        method: "DELETE",
        headers: { Cookie: cookieB },
      }),
    );
    expect(forbiddenDel.status).toBe(403);
    const forbiddenBody = await forbiddenDel.json();
    expect(forbiddenBody.error.code).toBe("FORBIDDEN");

    // Owner delete: User A deletes Monas -> 200
    const ownerDel = await app.handle(
      new Request(`http://localhost:3000/api/peta-spasial/${monas.id}`, {
        method: "DELETE",
        headers: { Cookie: cookieA },
      }),
    );
    expect(ownerDel.status).toBe(200);

    // Verify deleted -> 404
    const afterDelGet = await app.handle(
      new Request(`http://localhost:3000/api/peta-spasial/${monas.id}`),
    );
    expect(afterDelGet.status).toBe(404);
  });

  it("5. Better Auth sign-out invalidates session for GET /api/me", async () => {
    const signOutRes = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          Cookie: cookieA,
          Origin: "http://localhost:3000",
        },
      }),
    );
    expect(signOutRes.status).toBe(200);

    const meAfterSignOut = await app.handle(
      new Request("http://localhost:3000/api/me", {
        headers: { Cookie: cookieA },
      }),
    );
    expect(meAfterSignOut.status).toBe(401);
  });
});
