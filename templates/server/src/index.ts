import { serve } from '@hono/node-server';
import { LoggingHandlerPlugin } from '@orpc/experimental-pino';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { getSharedEnv } from '@template/env/shared';
import { Logger, logger } from '@template/logger';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppDomain } from './domain/domain.ts';
import { MediaService } from './domain/media/media-service.ts';
import { AuthService, authSymbol } from './lib/auth.ts';
import { di, loggerSymbol } from './lib/di.ts';
import { routerImplementation } from './routes/index.ts';

const env = getSharedEnv();

const handler = new RPCHandler(routerImplementation, {
  plugins: [
    new CORSPlugin({
      credentials: true,
    }),
    new LoggingHandlerPlugin({
      logger,
      generateId: () => crypto.randomUUID(),
      logRequestAbort: false,
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const openApiHandler = new OpenAPIHandler(routerImplementation, {
  plugins: [
    new CORSPlugin({
      credentials: true,
    }),
    new OpenAPIReferencePlugin({
      docsProvider: 'scalar', // default: 'scalar'
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: 'API Playground',
          version: '1.0.0',
        },
      },
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const app = new Hono();

app.use(
  '/api/auth/*', // or replace with "*" to enable cors for all routes
  cors({
    origin: [env.CLIENT_URL, env.SERVER_URL],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

app.get('/', (c) => c.text('API!'));

const auth = di.get<AuthService>(authSymbol);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const expoOrigin = c.req.header('expo-origin');
  if (expoOrigin) {
    c.req.raw.headers.set('Origin', expoOrigin);
  }
  try {
    return auth.handler(c.req.raw);
  } catch (error) {
    logger.error(error, 'Auth handler error:');
    return c.text('Internal Server Error', 500);
  }
});

app.use('/rpc/*', async (c, next) => {
  const logger = di.get<Logger>(loggerSymbol);
  const domain = di.get<AppDomain>(AppDomain);

  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {
      headers: c.req.raw.headers,
      domain,
      logger,
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.use('/api/*', async (c, next) => {
  const logger = di.get<Logger>(loggerSymbol);
  const domain = di.get<AppDomain>(AppDomain);
  const { matched, response } = await openApiHandler.handle(c.req.raw, {
    prefix: '/api',
    context: {
      headers: c.req.raw.headers,
      domain,
      logger,
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.use('media/:filename', async (c, next) => {
  try {
    const filename = c.req.param('filename');
    const mediaService = di.get<MediaService>(MediaService);
    const imageBlob = await mediaService.getImageBlob(filename);

    return new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/webp',
      },
    });
  } catch (error) {
    logger.error(error, 'Error fetching media file:');
    return c.text('Image not found', 404);
  }
});

const server = serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    logger.info(`Server started on http://localhost:${info.port}`);
  }
);

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
