import { RenditionRepository } from "../../infrastructure/repositories/RenditionRepository";
import { PdfRenditionConfig, Rendition } from "../../domain/entities/Rendition";
import { RenditionType } from "../../../../core/domain/constants/renditionType";

export class CreatePdfRenditionUseCase {
  constructor(private readonly renditionRepository: RenditionRepository) {}

  async execute(
    propertyId: string,
    config: PdfRenditionConfig,
  ): Promise<Rendition> {
    console.log("[START] - Creating PDF rendition for property: ", propertyId);

    const existingRenditions =
      await this.renditionRepository.listByPropertyId(propertyId);

    console.log("[INFO] - Existing renditions: ", existingRenditions);
    const existingPdf = existingRenditions.find(
      (rendition) => rendition.type === RenditionType.PDF,
    );

    console.log("[INFO] - Existing PDF rendition: ", existingPdf);
    if (existingPdf) {
      console.log(
        "[INFO] - PDF rendition already exists for property: ",
        propertyId,
      );

      existingPdf.applyConfig(config);

      await this.renditionRepository.update(
        propertyId,
        existingPdf.id,
        existingPdf,
      );

      console.log("[INFO] - PDF rendition updated for property: ", propertyId);
      return existingPdf;
    }

    const rendition = Rendition.createPdfRendition(config);

    await this.renditionRepository.save(propertyId, rendition.id, rendition);

    console.log("[INFO] - PDF rendition created for property: ", propertyId);
    return rendition;
  }
}
