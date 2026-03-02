import { AppException } from "./AppException";

export class ValidationException extends AppException {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed.", "VALIDATION_ERROR", 400);
    this.name = "ValidationException";
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}
