export interface ScrapedBrand {
  name: string;
  location: string;
  headline: string;
}

export interface ScrapedDetails {
  title: string;
  description: string;
  features: string[];
  infrastructures: string[];
  areaSqm: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
}

export interface ScrapedPricing {
  priceText: string;
  pricePerSqmText: string;
  condominiumText: string;
  iptuText: string;
}

export interface ScrapedSource {
  providerKey: string;
  url: string;
}

export interface ScrapedData {
  source: ScrapedSource;
  brand: ScrapedBrand;
  details: ScrapedDetails;
  images: string[];
  pricing: ScrapedPricing;
}
