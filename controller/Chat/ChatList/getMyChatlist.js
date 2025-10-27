const {
  User,
  Chat,
  ClearAllChat,
  Block,
  Conversation,
  ConversationsUser,
  AllContact,
  Archive,
  DeletedChatList,
} = require("../../../models");
const { Op } = require("sequelize");

const getMyChatList = async (req, res) => {
  const user_id = req.authData.user_id;

  console.log("📥 GET CHAT LIST API ::: user_id =", user_id);

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "user_id is required" });
  }

  try {
    // Fetch user conversations
    const userConversations = await ConversationsUser.findAll({
      where: { user_id },
      include: [{ model: Conversation }],
      order: [[Conversation, "updatedAt", "DESC"]],
    });

    const chatList = [];

    for (const conversationUser of userConversations) {
      const conversation = conversationUser.Conversation;
      const conversationId = conversation.conversation_id;

      const isBlocked = await Block.findOne({
        where: { user_id, conversation_id: conversationId },
      });

      const clearAllChatRes = await ClearAllChat.findOne({
        where: { user_id, conversation_id: conversationId },
        order: [["updatedAt", "DESC"]],
      });

      let findLastMessage;
      let unread_count = 0;

      if (isBlocked) {
        findLastMessage = await Chat.findOne({
          where: { message_id: isBlocked.message_id_before_block },
          order: [["message_id", "DESC"]],
          limit: 1,
        });
      } else {
        findLastMessage = await Chat.findOne({
          where: { conversation_id: conversationId },
          order: [["message_id", "DESC"]],
          limit: 1,
        });

        const unread_messages = await Chat.findAll({
          where: {
            message_read: 0,
            conversation_id: conversationId,
          },
          attributes: ["who_seen_the_message"],
          order: [["message_id", "DESC"]],
        });

        unread_messages.forEach((message) => {
          const seenUsers = message.who_seen_the_message.split(",");
          if (!seenUsers.includes(String(user_id))) unread_count++;
        });
      }

      const isCleared =
        String(clearAllChatRes?.message_id) ===
        String(conversation.last_message_id);

      const isDeletedForMe = findLastMessage?.dataValues?.delete_for_me
        ?.split(",")
        ?.includes(String(user_id));

      const last_message = isCleared
        ? ""
        : conversation.last_message_type === "delete_from_everyone"
        ? conversation.last_message
        : isDeletedForMe
        ? "🚫 You deleted this message!"
        : isBlocked
        ? findLastMessage?.dataValues?.message
        : conversation.last_message;

      const last_message_type = isCleared
        ? ""
        : conversation.last_message_type === "delete_from_everyone"
        ? "text"
        : isDeletedForMe
        ? "text"
        : isBlocked
        ? findLastMessage?.dataValues?.message_type
        : conversation.last_message_type;

      let chatDetail = {
        conversation_id: conversationId,
        is_group: conversation.is_group,
        group_name: conversation.group_name,
        group_profile_image: conversation.group_profile_image,
        last_message,
        last_message_type,
        user_id: 0,
        user_name: "",
        phone_number: "",
        profile_image: "",
        is_block: !!isBlocked,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        unread_count,
        public_group: conversation.public_group,
      };

      // Non-group chat → get other user
      if (!conversation.is_group) {
        const otherUser = await ConversationsUser.findOne({
          where: {
            conversation_id: conversationId,
            user_id: { [Op.ne]: user_id },
          },
          include: [{ model: User }],
        });

        if (otherUser) {
          let userDetails = null;
          const phone = otherUser.User.phone_number;

          if (phone && phone.trim() !== "") {
            userDetails = await AllContact.findOne({
              where: { phone_number: phone, user_id },
              attributes: ["full_name"],
            });
          }

          chatDetail = {
            ...chatDetail,
            user_id: otherUser.user_id,
            user_name:
              userDetails?.full_name ||
              `${otherUser.User.first_name} ${otherUser.User.last_name}`,
            profile_image: otherUser.User.profile_image,
            phone_number: phone,
          };
        }
      }

      chatList.push(chatDetail);
    }

    // Separate archive and deleted
    const newChatList = [];
    const archiveList = [];

    for (const chat of chatList) {
      const isArchived = await Archive.findOne({
        where: { user_id, conversation_id: chat.conversation_id },
      });

      const isDeleted = await DeletedChatList.findOne({
        where: { user_id, conversation_id: chat.conversation_id },
      });

      if (isDeleted) continue;
      if (isArchived) archiveList.push(chat);
      else newChatList.push(chat);
    }

    console.log("✅ ChatList ready:", newChatList.length);

    return res.json({
      success: true,
      chatList: newChatList,
      archiveList,
    });
  } catch (error) {
    console.error("❌ getChatList error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations!",
      error: error.message,
    });
  }
};

module.exports = { getMyChatList };
