// const express = require("express");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const db = require("./models");
// const upload = require("./middleware/upload");
// dotenv.config();
// const cors = require("cors");
// const http = require("http");
// const socketIo = require("socket.io");
// const cron = require("node-cron");
// const jwt = require("jsonwebtoken");

// const { UserSocket, Language_status } = require("./models");
// const { Op } = require("sequelize");

// const no_auth_route = require("./routes/NoAuthRoutes");
// const auth_routes = require("./routes/AuthRoutes");
// const admin_routes = require("./routes/Admin.routes");

// const {
//   checkWebsettingAndCreate,
// } = require("./controller/Admin/webSettingController");
// const removePinMessage = require("./controller/Chat/StarMessage/removePinMessage");
// const {
//   addLanguageColumn,
//   addDefaultEntries,
// } = require("./reusable/add_new_language");
// const {
//   checkAppFlowAndCreate,
// } = require("./controller/Admin/AppFlow.Controller");
// const { checkAdminAndCreate } = require("./controller/Admin/admin.login");
// const {
//   checkAppsettingAndCreate,
// } = require("./controller/Admin/appsettingController");
// const {
//   checkOneSignalsettingAndCreate,
//   checkGroupsettingAndCreate,
// } = require("./controller/Admin/oneSignalsettingController");
// const {
//   removeStatusAfter24Hours,
// } = require("./controller/Status/removeStatusAfter24Hours");

// const authMiddleware = require("./middleware/authMiddleware");
// const socketService = require("./reusable/socketService");

// const app = express();
// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: true,
//   },
//   path: "/socket",
// });

// const port = process.env.PORT || 3000;

// // ===================== Middleware Setup =====================
// app.use(
//   cors({
//     origin: "*",
//   })
// );

// app.set("trust proxy", 1);
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // File upload middleware
// const fileUploadMiddleware = upload.fields([
//   { name: "files", maxCount: 10 },
//   { name: "darkLogo", maxCount: 1 },
// ]);

// app.use((req, res, next) => {
//   fileUploadMiddleware(req, res, function (err) {
//     if (err) {
//       return next(err);
//     }

//     req.darkLogo = req?.files?.["darkLogo"] || [];
//     req.files = req?.files?.["files"] || [];

//     next();
//   });
// });

// // ✅ Serve static files for uploads and public assets
// app.use("/uploads", express.static("uploads"));
// app.use("/public", express.static("public"));

// // ===================== Cron Jobs =====================
// console.log(Date.now(), "Running scheduled tasks...");
// cron.schedule("0 * * * *", () => {
//   removeStatusAfter24Hours();
//   removePinMessage();
// });

// // ===================== Routes =====================

// // Unauthenticated routes
// app.use("/api", no_auth_route);

// // Socket.IO connection handling
// const handleUserSocketAssociation = async (socket, next) => {
//   let authToken = socket.handshake.auth?.token;

//   if (!authToken) {
//     return next(new Error("Missing token during connection."));
//   }

//   try {
//     const jwtSecretKey = process.env.JWT_SECRET_KEY;
//     const authData = jwt.verify(authToken, jwtSecretKey);

//     socket.handshake.query.user_id = authData.user_id;

//     await UserSocket.create({
//       user_id: authData.user_id,
//       socketId: socket.id,
//     });

//     next();
//   } catch (error) {
//     console.error("Socket Auth Error:", error);
//     next(new Error("Invalid token"));
//   }
// };

// io.use(handleUserSocketAssociation);
// socketService.initSocket(io);

// // Authenticated routes
// app.use("/api", authMiddleware, auth_routes);
// app.use("/api", authMiddleware, admin_routes);

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: "Something went wrong!", success: false });
// });

// // ===================== Helper Functions =====================
// async function fetchLanguages() {
//   try {
//     const all_Languages = await Language_status.findAll();
//     return all_Languages.map((lang) => lang.dataValues.language);
//   } catch (error) {
//     console.error("Error fetching languages:", error);
//     return [];
//   }
// }

// // ===================== Database Sync and Server Start =====================
// db.sequelize.sync({ alter: false }).then(async () => {
//   await checkAppFlowAndCreate();
//   await checkAdminAndCreate();
//   await checkAppsettingAndCreate();
//   await checkWebsettingAndCreate();
//   await checkOneSignalsettingAndCreate();
//   await addDefaultEntries();
//   await checkGroupsettingAndCreate();

