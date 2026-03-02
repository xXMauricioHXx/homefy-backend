import { onRequest } from "firebase-functions/v2/https";
import { PropertiesContainer } from "../container/properties.container";
import { FirestoreClient } from "../../../core/infrastructure/firestore/FirestoreClient";
import { AuthMiddleware } from "../../../core/infrastructure/middlewares/auth";
import { handleError } from "../../../shared/ErrorHandle";
import { HttpClient } from "../../../core/infrastructure/http/HttpClient";
import { StorageClient } from "../../../core/infrastructure/storage/StorageClient";
import { DewatermarkHttp } from "../../../core/infrastructure/http/DewatermarkHttp";

const container = new PropertiesContainer(
  FirestoreClient.getInstance(),
  HttpClient.getInstance(),
  StorageClient.getInstance(),
  DewatermarkHttp.getInstance(),
);

const REGION = { region: "southamerica-east1" };

export const listProperties = onRequest(REGION, async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  const { uid } = (req as any).user;

  try {
    const list = await container.listPropertiesUseCase.execute(uid);
    res.status(200).json(list);
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});

export const getProperty = onRequest(REGION, async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  const id = req.params[0];

  try {
    const property = await container.getPropertyUseCase.execute(id);
    res.status(200).json(property);
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});

export const createProperty = onRequest(REGION, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  const { uid } = (req as any).user;

  try {
    const property = await container.createPropertyUseCase.execute(
      uid,
      req.body,
    );
    res.status(201).json(property);
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});

export const updateProperty = onRequest(REGION, async (req, res) => {
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  const id = req.params[0];
  try {
    await container.updatePropertyUseCase.execute(id, req.body);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});

export const scrapProperty = onRequest(REGION, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  try {
    const property = await container.scrapPropertyUseCase.execute(req.body.url);
    res.status(200).json(property);
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});

export const createPdfRendition = onRequest(REGION, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await AuthMiddleware.verifyToken(req as any, res as any);
  } catch (error) {
    handleError(res, error, "properties.http");
    return;
  }

  const propertyId = req.params[0];
  try {
    const rendition = await container.createPdfRenditionUseCase.execute(
      propertyId,
      req.body.config,
    );
    res.status(201).json(rendition);
  } catch (error) {
    handleError(res, error, "properties.http");
  }
});
