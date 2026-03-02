import { AppException } from "../../../../core/domain/exceptions/AppException";

export class UserAlreadyExistException extends AppException {
  constructor() {
    super("User already exists", "USER_ALREADY_EXISTS", 409);
    this.name = "UserAlreadyExistException";
  }
}
