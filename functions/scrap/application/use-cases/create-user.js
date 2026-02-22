const { User } = require("../../domain/entities/user.entity");

class CreateUserUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userData) {
    console.log("[START] - Creating User entity");

    const userExists = await this.firestoreAdapter.findById(
      "users",
      userData.id,
    );

    if (userExists) {
      return userExists;
    }

    console.log("[INFO] - Checking email and phone uniqueness");

    const [emailInUse, phoneInUse] = await Promise.all([
      this.firestoreAdapter.findByField("users", "email", userData.email),
      this.firestoreAdapter.findByField("users", "phone", userData.phone),
    ]);

    if (emailInUse) {
      throw new Error(`Email '${userData.email}' already in use`);
    }

    if (phoneInUse) {
      throw new Error(`Phone '${userData.phone}' already in use`);
    }

    const userEntity = new User({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      id: userData.id,
    });

    console.log("[INFO] - Saving User to Firestore");
    const userId = await this.firestoreAdapter.saveWithId(
      "users",
      userEntity.id,
      userEntity.toFirestore(),
    );

    console.log("[INFO] - User saved successfully with ID:", userId);
    return {
      id: userId,
      ...userEntity.toFirestore(),
    };
  }
}

module.exports = {
  CreateUserUseCase,
};
