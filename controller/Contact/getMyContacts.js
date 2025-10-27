const { Op } = require("sequelize");
const { User, AllContact, App_Flow } = require("../../models");

const getMyContacts = async (req, res) => {
  const user_id = req.authData.user_id;
  console.log("USER_ID::", user_id);

  let { page = 1, per_page_message = 50, full_name } = req.body;

  try {
    page = parseInt(page);
    const limit = parseInt(per_page_message);
    const offset = (page - 1) * limit;

    const App_FlowData = await App_Flow.findOne({
      attributes: ["isContact"],
    });

    // Build where conditions
    let whereConditions = {
      added_by_me: user_id, // Filter by added_by_me
    };

    console.log("whereConditions before:", whereConditions);

    // Add full_name search if provided
    if (full_name && full_name.trim() !== "") {
      whereConditions.full_name = { [Op.like]: `%${full_name.trim()}%` };
    }

    console.log("whereConditions after:", whereConditions);

    // Fetch contacts added by the user
    const myContacts = await AllContact.findAll({
      where: whereConditions,
      attributes: [
        "contact_id",
        "phone_number",
        "email_id",
        "full_name",
        "user_id",
        "added_by_me",
        "createdAt",
      ],
      limit,
      offset,
    });

    console.log("MY CONTACTS::", myContacts);

    let savedContacts = [];

    // If isContact is enabled, also fetch contacts who use the app
    if (App_FlowData.isContact == "1") {
      const savedWhereConditions = {
        user_id: { [Op.ne]: user_id }, // Exclude the current user
      };

      // Add full_name search if provided
      if (full_name && full_name.trim() !== "") {
        savedWhereConditions.full_name = {
          [Op.like]: `%${full_name.trim()}%`,
        };
      }

      savedContacts = await AllContact.findAll({
        where: savedWhereConditions,
        attributes: [
          "contact_id",
          "phone_number",
          "email_id",
          "full_name",
          "user_id",
          "createdAt",
        ],
        limit,
        offset,
      });

      console.log("SAVED CONTACTS::", savedContacts);
    }

    // Deduplicate and prioritize myContacts
    const uniqueContactsMap = new Map();

    const getContactKey = (contact) => {
      return (
        contact.phone_number || contact.email_id || `${contact.contact_id}`
      );
    };

    // First add myContacts (priority)
    myContacts.forEach((contact) => {
      console.log("\x1b[32m", "myContacts", contact.toJSON(), "\x1b[0m");
      uniqueContactsMap.set(getContactKey(contact), contact);
    });

    // Then add savedContacts (if not already in map)
    if (App_FlowData.isContact == "1") {
      savedContacts.forEach((contact) => {
        console.log("\x1b[32m", "savedContacts", contact.toJSON(), "\x1b[0m");
        const key = getContactKey(contact);
        if (!uniqueContactsMap.has(key)) {
          uniqueContactsMap.set(key, contact);
        }
      });
    }

    const uniqueContacts = Array.from(uniqueContactsMap.values());

    // Fetch user details for each unique contact
    const updatedContactList = await Promise.all(
      uniqueContacts.map(async (contact) => {
        const whereClause = contact.phone_number
          ? { phone_number: contact.phone_number }
          : contact.email_id
          ? { email_id: contact.email_id }
          : null;

        let userDetails = null;
        if (whereClause) {
          userDetails = await User.findOne({
            where: whereClause,
            attributes: [
              "profile_image",
              "user_id",
              "user_name",
              "email_id",
              "createdAt",
            ],
          });
        }

        return {
          ...contact.toJSON(),
          userDetails,
        };
      })
    );

    // Count total contacts added by user (for pagination)
    const AllContactCount = await AllContact.count({
      where: whereConditions,
    });

    console.log("UPDATED CONTACT LIST:::", updatedContactList);

    return res.status(200).json({
      success: true,
      message: "Contact list of who use our app",
      myContactList: updatedContactList,
      pagination: {
        count: AllContactCount,
        currentPage: page,
        totalPages: Math.ceil(AllContactCount / limit),
      },
    });
  } catch (error) {
    console.error("GET_MY_CONTACTS_ERROR:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to fetch contacts",
    });
  }
};

module.exports = { getMyContacts };
