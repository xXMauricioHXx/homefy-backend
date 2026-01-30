const { User } = require("../../domain/entities/user.entity");

class UpdateUserUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId, userData) {
    console.log("[START] - Updating User entity");

    // Verify if user exists
    const existingUser = await this.firestoreAdapter.findById("users", userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Create updated user entity with validation
    const updatedUserEntity = new User({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      createdAt: existingUser.createdAt,
      id: userId,
    });

    console.log("[INFO] - Updating User in Firestore");
    await this.firestoreAdapter.update(
      "users",
      userId,
      updatedUserEntity.toFirestore(),
    );

    console.log("[INFO] - User updated successfully with ID:", userId);
    return {
      id: userId,
      ...updatedUserEntity.toFirestore(),
    };
  }
}

module.exports = {
  UpdateUserUseCase,
};
