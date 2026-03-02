import { AppException } from "../../../../core/domain/exceptions/AppException";

export class NoCreditsAvailableException extends AppException {
  constructor() {
    super("No credits available", "NO_CREDITS_AVAILABLE", 409);
    this.name = "NoCreditsAvailableException";
  }
}
