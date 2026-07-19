import AppError from './AppError';

class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super({
      message: message || `External service "${service}" is unavailable`,
      statusCode: 502,
      type: 'EXTERNAL_SERVICE_ERROR',
      details: { service },
    });
  }
}

export default ExternalServiceError;
