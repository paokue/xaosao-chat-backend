const { MessageReaction } = require("../../../models");
const { updateFieldIfDefined } = require("../../../reusable/updatedFields");
const EmitDataInGroup = require("../Group/EmitDataInGroup");

const giveReactionOnMessage = async (req, res) => {
  const { conversation_id, reaction, message_id } = req.body; // Assuming message_id is required for the poll
  const user_id = req.authData.user_id;

  if (!reaction) {
    return res
      .status(400)
      .json({ success: false, message: "reaction is required" });
  }
  if (!message_id) {
    return res
      .status(400)
      .json({ success: false, message: "message_id is required" });
  }

  try {
    // Check if the user has already voted in this poll
    const existingReaction = await MessageReaction.findOne({
      where: { user_id, message_id },
    });

    if (existingReaction) {
      // Update existing vote instead of deleting and creating a new one
      await existingReaction.update({ reaction });
    } else {
      // Create a new vote if it doesn't exist
      let updateFields = {};
      updateFieldIfDefined(updateFields, "user_id", user_id);
      updateFieldIfDefined(updateFields, "reaction", reaction);
      updateFieldIfDefined(updateFields, "message_id", message_id);

      await MessageReaction.create(updateFields);
    }

    // Emit update_data event to notify the member is added to group
    await EmitDataInGroup(conversation_id, "update_reactions", {
      message_id,
      reaction,
      conversation_id,
      user_id,
    });

    return res.status(200).json({
      message: "Reaction to message",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { giveReactionOnMessage };
