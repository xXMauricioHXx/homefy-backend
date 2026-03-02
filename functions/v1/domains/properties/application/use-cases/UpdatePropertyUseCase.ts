import { PropertyRepository } from "../../infrastructure/repositories/PropertyRepository";
import { UpdatePropertyDto } from "../dtos/PropertyDtos";
import { NotFoundException } from "../../../../core/domain/exceptions/NotFoundException";

export class UpdatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(id: string, dto: UpdatePropertyDto): Promise<void> {
    console.log("[START] - Updating property", id);

    console.log("[INFO] - Finding property");
    const property = await this.propertyRepository.findById(id);

    console.log("[INFO] - Checking if property exists");
    if (!property) throw new NotFoundException("Property", id);

    if (dto.details) {
      property.updateDetails(dto.details);
    }

    if (dto.brand) {
      property.updateBrand(dto.brand);
    }

    console.log("[INFO] - Updating property");
    await this.propertyRepository.update(id, property);

    console.log("[END] - Updating property", id);
  }
}
