class UpdateUserPhotoUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId, photoUrl) {
    console.log("[START] - Updating User photo");

    // Verify if user exists
    const existingUser = await this.firestoreAdapter.findById("users", userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate photoUrl
    if (!photoUrl || photoUrl.trim() === "") {
      throw new Error("Photo URL is required");
    }

    // Update only the photoUrl field
    console.log("[INFO] - Updating User photo in Firestore");
    await this.firestoreAdapter.update("users", userId, {
      photoUrl: photoUrl,
      updatedAt: new Date(),
    });

    console.log("[INFO] - User photo updated successfully for ID:", userId);
    return {
      id: userId,
      photoUrl: photoUrl,
      updatedAt: new Date(),
    };
  }
}

module.exports = {
  UpdateUserPhotoUseCase,
};
