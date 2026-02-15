const { getAuth } = require("firebase-admin/auth");

class AuthMiddleware {
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const error = new Error("Unauthorized - No token provided");
        error.status = 401;
        return next(error);
      }

      const token = authHeader.split("Bearer ")[1];

      if (!token) {
        const error = new Error("Unauthorized - Invalid token format");
        error.status = 401;
        return next(error);
      }

      const decodedToken = await getAuth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };

      next();
    } catch (error) {
      console.error("[ERROR] - Token verification failed:", error);
      const authError = new Error("Unauthorized - Invalid token");
      authError.status = 401;
      return next(authError);
    }
  }
}

module.exports = {
  AuthMiddleware,
};
