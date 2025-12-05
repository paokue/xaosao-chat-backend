const { User } = require("../../models");
const { updateFieldIfDefined } = require("../../reusable/updatedFields");

const updateUserProfile = async (req, res) => {
  const user_id = req.authData.user_id;

  const { phone_number, first_name, last_name, profile_image } = req.body;

  try {
    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Build update fields object
    const updateFields = {};

    updateFieldIfDefined(updateFields, "phone_number", phone_number);
    updateFieldIfDefined(updateFields, "first_name", first_name);
    updateFieldIfDefined(updateFields, "last_name", last_name);
    updateFieldIfDefined(updateFields, "profile_image", profile_image);

    // Always update updatedAt
    updateFields.updatedAt = new Date();

    // Check if there are fields to update
    if (Object.keys(updateFields).length === 1) {
      // Only updatedAt, no actual fields to update
      return res.status(400).json({
        message: "No fields to update",
        success: false,
      });
    }

    // Update user
    await User.update(updateFields, {
      where: { user_id },
    });

    // Fetch updated user data
    const updatedUser = await User.findByPk(user_id, {
      attributes: {
        exclude: ["otp", "password"],
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Failed to update profile",
      success: false,
      error: error.message,
    });
  }
};

module.exports = { updateUserProfile };
