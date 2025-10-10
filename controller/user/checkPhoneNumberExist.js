const { User } = require("../../models");

const checkPhoneNumberExist = async (req, res) => {
  let { phone_number } = req.body;
  // const authData = jwt.verify(req.authToken, jwtSecretKey);

  if (phone_number == "" || !phone_number) {
    return res
      .status(400)
      .json({ message: "phone_number field is required!", success: false });
  }

  try {
    const resData = await User.findOne({
      where: {
        phone_number: phone_number,
      },
    });

    if (resData == null) {
      return res.status(200).json({
        message: `${phone_number} is available!`,
        success: true,
      });
    } else {
      return res.status(200).json({
        message: `${phone_number} is allready registered!`,
        success: false,
      });
    }
  } catch (error) {
    // Handle the Sequelize error and send it as a response to the client
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkPhoneNumberExist };
