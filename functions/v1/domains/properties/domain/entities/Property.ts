import { PropertyStatus } from "../../../../core/domain/constants/propertyStatus";
import {
  PropertyDetails,
  PropertyPricing,
} from "../value-objects/PropertyDetails";
import { Brand } from "../value-objects/Brand";
import { PropertySource } from "../value-objects/PropertySource";
import { ImageAsset } from "./ImageAsset";
import { Rendition } from "./Rendition";

export class Property {
  private constructor(
    readonly id: string,
    readonly source: PropertySource,
    private brand: Brand,
    private details: PropertyDetails,
    readonly status: PropertyStatus,
    readonly imageAssets: ImageAsset[],
    readonly createdAt: string,
    readonly updatedAt: string,
    readonly ownerUserId: string,
    readonly renditions?: Rendition[],
  ) {}

  static create(
    id: string,
    source: PropertySource,
    brand: Brand,
    details: PropertyDetails,
    status: PropertyStatus,
    imageAssets: ImageAsset[],
    createdAt: string,
    updatedAt: string,
    ownerUserId: string,
  ): Property {
    return new Property(
      id,
      source,
      brand,
      details,
      status,
      imageAssets,
      createdAt,
      updatedAt,
      ownerUserId,
    );
  }

  static reconstitute(
    data: Partial<Property>,
    assetsData?: ImageAsset[],
    renditionsData?: Rendition[],
  ): Property {
    const {
      id,
      source: sourceData,
      brand: brandData,
      details: detailsData,
      status,
      createdAt,
      updatedAt,
      ownerUserId,
    } = data as any;

    const source = PropertySource.create(
      sourceData.providerKey,
      sourceData.url,
      sourceData.fingerprint,
    );

    const brand = Brand.create(
      brandData.name,
      brandData.location,
      brandData.headline,
    );

    const details = PropertyDetails.create(
      detailsData.title,
      detailsData.description,
      detailsData.areaSqm,
      detailsData.bedrooms,
      detailsData.bathrooms,
      detailsData.parking,
      detailsData.pricing,
      detailsData.features,
      detailsData.infrastructures,
    );

    const renditions =
      renditionsData?.map((rendition: any) =>
        Rendition.reconstitute(rendition),
      ) || [];

    const assets =
      assetsData?.map((asset: any) => ImageAsset.reconstitute(asset)) || [];

    return new Property(
      id,
      source,
      brand,
      details,
      status,
      assets,
      createdAt,
      updatedAt,
      ownerUserId,
      renditions,
    );
  }

  updateDetails(details: {
    title?: string;
    description?: string;
    areaSqm?: string;
    bedrooms?: number;
    bathrooms?: number;
    parking?: number | null;
    pricing?: PropertyPricing;
    features?: string[];
    infrastructures?: string[];
  }): void {
    const propertyDetails = PropertyDetails.create(
      details.title ?? this.details.title,
      details.description ?? this.details.description,
      details.areaSqm ?? this.details.areaSqm,
      details.bedrooms ?? this.details.bedrooms,
      details.bathrooms ?? this.details.bathrooms,
      details.parking ?? this.details.parking,
      details.pricing ?? this.details.pricing,
      details.features ?? this.details.features,
      details.infrastructures ?? this.details.infrastructures,
    );

    this.details = propertyDetails;
  }

  updateBrand(brand: { location?: string; headline?: string }): void {
    this.brand = Brand.create(
      this.brand.name,
      brand.location ?? this.brand.location,
      brand.headline ?? this.brand.headline,
    );
  }

  toFirestore(): Record<string, unknown> {
    return {
      id: this.id,
      source: this.source.getValue(),
      brand: this.brand.getValue(),
      details: this.details.getValue(),
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ownerUserId: this.ownerUserId,
    };
  }
}