//   console.log("Database Connected ✅!");

//   const languagelist = await fetchLanguages();
//   if (languagelist.length > 0) {
//     for (const element of languagelist) {
//       await addLanguageColumn(element);
//     }
//   } else {
//     console.log("No languages found.");
//   }

//   server.listen(port, () => {
//     console.log(`Server listening on port ${port}!`);
//   });
// });

const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const db = require("./models");
const upload = require("./middleware/upload");
dotenv.config();
const cors = require("cors");
const fs = require("fs");
const no_auth_route = require("./routes/NoAuthRoutes");
const auth_routes = require("./routes/AuthRoutes");
const admin_routes = require("./routes/Admin.routes");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const { UserSocket, Language_status } = require("./models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const os = require("os");
const getmac = require("getmac").default;
const axios = require("axios");
const {
  checkWebsettingAndCreate,
} = require("./controller/Admin/webSettingController");
const removePinMessage = require("./controller/Chat/StarMessage/removePinMessage");
const {
  addLanguageColumn,
  addDefaultEntries,
} = require("./reusable/add_new_language");
const {
  checkAppFlowAndCreate,
} = require("./controller/Admin/AppFlow.Controller");
const { checkAdminAndCreate } = require("./controller/Admin/admin.login");
const {
  checkAppsettingAndCreate,
} = require("./controller/Admin/appsettingController");
const {
  checkOneSignalsettingAndCreate,
  checkGroupsettingAndCreate,
} = require("./controller/Admin/oneSignalsettingController");

// const io = socketIo(server);
const io = socketIo(server, {
  cors: {
    origin: true,
  },
  path: "/socket",
  // maxHttpBufferSize: 1e8, // Set a higher limit (e.g., 100 MB)
});

const port = process.env.PORT || 3000;

const authMiddleware = require("./middleware/authMiddleware");
const socketService = require("./reusable/socketService");
const cron = require("node-cron");

const {
  removeStatusAfter24Hours,
} = require("./controller/Status/removeStatusAfter24Hours");

app.use(
  cors({
    origin: "*",
  })
);

app.set("trust proxy", 1); // trust first proxy

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
//form-urlencoded

// for parsing multipart/form-data
// app.use(upload.array("files"));
const fileUploadMiddleware = upload.fields([
  { name: "files", maxCount: 10 },
  { name: "darkLogo", maxCount: 1 },
]);

app.use((req, res, next) => {
  fileUploadMiddleware(req, res, function (err) {
    if (err) {
      return next(err); // Handle Multer errors
    }

    // Ensure darkLogo is always defined
    if (req?.files?.["darkLogo"]) {
      req.darkLogo = req.files["darkLogo"];
      req.darkLogo.forEach((file, index) => {
        console.log(
          `darkLogo[${index}]: ${file.originalname} - ${file.size} bytes`
        );
      });
    } else {
      req.darkLogo = [];
    }

    // Ensure files is always defined
    if (req?.files?.["files"]) {
      req.files = req.files["files"];
      req.files.forEach((file, index) => {
        console.log(
          `files[${index}]: ${file.originalname} - ${file.size} bytes`
        );
      });
    } else {
      req.files = [];
    }

    next(); // Continue to next middleware or route handler
  });
});
// to provide files to users
app.use("/uploads", express.static("uploads"));
app.use("/public", express.static("public"));

// Schedule the task to run every hour =========================================
console.log(Date.now(), "Running scheduled tasks...");
cron.schedule("0 * * * *", () => {
  removeStatusAfter24Hours();
  removePinMessage();
});

// for React website
const validatePurchaseCode = async (req, res, next) => {
  if (!fs.existsSync("./validatedToken.txt")) {
    // If validation fails, serve the Validate.html page
    return res.sendFile(path.join(__dirname, "public", "validate.html"));
  } else {
    const isValid = await verifyToken();

    if (!isValid) {
      return res.sendFile(path.join(__dirname, "public", "validate.html"));
    }
  }
  next();
};
// Apply purchase code validation middleware to all routes except the validation route
app.use((req, res, next) => {
  if (req.path === "/api/validate") {
    // Allow the validation route to be accessed without validation
    return next();
  }

  // Apply purchase code validation to everything else
  validatePurchaseCode(req, res, next);
});

// Purchase code validation route (public route)
app.post("/api/validate", async (req, res) => {
  console.log("Received Headers:", req.headers);
  console.log("Received Body:", req.body); // Log the body for debugging

  const macAddress = getMacAddress();
  const deviceIp = req.ip; // Get the IP address of the client
  const { purchase_code, username } = req.body;
  if (!macAddress) {
    return res.status(500).json({ error: "Unable to retrieve MAC address." });
  }

  // Additional validation for purchase_code
  if (!purchase_code) {
    return res.status(400).json({ error: "Purchase code is required." });
  }
  if (!username) {
    return res.status(400).json({ error: "username is required." });
  }

  try {
    const response = await axios.post(
      "http://62.72.36.245:1142/validate",
      // "http://192.168.0.27:1142/validate",
      {
        purchase_code: purchase_code,
        username: username,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Your User Agent",
          "X-MAC-Address": getMacAddress(),
          "X-Device-IP": getServerIP(), // Pass the device IP address in the headers
          // Optional: Add any other headers you want to forward
        },
      }
    );
    console.log(response);

    if (response.data.status == "used") {
      return res.status(400).json({ error: response.data.message });
    }
    if (response.data.status == "error") {
      return res.status(400).json({ error: response.data.message });
    }
    if (response.data.status == "invalid") {
      return res.status(400).json({ error: response.data.message });
    }
    const { token } = response.data;

    // Store the token securely
    fs.writeFileSync("./validatedToken.txt", token);

    res.json({ message: "Validation successful!", token });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(400).json({ error: "Validation failed!" });
  }
});

