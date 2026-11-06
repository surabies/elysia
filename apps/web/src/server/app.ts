import { Elysia } from 'elysia';
import { corsPlugin } from './plugins/cors';
import { errorHandler } from './plugins/error-handler';
import { healthModule } from './modules/health';
import { echoModule } from './modules/echo';
import { authModule } from './modules/auth';
import { geoModule } from './modules/geo';
import { caterModule } from './modules/cater';

export const app = new Elysia({ prefix: '/api' })
  .use(corsPlugin)
  .use(errorHandler)
  .get('/', () => {
    return {
      success: true,
      name: 'Elysia Backend API',
      version: '1.0.0',
    };
  })
  .use(healthModule)
  .use(echoModule)
  .use(authModule)
  .use(geoModule)
  .use(caterModule);

export type App = typeof app;
