export class DewatermarkHttp {
  private apiKey: string;

  private static instance: DewatermarkHttp;

  constructor() {
    this.apiKey = process.env.DEWATERMARK_API_KEY || "";
  }

  public static getInstance(): DewatermarkHttp {
    if (!DewatermarkHttp.instance) {
      DewatermarkHttp.instance = new DewatermarkHttp();
    }
    return DewatermarkHttp.instance;
  }

  async removeWaterMark(fileBuffer: Buffer): Promise<Buffer> {
    const API_KEY = this.apiKey;
    const url =
      "https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark";

    if (!API_KEY) {
      console.warn(
        "DEWATERMARK_API_KEY not found. Skipping watermark removal.",
      );

      throw new Error("API Key missing");
    }

    const formData = this.buildFormData(fileBuffer);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Dewatermark API error: ${response.status} ${errorText}`,
        );
      }

      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText) as {
          edited_image?: {
            image: string;
          };
        };

        if (!data.edited_image || !data.edited_image.image) {
          console.warn(
            "Invalid response format from Dewatermark API:",
            responseText,
          );
          return fileBuffer;
        }

        const cleanedImageBase64 = data.edited_image.image;
        return Buffer.from(cleanedImageBase64, "base64");
      } catch (parseError) {
        console.error("Error parsing Dewatermark API response:", responseText);
        return fileBuffer;
      }
    } catch (error) {
      console.error("Error removing watermark process:", error);
      return fileBuffer;
    }
  }

  buildFormData(fileBuffer: Buffer): FormData {
    const formData = new FormData();

    const blob = new Blob([fileBuffer], { type: "image/jpeg" });

    formData.append(
      "original_preview_image",
      blob,
      "original_preview_image.jpeg",
    );
    formData.append("remove_text", "true");
    formData.append("predict_mode", "3.0");

    return formData;
  }
}
