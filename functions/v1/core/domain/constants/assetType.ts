export enum AssetType {
  MAIN = "MAIN",
  GALLERY = "GALLERY",
  HIGHLIGHT = "HIGHLIGHT",
}

export enum AssetStatus {
  PENDING = "PENDING",
  ORIGINAL_UPLOADED = "ORIGINAL_UPLOADED",
  CLEANED = "CLEANED",
  ERROR = "ERROR",
}

export interface AssetFile {
  url: string | null;
  provider?: string;
}
