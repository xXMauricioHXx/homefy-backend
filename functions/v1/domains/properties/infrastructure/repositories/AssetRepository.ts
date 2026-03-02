import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { ImageAsset } from "../../domain/entities/ImageAsset";
import {
  COLLECTIONS,
  SUB_COLLECTIONS,
} from "../../../../core/domain/constants/collections";

export class AssetRepository {
  constructor(private readonly db: FirestoreClient) {}

  async findById(
    propertyId: string,
    assetId: string,
  ): Promise<ImageAsset | null> {
    return this.db.findFromSubCollection<ImageAsset>(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.ASSETS,
      assetId,
    );
  }

  async listByPropertyId(propertyId: string): Promise<ImageAsset[]> {
    return this.db.listSubCollection<ImageAsset>(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.ASSETS,
    );
  }

  async save(
    propertyId: string,
    assetId: string,
    asset: ImageAsset,
  ): Promise<string> {
    return this.db.saveToSubCollection(
      COLLECTIONS.PROPERTIES,
      propertyId,
      SUB_COLLECTIONS.ASSETS,
      assetId,
      asset.toFirestore(),
    );
  }
}
