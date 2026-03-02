export interface PropertyPricing {
  priceText?: string;
  pricePerSqmText?: string;
  condominiumText?: string;
  iptuText?: string;
}

export class PropertyDetails {
  private constructor(
    readonly title: string,
    readonly description: string,
    readonly areaSqm: string,
    readonly bedrooms: number,
    readonly bathrooms: number,
    readonly parking: number | null,
    readonly pricing: PropertyPricing,
    readonly features: string[],
    readonly infrastructures: string[],
  ) {}

  static create(
    title: string,
    description: string,
    areaSqm: string,
    bedrooms: number,
    bathrooms: number,
    parking: number | null,
    pricing: PropertyPricing,
    features: string[],
    infrastructures: string[],
  ): PropertyDetails {
    return new PropertyDetails(
      title,
      description,
      areaSqm,
      bedrooms,
      bathrooms,
      parking,
      pricing,
      features,
      infrastructures,
    );
  }

  getValue(): {
    title: string;
    description: string;
    areaSqm: string;
    bedrooms: number;
    bathrooms: number;
    parking: number | null;
    pricing: PropertyPricing;
    features: string[];
    infrastructures: string[];
  } {
    return {
      title: this.title,
      description: this.description,
      areaSqm: this.areaSqm,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      parking: this.parking,
      pricing: this.pricing,
      features: this.features,
      infrastructures: this.infrastructures,
    };
  }
}
