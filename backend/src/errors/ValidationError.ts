import AppError from "./AppError";

class ValidationErrors extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super({
      message: "Validation failed",
      statusCode: 400,
      type: "VALIDATION_ERROR",
      details: errors,
    });
  }
}

export default ValidationErrors;
