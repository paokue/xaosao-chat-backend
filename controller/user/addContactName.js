const { AllContact, User } = require("../../models");

const addContactName = async (req, res) => {
  let { phone_number, full_name, added_by_me, user_id } = req.body;
  // added_by_me is user
  // user_id is model

  console.log("Credentials:::", phone_number, full_name, added_by_me);

  if (!phone_number || phone_number == "") {
    return res
      .status(400)
      .json({ success: false, message: "phone_number field is required" });
  }
  if (!full_name || full_name == "") {
    return res
      .status(400)
      .json({ success: false, message: "full_name field is required" });
  }

  try {
    // const user_id = req.authData.user_id;
    let message;
    const isContactExist = await AllContact.findOne({
      where: {
        user_id: user_id,
        phone_number: phone_number,
        added_by_me: added_by_me,
      },
    });

    if (isContactExist) {
      console.log("Founded on contact!");
      await AllContact.update(
        { full_name: full_name },
        {
          where: {
            user_id: user_id,
            phone_number: phone_number,
            full_name: full_name,
            added_by_me: added_by_me,
          },
        }
      );
      message = "Contact Updated Successfully";
    } else {
      console.log("AAADDDD::", added_by_me, phone_number);
      let userDetails = await User.findOne({
        where: {
          user_id: user_id,
          phone_number: phone_number,
        },
      });

      console.log("User Details::", userDetails);

      if (userDetails) {
        console.log("Found on user!");
        await AllContact.create({
          phone_number: phone_number,
          full_name: full_name,
          user_id: user_id,
          added_by_me: added_by_me,
        });
        message = "Contact Added Successfully!";
      } else {
        message = "Contact Added failed!";
      }
    }

    // Get user_id
    const userData = await User.findOne({
      attributes: ["user_id"],
      where: { phone_number },
    });
    // console.log(userData, "userData");
    return res.status(200).json({
      message: message,
      success: true,
      user_id: userData.user_id,
    });
  } catch (error) {
    console.error("PK Error:::", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addContactName };
