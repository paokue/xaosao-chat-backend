const Telbiz = require("telbiz");
const jwt = require("jsonwebtoken");
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const { User, Website_Setting } = require("../../models");

const tb = new Telbiz(
  process.env.TELBIZ_CLIENT_ID,
  process.env.TELBIZ_SECRETKEY
);

const registerWithoutOtp = async (req, res) => {
  try {
    const {
      user_id,
      country_code,
      phone_number,
      country,
      country_full_name,
      device_token,
      one_signal_player_id,
      email_id,
      first_name,
      last_name,
      profile_image,
    } = req.body;

    // 🧩 Validate required fields
    if (!phone_number || !country_code) {
      return res.status(400).json({
        message: "country_code and phone_number are required!",
        success: false,
      });
    }

    let user = await User.findOne({
      where: { country_code, phone_number },
    });

    // If not, create a new user
    if (!user) {
      user = await User.create({
        user_id,
        phone_number,
        country_code,
        country: country || "",
        country_full_name: country_full_name || "",
        email_id: email_id || "",
        first_name: first_name || "",
        last_name: last_name || "",
        device_token: device_token || "",
        one_signal_player_id: one_signal_player_id || "",
        profile_image: profile_image || "",
      });
    } else {
      // Update device info if user already exists
      await user.update({
        device_token: device_token || "",
        one_signal_player_id: one_signal_player_id || "",
        profile_image: profile_image || user.profile_image || "",
      });
    }

    // 🪪 Create JWT Token
    const token = jwt.sign(user.dataValues, jwtSecretKey);

    return res.status(200).json({
      message: "User registered successfully!",
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("Error in registerWithoutOtp:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};

const loginWithPhone = async (req, res) => {
  const { phone_number, device_token, one_signal_player_id } = req.body;

  console.log(
    "Login Request:",
    phone_number,
    device_token,
    one_signal_player_id
  );

  // Basic validation
  if (!phone_number || phone_number.trim() === "") {
    return res
      .status(400)
      .json({ message: "phone_number field is required!", success: false });
  }

  try {
    // ✅ Find user only by phone number
    const user = await User.findOne({ where: { phone_number } });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found!", success: false });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(user.dataValues, jwtSecretKey, {
      expiresIn: "90d", // optional expiration time
    });

    // ✅ Update device token info if provided
    if (device_token || one_signal_player_id) {
      await User.update(
        { device_token, one_signal_player_id },
        { where: { phone_number } }
      );
    }

    // ✅ Return success
    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};

// Send OTP via SMS using Telbiz
const registerPhone = async (req, res) => {
  let { country_code, phone_number, country, country_full_name } = req.body;

  console.log(req.bod);

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
            user_id: "68736924b2574f63f8ee5578",
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

  console.log(
    "Request DATA:::",
    country_code,
    phone_number,
    otp,
    device_token,
    one_signal_player_id
  );

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

module.exports = {
  registerWithoutOtp,
  loginWithPhone,
  registerPhone,
  verifyPhoneOtp,
};
