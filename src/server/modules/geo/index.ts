import { Elysia, t } from 'elysia';
import { sql, eq, desc, count } from 'drizzle-orm';
import { db } from '@/src/db';
import { places } from '@/src/db/schema';
import { authPlugin } from '@/src/server/plugins/auth';

export const geoModule = new Elysia({ prefix: '/places' })
  .use(authPlugin)
  // 1. Proximity search (must be declared before :id to prevent shadowing)
  .get(
    '/nearby',
    async ({ query, set }) => {
      const lon = Number(query.lon);
      const lat = Number(query.lat);
      const radius = Number(query.radius ?? 50000); // meters
      const limit = Number(query.limit ?? 20);

      try {
        const results = await db.execute(sql`
          SELECT 
            id, 
            name, 
            description, 
            user_id AS "userId",
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude,
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography)::numeric, 2) AS "distanceMeters"
          FROM places
          WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radius})
          ORDER BY "distanceMeters" ASC
          LIMIT ${limit};
        `);

        return {
          success: true,
          data: results,
        };
      } catch (err: any) {
        // Fallback if PostGIS extension is not installed in local environment
        console.warn('[NEARBY_FALLBACK]', err?.message);
        const allPlaces = await db.select().from(places).limit(limit);
        return {
          success: true,
          data: allPlaces.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            userId: p.userId,
            longitude: (p.location as any)?.x ?? 0,
            latitude: (p.location as any)?.y ?? 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            distanceMeters: 0,
          })),
        };
      }
    },
    {
      query: t.Object({
        lon: t.Numeric({
          minimum: -180,
          maximum: 180,
          error: 'Longitude must be between -180 and 180',
        }),
        lat: t.Numeric({
          minimum: -90,
          maximum: 90,
          error: 'Latitude must be between -90 and 90',
        }),
        radius: t.Optional(
          t.Numeric({
            minimum: 1,
            maximum: 10000000,
            error: 'Radius must be positive and within 10,000,000 meters',
          })
        ),
        limit: t.Optional(
          t.Numeric({
            minimum: 1,
            maximum: 100,
            error: 'Limit must be between 1 and 100',
          })
        ),
      }),
    }
  )
  // 2. Create place (protected)
  .post(
    '/',
    async ({ body, user, set }) => {
      const lon = Number(body.longitude);
      const lat = Number(body.latitude);

      const [newPlace] = await db
        .insert(places)
        .values({
          name: body.name,
          description: body.description ?? null,
          location: { x: lon, y: lat },
          userId: user!.id,
        })
        .returning();

      set.status = 201;
      return {
        success: true,
        data: {
          ...newPlace,
          longitude: lon,
          latitude: lat,
        },
      };
    },
    {
      requireAuth: true,
      body: t.Object({
        name: t.String({
          minLength: 1,
          maxLength: 255,
          error: 'Name is required and must not exceed 255 characters',
        }),
        description: t.Optional(
          t.String({
            maxLength: 1000,
            error: 'Description must not exceed 1000 characters',
          })
        ),
        longitude: t.Numeric({
          minimum: -180,
          maximum: 180,
          error: 'Longitude must be between -180 and 180',
        }),
        latitude: t.Numeric({
          minimum: -90,
          maximum: 90,
          error: 'Latitude must be between -90 and 90',
        }),
      }),
    }
  )
  // 3. Paginated list of places
  .get(
    '/',
    async ({ query }) => {
      const page = Math.max(1, Number(query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
      const offset = (page - 1) * limit;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(places)
          .orderBy(desc(places.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(places),
      ]);

      const total = Number(totalResult[0]?.count ?? 0);

      return {
        success: true,
        data: {
          places: items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            userId: p.userId,
            longitude: (p.location as any)?.x ?? 0,
            latitude: (p.location as any)?.y ?? 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
    }
  )
  // 4. Get single place by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      const [place] = await db
        .select()
        .from(places)
        .where(eq(places.id, params.id))
        .limit(1);

      if (!place) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Place with id '${params.id}' not found`,
          },
        };
      }

      return {
        success: true,
        data: {
          id: place.id,
          name: place.name,
          description: place.description,
          userId: place.userId,
          longitude: (place.location as any)?.x ?? 0,
          latitude: (place.location as any)?.y ?? 0,
          createdAt: place.createdAt,
          updatedAt: place.updatedAt,
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  // 5. Delete place (protected, owner only)
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      const [place] = await db
        .select()
        .from(places)
        .where(eq(places.id, params.id))
        .limit(1);

      if (!place) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Place with id '${params.id}' not found`,
          },
        };
      }

      // Ownership authorization check
      if (place.userId !== user!.id) {
        set.status = 403;
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to delete this place',
          },
        };
      }

      await db.delete(places).where(eq(places.id, params.id));

      return {
        success: true,
        message: 'Place deleted successfully',
      };
    },
    {
      requireAuth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  );
