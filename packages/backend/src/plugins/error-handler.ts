import { Elysia } from 'elysia';

export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError({ as: 'global' }, ({ code, error, set }) => {
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message: string;
    let details: unknown = undefined;

    const errObj = error as { message?: string; stack?: string };
    const errMessage = errObj.message || String(error);

    switch (code) {
      case 'VALIDATION':
        statusCode = 422;
        errorCode = 'VALIDATION_ERROR';
        message = 'Validation failed';
        try {
          details = JSON.parse(errMessage);
        } catch {
          details = errMessage;
        }
        break;
      case 'NOT_FOUND':
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = errMessage || 'Resource not found';
        break;
      case 'PARSE':
        statusCode = 400;
        errorCode = 'BAD_REQUEST';
        message = 'Invalid request payload';
        break;
      default:
        if ((error as any)?.status && typeof (error as any).status === 'number') {
          statusCode = (error as any).status;
        }
        if (statusCode >= 500) {
          console.error('[SERVER_ERROR]', error);
          if (process.env.NODE_ENV !== 'production') {
            message = errMessage;
            details = errObj.stack;
          } else {
            message = 'Internal server error';
          }
        } else {
          message = errMessage;
        }
        break;
    }

    set.status = statusCode;
    return {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details !== undefined && { details }),
      },
    };
  });
