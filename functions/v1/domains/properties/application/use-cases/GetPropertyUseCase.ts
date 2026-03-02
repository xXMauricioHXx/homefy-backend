import { PropertyRepository } from "../../infrastructure/repositories/PropertyRepository";
import { Property } from "../../domain/entities/Property";
import { NotFoundException } from "../../../../core/domain/exceptions/NotFoundException";

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(id: string): Promise<Property> {
    console.log("[START] - Getting property", id);
    const property = await this.propertyRepository.findById(id);
    console.log("[END] - Getting property", id);

    if (!property) throw new NotFoundException("Property", id);

    return property;
  }
}
