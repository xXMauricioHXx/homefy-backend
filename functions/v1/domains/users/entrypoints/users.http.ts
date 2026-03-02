import { onRequest } from "firebase-functions/v2/https";
import { UsersContainer } from "../container/users.container";
import { AuthMiddleware } from "../../../core/infrastructure/middlewares/auth";
import { handleError } from "../../../shared/ErrorHandle";
import { coreContainer } from "../../../core/container/container";

const usersContainer = new UsersContainer(coreContainer.firestoreClient);

export const getUserById = onRequest(
  coreContainer.cloudFunction.defaultConfig(),
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      await AuthMiddleware.verifyToken(req as any, res as any);
    } catch (error) {
      handleError(res, error, "users.http");
      return;
    }

    const { uid } = (req as any).user;

    try {
      const user = await usersContainer.getUserByIdUseCase.execute(uid);
      res.status(200).json(user);

      return;
    } catch (error) {
      handleError(res, error, "users.http");
    }
  },
);

export const createUser = onRequest(
  coreContainer.cloudFunction.defaultConfig(),
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      await AuthMiddleware.verifyToken(req as any, res as any);
    } catch (error) {
      handleError(res, error, "users.http");
      return;
    }

    const { uid } = (req as any).user;

    try {
      const user = await usersContainer.createUserUseCase.execute({
        ...req.body,
        id: uid,
      });
      res.status(201).json(user);

      return;
    } catch (error) {
      handleError(res, error, "users.http");
    }
  },
);

export const updateUser = onRequest(
  coreContainer.cloudFunction.defaultConfig(),
  async (req, res) => {
    if (req.method !== "PUT") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      await AuthMiddleware.verifyToken(req as any, res as any);
    } catch (error) {
      handleError(res, error, "users.http");
      return;
    }

    const { uid } = (req as any).user;

    try {
      await usersContainer.updateUserUseCase.execute(uid, req.body);
      res.status(204).send();

      return;
    } catch (error) {
      handleError(res, error, "users.http");
    }
  },
);
