import {
  AssetType,
  AssetStatus,
  AssetFile,
} from "../../../../core/domain/constants/assetType";
import { v4 as uuidv4 } from "uuid";

export class ImageAsset {
  private constructor(
    readonly id: string,
    readonly type: AssetType,
    readonly order: number,
    private status: AssetStatus,
    readonly clean: AssetFile,
    readonly original: AssetFile,
    readonly createdAt: string,
    private updatedAt: string,
  ) {}

  static create(
    type: AssetType,
    order: number,
    status: AssetStatus,
    original: AssetFile,
    clean: AssetFile,
    createdAt: string,
    updatedAt: string,
  ): ImageAsset {
    const id = uuidv4();

    return new ImageAsset(
      id,
      type,
      order,
      status,
      clean,
      original,
      createdAt,
      updatedAt,
    );
  }

  static reconstitute(data: Record<string, unknown>): ImageAsset {
    const { id, type, order, status, clean, original, createdAt, updatedAt } =
      data as any;

    return new ImageAsset(
      id,
      type,
      order,
      status,
      clean,
      original,
      createdAt,
      updatedAt,
    );
  }

  toFirestore(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      order: this.order,
      status: this.status,
      clean: this.clean,
      original: this.original,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  cleaned(url: string): void {
    this.clean.url = url;
    this.clean.provider = "dewatermark";
    this.status = AssetStatus.CLEANED;
    this.updatedAt = new Date().toISOString();
  }

  error(): void {
    this.status = AssetStatus.ERROR;
    this.updatedAt = new Date().toISOString();
  }
}
