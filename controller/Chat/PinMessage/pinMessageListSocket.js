const {
  PinMessage,
  Chat,
  User,
  Conversation,
  ConversationsUser,
  AllContact,
  DeleteMessage,
} = require("../../../models");
const { updateFieldIfDefined } = require("../../../reusable/updatedFields");

const pinMessageListSocket = async (io, socket, data) => {
  try {
    let { conversation_id } = data;
    const user_id = socket.handshake.query.user_id; // from socket connection query

    let updateFields = {};
    updateFieldIfDefined(updateFields, "conversation_id", conversation_id);

    let PinMessageList = await PinMessage.findAll({
      include: [
        {
          model: User,
          attributes: [
            "profile_image",
            "user_id",
            "phone_number",
            "first_name",
            "last_name",
            "user_name",
          ],
        },
        {
          model: Chat,
          where: updateFields,
          include: [
            {
              model: Conversation,
              attributes: [
                "group_profile_image",
                "conversation_id",
                "is_group",
                "group_name",
              ],
            },
          ],
        },
      ],
      order: [["pin_message_id", "DESC"]],
    });

    let modifiedData = [];
    for (let item of PinMessageList) {
      item = item.get();

      // Skip deleted messages
      const isDeleted = await DeleteMessage.findOne({
        where: {
          user_id: user_id,
          message_id: item.Chat.message_id,
        },
      });
      if (isDeleted) continue;

      // Get conversation users
      let userList = await ConversationsUser.findAll({
        where: {
          conversation_id: item.Chat.conversation_id,
        },
        include: [
          {
            model: User,
            attributes: [
              "profile_image",
              "user_id",
              "phone_number",
              "first_name",
              "last_name",
              "user_name",
            ],
          },
        ],
      });

      // Handle private chat (non-group)
      if (item.Chat.Conversation.is_group == false) {
        let updatedUserList = await Promise.all(
          userList
            .filter((convUser) => convUser.user_id !== user_id)
            .map(async (user) => {
              user = user.toJSON();
              item.other_user_id = user.user_id;

              let userDetails = await AllContact.findOne({
                where: {
                  phone_number: user.User.phone_number,
                  user_id,
                },
                attributes: ["full_name"],
              });

              if (userDetails) {
                user.User.first_name =
                  userDetails.full_name.split(" ")[0] || user.User.first_name;
                user.User.last_name =
                  userDetails.full_name.split(" ")[1] || user.User.last_name;
              }
              return user.User;
            })
        );
        item.otherUserDetails = updatedUserList;
      } else {
        // Group chat
        item.otherUserDetails = [];
        item.other_user_id = 0;
      }
      modifiedData.push(item);
    }

    // ✅ Emit back to this specific socket
    socket.emit("pinMessageList", {
      success: true,
      message: "Pin message list",
      PinMessageList: modifiedData,
    });
  } catch (error) {
    console.error(error);
    socket.emit("error", { error: error.message });
  }
};

module.exports = { pinMessageListSocket };
