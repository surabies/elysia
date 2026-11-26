import { Elysia, t } from 'elysia';

export const echoModule = new Elysia({ prefix: '/echo' })
  .post(
    '/',
    ({ body }) => {
      return {
        success: true,
        data: {
          message: body.message,
          receivedAt: new Date().toISOString(),
        },
      };
    },
    {
      body: t.Object({
        message: t.String({
          minLength: 1,
          maxLength: 500,
          error: 'Message must be between 1 and 500 characters',
        }),
      }),
    }
  );
