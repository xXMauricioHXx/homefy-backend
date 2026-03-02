import { AppException } from "../../../../core/domain/exceptions/AppException";
import { RenditionType } from "../../../../core/domain/constants/renditionType";

export class RenditionAlreadyExistsException extends AppException {
  constructor(type: RenditionType) {
    super(
      `A rendition of type ${type} already exists for this property`,
      "RENDITION_ALREADY_EXISTS",
      409,
    );
    this.name = "RenditionAlreadyExistsException";
  }
}
