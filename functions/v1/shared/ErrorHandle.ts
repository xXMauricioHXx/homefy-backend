import { AppException } from "../core/domain/exceptions/AppException";

export const handleError = (res: any, error: unknown, context: string) => {
  if (error instanceof AppException) {
    res
      .status(error.statusCode)
      .json({ error: error.message, code: error.code });
    return;
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[ERROR] ${context}:`, message);
  res.status(500).json({ error: "Internal server error" });
};
