class User {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.photoUrl = data.photoUrl || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.id = data.id;

    this.validate();
  }

  validate() {
    if (!this.id || this.id.trim() === "") {
      throw new Error("ID is required");
    }

    if (!this.name || this.name.trim() === "") {
      throw new Error("Name is required");
    }

    if (!this.email || this.email.trim() === "") {
      throw new Error("Email is required");
    }

    if (!this.phone || this.phone.trim() === "") {
      throw new Error("Phone is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format");
    }
  }

  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      photoUrl: this.photoUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = {
  User,
};
