const { User, AllContact, App_Flow } = require("../../models");
const { Op } = require("sequelize");

const getMyContacts = async (req, res) => {
  const user_id = req.authData.user_id;
  let { page = 1, per_page_message = 50, full_name } = req.body;

  try {
    page = parseInt(page);
    const limit = parseInt(per_page_message);
    const offset = (page - 1) * limit;

    const App_FlowData = await App_Flow.findOne({
      attributes: ["isContact"],
    });

    let updatedFields = {};

    console.log(updatedFields, "updatedFields before");

    if (full_name && full_name !== "") {
      updatedFields.full_name = { [Op.like]: `%${full_name}%` };
    }
    console.log(updatedFields, "updatedFields after");

    // Fetch saved contacts
    const savedContacts = await AllContact.findAll({
      // where: { ...updatedFields, user_id: user_id },
      where: { ...updatedFields, user_id: { [Op.ne]: user_id } },
      attributes: [
        "contact_id",
        "phone_number",
        "email_id",
        "full_name",
        "user_id",
      ],
      // group: ["phone_number", "email_id"],
      limit,
      offset,
    });

    let allContacts;
    if (App_FlowData.isContact == "1") {
      console.log("{ ...updatedFields, added_by_me: true }", {
        ...updatedFields,
        added_by_me: true,
      });
      // Fetch all contacts as fallback
      allContacts = await AllContact.findAll({
        where: updatedFields.full_name
          ? { ...updatedFields, added_by_me: true }
          : { added_by_me: true },
        attributes: [
          "contact_id",
          "phone_number",
          "email_id",
          "full_name",
          "user_id",
        ],
        distinct: true,
        limit,
        offset,
      });
    }

    // Deduplicate and prioritize savedContacts
    const uniqueContactsMap = new Map();

    const getContactKey = (contact) => {
      return (
        contact.phone_number || contact.email_id || `${contact.contact_id}`
      );
    };

    savedContacts.forEach((contact) => {
      console.log("\x1b[32m", "savedContacts", contact.toJSON(), "\x1b[0m");
      uniqueContactsMap.set(getContactKey(contact), contact);
    });

    if (App_FlowData.isContact == "1") {
      allContacts.forEach((contact) => {
        console.log("\x1b[32m", "allContacts", contact.toJSON(), "\x1b[0m");
        const key = getContactKey(contact);
        if (!uniqueContactsMap.has(key)) {
          uniqueContactsMap.set(key, contact);
        }
      });
    }
    const uniqueContacts = Array.from(uniqueContactsMap.values());

    // Fetch user details for each unique contact
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
            attributes: ["profile_image", "user_id", "user_name", "email_id"],
          });
        }

        return {
          ...contact.toJSON(),
          userDetails,
        };
      })
    );

    const AllContactCount = await AllContact.count({
      where: updatedFields,
    });

    console.log("AAAA--BBBB:::", updatedContactList);

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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMyContacts };
