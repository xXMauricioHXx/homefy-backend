export class HttpClient {
  private static instance: HttpClient;

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP GET ${url} failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP POST ${url} failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getBuffer(
    url: string,
  ): Promise<{ contentType: string; arrayBuffer: ArrayBuffer }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP GET ${url} failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();

    return { contentType, arrayBuffer };
  }
}
