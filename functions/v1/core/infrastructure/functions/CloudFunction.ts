import { HttpsOptions } from "firebase-functions/https";

export class CloudFunction {
  private static instance: CloudFunction;

  private constructor() {}

  public static getInstance(): CloudFunction {
    if (!CloudFunction.instance) {
      CloudFunction.instance = new CloudFunction();
    }
    return CloudFunction.instance;
  }

  defaultConfig(): HttpsOptions {
    return {
      region: "southamerica-east1",
      memory: "1GiB",
      timeoutSeconds: 300,
    };
  }
}
