import { AppException } from "../../../../core/domain/exceptions/AppException";

export class MaxNumberImagesExceededException extends AppException {
  constructor() {
    super(
      "Max number of images allowed exceeded",
      "MAX_NUMBER_IMAGES_EXCEEDED",
      409,
    );
    this.name = "MaxNumberImagesExceededException";
  }
}
