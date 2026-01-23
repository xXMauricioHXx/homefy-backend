class Pdf {
  constructor(data) {
    this.brand = data.brand;
    this.property = data.property;
    this.userId = data.userId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

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
  }

  toFirestore() {
    return {
      brand: this.brand,
      property: this.property,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = {
  Pdf,
};
