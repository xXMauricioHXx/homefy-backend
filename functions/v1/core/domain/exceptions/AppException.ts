export class AppException extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = "AppException";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppException.prototype);
  }
}
