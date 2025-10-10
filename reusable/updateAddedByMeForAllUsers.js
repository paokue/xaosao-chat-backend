const { User, AllContact } = require("../models"); // Adjust the path to your models

// for phone_number
const updateAddedByMeForAllUsers = async () => {
  try {
    // Step 1: Fetch all users with user_id and phone_number
    const users = await User.findAll({
      attributes: ["user_id", "phone_number"],
    });

    // Step 2: Loop over each user and update AllContact
    for (const user of users) {
      const { user_id, phone_number } = user;

      const [updatedCount] = await AllContact.update(
        { added_by_me: true },
        {
          where: {
            user_id: user_id,
            phone_number: phone_number,
          },
        }
      );

      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} contacts for user_id ${user_id}`);
      }
    }

    console.log("Update process completed for all users.");
  } catch (err) {
    console.error("Error during bulk update:", err);
  }
};

module.exports = updateAddedByMeForAllUsers;

const { User, AllContact } = require("../models"); // Adjust the path to your models

// for email
// const updateAddedByMeForAllUsers = async () => {
//   try {
//     // Step 1: Fetch all users with user_id and email_id
//     const users = await User.findAll({
//       attributes: ["user_id", "email_id"],
//     });

//     // Step 2: Loop over each user and update AllContact
//     for (const user of users) {
//       const { user_id, email_id } = user;

//       if (!email_id) continue; // Skip empty emails

//       const [updatedCount] = await AllContact.update(
//         { added_by_me: true },
//         {
//           where: {
//             user_id: user_id,
//             email_id: email_id,
//           },
//         }
//       );

//       if (updatedCount > 0) {
//         console.log(`Updated ${updatedCount} contacts by email for user_id ${user_id}`);
//       }
//     }

//     console.log("Email-based update process completed for all users.");
//   } catch (err) {
//     console.error("Error during email-based bulk update:", err);
//   }
// };

// module.exports = updateAddedByMeForAllUsers;
