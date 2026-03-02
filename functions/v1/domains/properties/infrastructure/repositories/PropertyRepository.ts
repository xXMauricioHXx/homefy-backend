import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { IRepository } from "../../../../core/application/interfaces/IRepository";
import { Property } from "../../domain/entities/Property";
import { COLLECTIONS } from "../../../../core/domain/constants/collections";
import { AssetRepository } from "./AssetRepository";
import { RenditionRepository } from "./RenditionRepository";

export class PropertyRepository implements IRepository<Property> {
  constructor(
    private readonly db: FirestoreClient,
    private readonly assetRepository: AssetRepository,
    private readonly renditionRepository: RenditionRepository,
  ) {}

  async findById(id: string): Promise<Property | null> {
    const property = await this.db.findById<Property>(
      COLLECTIONS.PROPERTIES,
      id,
    );

    if (!property) return null;

    const [assets, renditions] = await Promise.all([
      await this.assetRepository.listByPropertyId(id),
      this.renditionRepository.listByPropertyId(id),
    ]);

    return Property.reconstitute(property, assets, renditions);
  }

  async findByOwnerUserId(ownerUserId: string): Promise<Property[]> {
    const properties = await this.db.findManyByField<Property>(
      COLLECTIONS.PROPERTIES,
      "ownerUserId",
      ownerUserId,
    );

    return Promise.all(
      properties.map(async (property) => {
        const [assets, renditions] = await Promise.all([
          this.assetRepository.listByPropertyId(property.id),
          this.renditionRepository.listByPropertyId(property.id),
        ]);

        return Property.reconstitute(property, assets, renditions);
      }),
    );
  }

  async findByFingerprint(fingerprint: string): Promise<Property | null> {
    return this.db.findByField<Property>(
      COLLECTIONS.PROPERTIES,
      "source.fingerprint",
      fingerprint,
    );
  }

  async save(property: Property): Promise<string> {
    let id = property.id;

    if (property.id) {
      await this.db.saveWithId(
        COLLECTIONS.PROPERTIES,
        property.id,
        property.toFirestore(),
      );
    } else {
      id = await this.db.save(COLLECTIONS.PROPERTIES, property.toFirestore());
    }

    await Promise.all(
      property.imageAssets.map(
        async (asset) => await this.assetRepository.save(id, asset.id, asset),
      ),
    );

    return id;
  }

  async update(id: string, property: Property): Promise<void> {
    return this.db.update(COLLECTIONS.PROPERTIES, id, property.toFirestore());
  }

  async delete(id: string): Promise<void> {
    await (this.db as any)["db"]
      .collection(COLLECTIONS.PROPERTIES)
      .doc(id)
      .delete();
  }
}
