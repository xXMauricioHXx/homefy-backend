import { FirestoreClient } from "../../../core/infrastructure/firestore/FirestoreClient";
import { PropertyRepository } from "../infrastructure/repositories/PropertyRepository";
import { RenditionRepository } from "../infrastructure/repositories/RenditionRepository";
import { AssetRepository } from "../infrastructure/repositories/AssetRepository";
import { CreatePropertyUseCase } from "../application/use-cases/CreatePropertyUseCase";
import { UpdatePropertyUseCase } from "../application/use-cases/UpdatePropertyUseCase";
import { GetPropertyUseCase } from "../application/use-cases/GetPropertyUseCase";
import { ListPropertiesUseCase } from "../application/use-cases/ListPropertiesUseCase";
import { ScrapPropertyUseCase } from "../application/use-cases/ScrapPropertyUseCase";
import { CreatePdfRenditionUseCase } from "../application/use-cases/CreatePdfRenditionUseCase";
import { HttpClient } from "../../../core/infrastructure/http/HttpClient";
import { DewatermarkHttp } from "../../../core/infrastructure/http/DewatermarkHttp";
import { StorageClient } from "../../../core/infrastructure/storage/StorageClient";
import { ImageService } from "../application/services/image";
import { UserRepository } from "../infrastructure/repositories/UserRepository";

export class PropertiesContainer {
  public readonly propertyRepository: PropertyRepository;
  public readonly renditionRepository: RenditionRepository;
  public readonly assetRepository: AssetRepository;
  public readonly userRepository: UserRepository;

  public readonly createPropertyUseCase: CreatePropertyUseCase;
  public readonly updatePropertyUseCase: UpdatePropertyUseCase;
  public readonly getPropertyUseCase: GetPropertyUseCase;
  public readonly listPropertiesUseCase: ListPropertiesUseCase;
  public readonly scrapPropertyUseCase: ScrapPropertyUseCase;
  public readonly createPdfRenditionUseCase: CreatePdfRenditionUseCase;

  public readonly imageService: ImageService;

  constructor(
    private readonly db: FirestoreClient,
    private readonly http: HttpClient,
    private readonly storage: StorageClient,
    private readonly dewatermarkHttp: DewatermarkHttp,
  ) {
    this.userRepository = new UserRepository(db);
    this.imageService = new ImageService(
      this.http,
      this.dewatermarkHttp,
      this.storage,
    );

    this.renditionRepository = new RenditionRepository(db);
    this.assetRepository = new AssetRepository(db);
    this.propertyRepository = new PropertyRepository(
      db,
      this.assetRepository,
      this.renditionRepository,
    );

    this.createPropertyUseCase = new CreatePropertyUseCase(
      this.propertyRepository,
      this.imageService,
      this.userRepository,
    );
    this.updatePropertyUseCase = new UpdatePropertyUseCase(
      this.propertyRepository,
    );
    this.getPropertyUseCase = new GetPropertyUseCase(this.propertyRepository);
    this.listPropertiesUseCase = new ListPropertiesUseCase(
      this.propertyRepository,
    );
    this.scrapPropertyUseCase = new ScrapPropertyUseCase();
    this.createPdfRenditionUseCase = new CreatePdfRenditionUseCase(
      this.renditionRepository,
    );
  }
}
