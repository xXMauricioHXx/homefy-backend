import { getAuth } from "firebase-admin/auth";
import { Request, Response } from "express";
import { UnauthorizedException } from "../../domain/exceptions/UnauthorizedException";

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException("Unauthorized - No token provided");
      }

      const token = authHeader.split("Bearer ")[1];

      if (!token) {
        throw new UnauthorizedException("Unauthorized - Invalid token format");
      }

      const decodedToken = await getAuth().verifyIdToken(token);

      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      console.error("[ERROR] - Token verification failed:", error);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Unauthorized - Invalid token");
    }
  }
}