// Middleware to protect routes with purchase code validation

// Function to verify token
async function verifyToken() {
  const tokenFilePath = path.join(__dirname, "validatedToken.txt");

  if (!fs.existsSync(tokenFilePath)) {
    console.log("Token file does not exist. No verification needed.");
    return false; // No token file found, no verification needed
  }

  try {
    const token = await fs.promises.readFile(tokenFilePath, "utf-8");

    const verificationResponse = await axios.post(
      "http://62.72.36.245:1142/verify_new",
      // "http://192.168.0.27:1142/verify_new",
      {
        server_ip: getServerIP(),
        mac_address: getMacAddress(),
        token: token,
      }
    );

    // Apao edit ==========
    // if (!verificationResponse.data.success) {
    //   console.log("Token verification failed. Removing current directory...");
    //   return false; // Return false on failure
    // }
    // return verificationResponse.data.success;
    return true;
  } catch (error) {
    console.error("Error during token verification:", error);
    return false;
  }
}

// for React website
app.use(express.static(path.join(__dirname, "/frontend")));
app.use(express.static(path.join(__dirname, "/admin")));

function getMacAddress() {
  try {
    const mac = getmac();
    return mac;
  } catch (err) {
    console.error("Error fetching MAC address:", err);
    return null;
  }
}

function getServerIP() {
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceName in networkInterfaces) {
    for (const interface of networkInterfaces[interfaceName]) {
      // Check for IPv4 and non-internal addresses (to exclude localhost)
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }

  return "IP address not found";
}

// Schedule the task to run every hour ============const {Language_status} = require('./models');
app.get("/", async (req, res) => {
  try {
    // res.json({ message: "Server is Running ✅", success: true });
    return res.sendFile(path.join(__dirname, "/frontend", "index.html"));
  } catch (error) {
    // Handle the Sequelize error and send it as a response to the client
    res.status(500).json({ error: error.message });
  }
});

app.get("/admin/*", async (req, res) => {
  try {
    // res.json({ message: "Server is Running ✅", success: true });
    return res.sendFile(path.join(__dirname, "/admin", "index.html"));
  } catch (error) {
    // Handle the Sequelize error and send it as a response to the client
    res.status(500).json({ error: error.message });
  }
});

app.get("/admin", async (req, res) => {
  try {
    // res.json({ message: "Server is Running ✅", success: true });
    return res.sendFile(path.join(__dirname, "/admin", "index.html"));
  } catch (error) {
    // Handle the Sequelize error and send it as a response to the client
    res.status(500).json({ error: error.message });
  }
});

