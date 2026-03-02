export class Brand {
  private constructor(
    readonly name: string,
    readonly location: string,
    readonly headline: string,
  ) {}

  static create(name: string, location: string, headline: string): Brand {
    return new Brand(name, location, headline);
  }

  getValue(): { name: string; location: string; headline: string } {
    return {
      name: this.name,
      location: this.location,
      headline: this.headline,
    };
  }
}
