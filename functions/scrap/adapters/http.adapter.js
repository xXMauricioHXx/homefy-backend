class HttpAdapter {
  async get(url, resultType = "json") {
    try {
      console.log(`Fetching data from ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (resultType === "json") {
        return response.json();
      }

      if (resultType === "text") {
        return response.text();
      }

      if (resultType === "arrayBuffer") {
        const contentType = response.headers.get("content-type");
        const arrayBuffer = await response.arrayBuffer();

        return { contentType, arrayBuffer };
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
}

module.exports = {
  HttpAdapter,
};
