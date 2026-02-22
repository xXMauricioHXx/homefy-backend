class UpdateUserUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId, userData) {
    console.log("[START] - Updating User entity");

    const existingUser = await this.firestoreAdapter.findById("users", userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    console.log("[INFO] - User updated successfully with ID:", userId);
    return {
      id: userId,
      ...existingUser,
      name: userData.name,
      updatedAt: new Date(),
    };
  }
}

module.exports = {
  UpdateUserUseCase,
};
