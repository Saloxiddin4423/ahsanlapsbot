const authMiddleware = require("./middlewares/authMiddleware");  // ⬅ AUTH MIDDLEWARE IMPORT

require("./controllers/authController");   
require("./controllers/commandsController");  
require("./controllers/alertController");   
require("./controllers/settingsController");  
require("./controllers/unsubscribeController");

console.log("🚀 Telegram bot ishga tushdi...");
