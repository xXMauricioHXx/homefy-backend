import { PropertyPricing } from "../../domain/value-objects/PropertyDetails";

export interface CreatePropertyDto {
  source: {
    providerKey: string;
    url: string;
  };
  brand: {
    name: string;
    location: string;
    headline: string;
  };
  details: {
    title: string;
    description: string;
    areaSqm: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
    features: string[];
    infrastructures: string[];
  };
  pricing: {
    priceText: string;
    pricePerSqmText: string;
    condominiumText: string;
    iptuText: string;
  };
  images: string[];
}

export interface UpdatePropertyDto {
  brand?: {
    location?: string;
    headline?: string;
  };
  details?: {
    title?: string;
    description?: string;
    areaSqm?: string;
    bedrooms?: number;
    bathrooms?: number;
    parking?: number | null;
    pricing?: PropertyPricing;
    features?: string[];
    infrastructures?: string[];
  };
}

export interface UpdatePropertyStatusDto {
  status: string;
}
