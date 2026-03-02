import { PropertyRepository } from "../../infrastructure/repositories/PropertyRepository";
import { Property } from "../../domain/entities/Property";

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(ownerUserId: string): Promise<Property[]> {
    console.log("[START] - Listing properties", ownerUserId);
    const properties =
      await this.propertyRepository.findByOwnerUserId(ownerUserId);
    console.log("[END] - Listing properties", ownerUserId);
    return properties;
  }
}
