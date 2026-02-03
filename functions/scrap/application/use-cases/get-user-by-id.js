const { User } = require("../../domain/entities/user.entity");

class GetUserByIdUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId) {
    console.log("[START] - Fetching user by ID:", userId);

    const user = await this.firestoreAdapter.findById("users", userId);

    if (!user) {
      throw new Error("User not found");
    }

    console.log("[INFO] - User found with ID:", userId);

    return new User(user);
  }
}

module.exports = {
  GetUserByIdUseCase,
};
