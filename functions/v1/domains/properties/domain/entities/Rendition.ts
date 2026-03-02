import {
  RenditionType,
  RenditionStatus,
} from "../../../../core/domain/constants/renditionType";
import { v4 as uuidv4 } from "uuid";

export interface PdfRenditionConfig {
  theme?: { primary?: string; secondary?: string };
  texts?: { agentName?: string; whatsapp?: string };
  layout?: string;
}

export interface GalleryRenditionConfig {
  coverAssetId?: string;
  assetIds?: string[];
}

export interface ShareLinkRenditionConfig {
  slug?: string;
  visibility?: "UNLISTED" | "PUBLIC" | "PRIVATE";
  expiresAt?: string | null;
}

export type RenditionConfig =
  | PdfRenditionConfig
  | GalleryRenditionConfig
  | ShareLinkRenditionConfig
  | null;

export class Rendition {
  private constructor(
    readonly id: string,
    readonly type: RenditionType,
    readonly status: RenditionStatus,
    private config: RenditionConfig,
    private createdAt: string,
    private updatedAt: string,
  ) {}

  static create(
    id: string,
    type: RenditionType,
    status: RenditionStatus,
    config: RenditionConfig,
    createdAt: string,
    updatedAt: string,
  ): Rendition {
    return new Rendition(id, type, status, config, createdAt, updatedAt);
  }

  static reconstitute(data: Partial<Rendition>): Rendition {
    const { id, type, status, config, createdAt, updatedAt } = data as any;

    return new Rendition(id, type, status, config, createdAt, updatedAt);
  }

  static createPdfRendition(config: PdfRenditionConfig): Rendition {
    const id = uuidv4();

    return new Rendition(
      id,
      RenditionType.PDF,
      RenditionStatus.READY,
      config,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static createGalleryRendition(config: GalleryRenditionConfig): Rendition {
    const id = uuidv4();

    return new Rendition(
      id,
      RenditionType.GALLERY,
      RenditionStatus.READY,
      config,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static createShareLinkRendition(config: ShareLinkRenditionConfig): Rendition {
    const id = uuidv4();

    return new Rendition(
      id,
      RenditionType.SHARE_LINK,
      RenditionStatus.READY,
      config,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  applyConfig(config: RenditionConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.updatedAt = new Date().toISOString();
  }

  toFirestore(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
