const { Op } = require("sequelize");
const { User, AllContact } = require("../../models");

const getMyContacts = async (req, res) => {
  const user_id = req.authData.user_id;
  console.log("USER_ID::", user_id);

  let { page = 1, per_page_message = 50, full_name } = req.body;

  try {
    page = parseInt(page);
    const limit = parseInt(per_page_message);
    const offset = (page - 1) * limit;

    // Build where conditions - only show contacts added by this user
    let whereConditions = {
      added_by_me: user_id,
    };

    // Add full_name search if provided
    if (full_name && full_name.trim() !== "") {
      whereConditions.full_name = { [Op.like]: `%${full_name.trim()}%` };
    }

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

    // Fetch user details for each contact
    const updatedContactList = await Promise.all(
      myContacts.map(async (contact) => {
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
