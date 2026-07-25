import AppError from "./AppError";

class ValidationErrors extends AppError {
  constructor(errors: string | Array<{ field: string; message: string }>) {
    super({
      message: typeof errors === 'string' ? errors : 'Validation failed',
      statusCode: 400,
      type: "VALIDATION_ERROR",
      details: typeof errors === 'string' ? undefined : errors,
    });
  }
}

export default ValidationErrors;
