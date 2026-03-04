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
  console.error(`[ERROR STACK] ${context}:`, (error as any)?.stack);
  console.error(`[ERROR STACK] ${error}`);
  res.status(500).json({ error: "Internal server error" });
};
