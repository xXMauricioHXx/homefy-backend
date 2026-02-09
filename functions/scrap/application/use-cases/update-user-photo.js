class UpdateUserPhotoUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId, photoUrl) {
    console.log("[START] - Updating User photo");

    const existingUser = await this.firestoreAdapter.findById("users", userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    if (!photoUrl || photoUrl.trim() === "") {
      throw new Error("Photo URL is required");
    }

    console.log("[INFO] - Updating User photo in Firestore");
    await this.firestoreAdapter.setWithMerge("users", userId, {
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
