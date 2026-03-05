import { PropertyRepository } from "../../infrastructure/repositories/PropertyRepository";
import { Property } from "../../domain/entities/Property";
import { CreatePropertyDto } from "../dtos/PropertyDtos";
import { PropertyStatus } from "../../../../core/domain/constants/propertyStatus";
import { ImageAsset } from "../../domain/entities/ImageAsset";
import {
  AssetStatus,
  AssetType,
} from "../../../../core/domain/constants/assetType";
import { ImageService } from "../../application/services/image";
import { v4 as uuidv4 } from "uuid";
import { PropertySource } from "../../domain/value-objects/PropertySource";
import { Brand } from "../../domain/value-objects/Brand";
import { PropertyDetails } from "../../domain/value-objects/PropertyDetails";
import { MaxNumberImagesExceededException } from "../../domain/exceptions/MaxNumberImagesExceeded";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { NoCreditsAvailableException } from "../../domain/exceptions/NoCredistAvailable";

export class CreatePropertyUseCase {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly imageService: ImageService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, dto: CreatePropertyDto): Promise<Property> {
    console.log("[START] - Create Property");
    const now = new Date().toISOString();
    const propertyId = uuidv4();

    console.log("[INFO] - Finding user");
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.hasCredits()) {
      console.log("[ERROR] - User has no credits");
      throw new NoCreditsAvailableException();
    }

    console.log("[INFO] - Creating fingerprint");
    const fingerprint = Buffer.from(dto.source.url).toString("hex");

    console.log("[INFO] - Checking if property already exists");
    const existing =
      await this.propertyRepository.findByFingerprint(fingerprint);

    if (existing) {
      console.log("[INFO] - Property already exists");
      return existing;
    }

    const imageAssets = await this.processImages(
      userId,
      propertyId,
      dto.images,
    );

    console.log("[INFO] - Creating source");
    const source = PropertySource.create(
      dto.source.providerKey,
      dto.source.url,
      fingerprint,
    );

    console.log("[INFO] - Creating brand");
    const brand = Brand.create(
      dto.brand.name,
      dto.brand.location,
      dto.brand.headline,
    );

    console.log("[INFO] - Creating details");
    const details = PropertyDetails.create(
      dto.details.title,
      dto.details.description,
      dto.details.areaSqm || "0",
      dto.details.bedrooms || 0,
      dto.details.bathrooms || 0,
      dto.details.parking || 0,
      dto.pricing,
      dto.details.features,
      dto.details.infrastructures,
    );

    console.log("[INFO] - Creating property");
    const property = Property.create(
      propertyId,
      source,
      brand,
      details,
      PropertyStatus.CREATED,
      imageAssets,
      now,
      now,
      userId,
    );

    console.log("[INFO] - Saving property");
    await this.propertyRepository.save(property);

    console.log("[INFO] - Using credit");
    user.useCredit();
    await this.userRepository.update(user);

    console.log("[INFO] - Property created successfully");
    return property;
  }

  private async processImages(
    userId: string,
    propertyId: string,
    images: string[],
  ): Promise<ImageAsset[]> {
    const now = new Date().toISOString();

    console.log("[INFO] - Checking max number of images");
    if (images.length > Number(process.env.MAX_IMAGES)) {
      throw new MaxNumberImagesExceededException();
    }

    console.log("[INFO] - Processing images");
    const imageAssets = await Promise.all(
      images.map(async (image, index) => {
        console.log("[INFO] - Processing image", image);
        const assetType = index === 0 ? AssetType.MAIN : AssetType.GALLERY;

        console.log("[INFO] - Creating image asset");
        const asset = ImageAsset.create(
          assetType,
          index,
          AssetStatus.PENDING,
          {
            url: image,
            provider: "",
          },
          {
            url: null,
            provider: "",
          },
          now,
          now,
        );

        try {
          console.log("[INFO] - Uploading image");
          const url = await this.imageService.uploadImage(
            userId,
            propertyId,
            asset.id,
            image,
          );
          asset.cleaned(url);
        } catch (err) {
          console.log("[ERROR] - Error uploading image", err);
          asset.error();
        }

        return asset;
      }),
    );

    return imageAssets;
  }
}
