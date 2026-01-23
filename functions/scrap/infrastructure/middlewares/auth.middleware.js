const { getAuth } = require("firebase-admin/auth");

class AuthMiddleware {
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Unauthorized - No token provided",
        });
      }

      const token = authHeader.split("Bearer ")[1];

      if (!token) {
        return res.status(401).json({
          error: "Unauthorized - Invalid token format",
        });
      }

      const decodedToken = await getAuth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };

      next();
    } catch (error) {
      console.error("[ERROR] - Token verification failed:", error);
      return res.status(401).json({
        error: "Unauthorized - Invalid token",
      });
    }
  }
}

module.exports = {
  AuthMiddleware,
};
