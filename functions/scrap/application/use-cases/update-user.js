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

    console.log(existingUser);

    console.log("[INFO] - Updating User in Firestore");
    await this.firestoreAdapter.setWithMerge("users", userId, {
      ...userData,
      updatedAt: new Date(),
    });

    console.log("[INFO] - User updated successfully with ID:", userId);
    return {
      id: userId,
      ...existingUser,
      ...userData,
      updatedAt: new Date(),
    };
  }
}

module.exports = {
  UpdateUserUseCase,
};
