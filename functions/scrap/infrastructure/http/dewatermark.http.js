const fs = require("fs");

class DewatermarkHttp {
  constructor() {
    this.apiKey = process.env.DEWATERMARK_API_KEY;
    this.apiUrl = process.env.DEWATERMARK_API_URL;
  }

  async removeWaterMark(fileBuffer) {
    const API_KEY = this.apiKey;
    const url = this.apiUrl;

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

      const data = await response.json();

      if (!data.edited_image || !data.edited_image.image) {
        throw new Error("Invalid response from Dewatermark API");
      }

      const cleanedImageBase64 = data.edited_image.image;
      const cleanedBuffer = Buffer.from(cleanedImageBase64, "base64");

      return cleanedBuffer;
    } catch (error) {
      console.error("Error removing watermark:", error);

      throw error;
    }
  }

  buildFormData(fileBuffer) {
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

module.exports = {
  DewatermarkHttp,
};