// Define your unauthenticated routes
app.use("/api", no_auth_route);

// Custom middleware for handling user/socket association
const handleUserSocketAssociation = async (socket, next) => {
  // Access the user_id sent by the client during connection
  let authToken = socket.handshake.query.token;
  let authData;
  // console.log(authToken);

  // Validate that userId is present
  if (!authToken) {
    return next(new Error("Missing token during connection."));
  }

  try {
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    // check if the token is valid or not
    authData = jwt.verify(
      authToken, // auth token
      jwtSecretKey
    );

    // Temporary ==================================================================================
    // UserSocket.findOne({
    //   where: { user_id: authData.user_id },
    // }).then((socketData) => {
    //   if (socketData) {
    //     console.log("User allready connected");
    //     return next(new Error("User allready connected."));
    //   }
    // });

    socket.handshake.query.user_id = authData.user_id;
    socket.handshake.query.user_id = authData.user_id;
  } catch (error) {
    console.error(error);
    return next(new Error("Invalid token"));
  }

  try {
    const userId = socket.handshake.query.user_id;

    // Create a new entry for each connection
    await UserSocket.create({
      user_id: userId,
      socketId: socket.id,
    });

    // Continue with the Socket.IO connection handling
    next();
  } catch (error) {
    console.error("Error storing user/socket association:", error);
    // Handle the error appropriately, such as disconnecting the user
    next(new Error("Error storing user/socket association."));
  }
};

// Socket.IO connection handling with the custom middleware
io.use(handleUserSocketAssociation);

// Initialize socket
socketService.initSocket(io);

// Define your authenticated routes ==================================================================================

app.use("/api", authMiddleware, auth_routes);
app.use("/api", authMiddleware, admin_routes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", success: false });
});

async function fetchLanguages() {
  try {
    const all_Languages = await Language_status.findAll();
    const languagelist = all_Languages.map((lang) => {
      return lang.dataValues.language;
    });
    return languagelist;
    // console.log(languagelist);
  } catch (error) {
    console.error("Error fetching languages:", error);
  }
}

db.sequelize.sync({ alter: false }).then(async () => {
  // Make this function async to use await
  // StaticEntries
  await checkAppFlowAndCreate();
  await checkAdminAndCreate();
  await checkAppsettingAndCreate();
  await checkWebsettingAndCreate();
  await checkOneSignalsettingAndCreate();
  await addDefaultEntries();
  await checkGroupsettingAndCreate();

  console.log("Database Connected ✅!");
  // UserSocket.destroy({ truncate: false, cascade: false });
  const tokenFilePath = path.join(__dirname, "validatedToken.txt");
  if (fs.existsSync(tokenFilePath)) {
    const isValid = await verifyToken();

    if (isValid) {
      // UserSocket.destroy({ truncate: false, cascade: false });
      const languagelist = await fetchLanguages(); // Await here to get the result

      // Loop over the languagelist if it's not empty
      if (languagelist && languagelist.length > 0) {
        for (let index = 0; index < languagelist.length; index++) {
          const element = languagelist[index];
          await addLanguageColumn(element);
        }
      } else {
        console.log("No languages found.");
      }
    } else {
      console.log("Token is invalid. Serving validation page.");
      const languagelist = await fetchLanguages(); // Await here to get the result

      // Loop over the languagelist if it's not empty
      if (languagelist && languagelist.length > 0) {
        for (let index = 0; index < languagelist.length; index++) {
          const element = languagelist[index];
          await addLanguageColumn(element);
        }
      } else {
        console.log("No languages found.");
      }
    }
  } else {
    console.log("Token file does not exist. No verification needed.");
    // UserSocket.destroy({ truncate: false, cascade: false });
    const languagelist = await fetchLanguages(); // Await here to get the result

    // Loop over the languagelist if it's not empty
    if (languagelist && languagelist.length > 0) {
      for (let index = 0; index < languagelist.length; index++) {
        const element = languagelist[index];
        await addLanguageColumn(element);
      }
    } else {
      console.log("No languages found.");
    }
  }
  server.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
  });
});
