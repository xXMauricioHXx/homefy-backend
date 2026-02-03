class Pdf {
  constructor(data) {
    this.brand = data.brand;
    this.property = data.property;
    this.userId = data.userId;
    this.createdAt = data.createdAt?.toDate() || new Date();
    this.updatedAt = data.updatedAt?.toDate() || new Date();
    this.pdfId = data.pdfId;
    this.config = data.config || null;

    this.validate();
  }

  validate() {
    if (!this.brand || !this.brand.name) {
      throw new Error("Brand name is required");
    }

    if (!this.property || !this.property.resume) {
      throw new Error("Property resume is required");
    }

    if (!this.userId) {
      throw new Error("User ID is required");
    }

    if (!this.pdfId) {
      throw new Error("PDF ID is required");
    }
  }

  toFirestore() {
    return {
      brand: this.brand,
      property: this.property,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      pdfId: this.pdfId,
      config: this.config,
    };
  }
}

module.exports = {
  Pdf,
};
