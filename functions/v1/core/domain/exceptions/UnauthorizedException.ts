import { AppException } from "./AppException";

export class UnauthorizedException extends AppException {
  constructor(message: string) {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedException";
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
