const Telbiz = require("telbiz");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { User, Website_Setting } = require("../../models");
const twilio = require("twilio");

const baseUrl = process.env.baseUrl;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const jwtSecretKey = process.env.JWT_SECRET_KEY;

const tb = new Telbiz(
  process.env.TELBIZ_CLIENT_ID,
  process.env.TELBIZ_SECRETKEY
);

// Send OTP via SMS using Telbiz
const registerPhone = async (req, res) => {
  let { country_code, phone_number, country, country_full_name } = req.body;

  if (!phone_number || phone_number === "") {
    return res
      .status(400)
      .json({ message: "phone_number field is required!", success: false });
  }

  try {
    const checkUser = await User.findOne({
      where: { country_code, phone_number },
    });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000);
    const websiteData = await Website_Setting.findAll({ limit: 1 });
    const websiteName =
      websiteData[0]?.dataValues?.website_name || "Xaosao Chat";

    // Prepare message and phone number
    const fullPhone = `${country_code}${phone_number}`;
    const msg = `OTP from ${websiteName} is ${generatedOtp}.`;

    console.log("Phone number:", fullPhone);
    console.log("Phone number:", phone_number);

    // --- Send OTP via Telbiz ---
    tb.SendSMSAsync("OTP", phone_number, msg)
      .then(async (response) => {
        console.log("Telbiz response:", response);

        if (!checkUser) {
          // Create new user
          await User.create({
            phone_number,
            otp: generatedOtp,
            country_code,
            country,
            country_full_name,
          });
        } else {
          // Update existing user OTP
          await User.update(
            { otp: generatedOtp, country_code },
            {
              where: { country_code, phone_number },
            }
          );
        }

        return res
          .status(200)
          .json({ message: "OTP sent successfully!", success: true });
      })
      .catch((err) => {
        console.error("Telbiz error:", err);
        return res
          .status(500)
          .json({ message: "Failed to send OTP!", success: false });
      });
  } catch (error) {
    console.error("Error in registerPhone:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const verifyPhoneOtp = async (req, res) => {
  let { country_code, phone_number, otp, device_token, one_signal_player_id } =
    req.body;

  if (phone_number == "" || !phone_number) {
    return res
      .status(400)
      .json({ message: "phone_number field is required!", success: false });
  }

  if (country_code == "" || !country_code) {
    return res
      .status(400)
      .json({ message: "country_code field is required!", success: false });
  }

  if (otp == "" || !otp) {
    return res
      .status(400)
      .json({ message: "otp field is required!", success: false });
  }

  try {
    const resData = await User.findOne({
      where: { country_code, phone_number, otp },
    });
    // console.log("newResData", newResData);
    // console.log(resData);
    if (resData) {
      // console.log(newResData);
      const token = jwt.sign(resData.dataValues, jwtSecretKey);

      // Update Device Token ==================================================================
      User.update(
        { device_token, one_signal_player_id },
        {
          where: { country_code, phone_number },
        }
      );

      res.status(200).json({
        message: "Otp Verified",
        success: true,
        token: token,
        resData: resData,
        // is_require_filled,
      });
    } else {
      res.status(200).json({ message: "Invalid otp!", success: false });
    }
  } catch (error) {
    // Handle the Sequelize error and send it as a response to the client
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerPhone, verifyPhoneOtp };
