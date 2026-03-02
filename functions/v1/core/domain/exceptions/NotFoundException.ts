import { AppException } from "./AppException";

export class NotFoundException extends AppException {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found.`, "NOT_FOUND", 404);
    this.name = "NotFoundException";
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}
