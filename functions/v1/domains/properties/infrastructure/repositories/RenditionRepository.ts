import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { Rendition } from "../../domain/entities/Rendition";
import {
  COLLECTIONS,
  SUB_COLLECTIONS,
} from "../../../../core/domain/constants/collections";

export class RenditionRepository {
  constructor(private readonly db: FirestoreClient) {}

  async findById(
    propertyId: string,
    renditionId: string,
  ): Promise<Rendition | null> {
    return this.db.findFromSubCollection<Rendition>(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.RENDITIONS,
      renditionId,
    );
  }

  async listByPropertyId(propertyId: string): Promise<Rendition[]> {
    const renditions = await this.db.listSubCollection<Rendition>(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.RENDITIONS,
    );

    return renditions.map((rendition) => {
      return Rendition.reconstitute(rendition);
    });
  }

  async save(
    propertyId: string,
    renditionId: string,
    rendition: Rendition,
  ): Promise<string> {
    return this.db.saveToSubCollection(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.RENDITIONS,
      renditionId,
      rendition.toFirestore(),
    );
  }

  async update(
    propertyId: string,
    renditionId: string,
    rendition: Rendition,
  ): Promise<void> {
    await this.db.saveToSubCollection(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.RENDITIONS,
      renditionId,
      rendition.toFirestore(),
    );
  }
}
