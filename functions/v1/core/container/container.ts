import { FirestoreClient } from "../infrastructure/firestore/FirestoreClient";
import { StorageClient } from "../infrastructure/storage/StorageClient";
import { HttpClient } from "../infrastructure/http/HttpClient";
import { StripeClient } from "../infrastructure/stripe/StripeClient";
import { CloudFunction } from "../infrastructure/functions/CloudFunction";

export class CoreContainer {
  private static instance: CoreContainer;

  private constructor() {}

  public static getInstance(): CoreContainer {
    if (!CoreContainer.instance) {
      CoreContainer.instance = new CoreContainer();
    }
    return CoreContainer.instance;
  }

  get firestoreClient(): FirestoreClient {
    return FirestoreClient.getInstance();
  }

  get storageClient(): StorageClient {
    return StorageClient.getInstance();
  }

  get httpClient(): HttpClient {
    return HttpClient.getInstance();
  }

  get stripeClient(): StripeClient {
    return StripeClient.getInstance();
  }

  get cloudFunction(): CloudFunction {
    return CloudFunction.getInstance();
  }
}

export const coreContainer = CoreContainer.getInstance();
