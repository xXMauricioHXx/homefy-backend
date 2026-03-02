export class PropertySource {
  private constructor(
    readonly providerKey: string,
    readonly url: string | null,
    readonly fingerprint: string,
  ) {}

  static create(
    providerKey: string,
    url: string | null,
    fingerprint: string,
  ): PropertySource {
    return new PropertySource(providerKey, url, fingerprint);
  }

  getValue(): { providerKey: string; url: string | null; fingerprint: string } {
    return {
      providerKey: this.providerKey,
      url: this.url,
      fingerprint: this.fingerprint,
    };
  }
}
