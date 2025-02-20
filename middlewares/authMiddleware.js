const db = require("../config/firebase");

const authorizedUsers = new Set(); // Ro‘yxatdan o‘tgan foydalanuvchilarni cache qilish

async function checkAuthorization(chatId) {
  if (authorizedUsers.has(chatId)) {
    return true;
  }

  const userRef = db.collection("users").doc(chatId.toString());
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    authorizedUsers.add(chatId);
    return true;
  }

  return false;
}

// 📌 Middleware funksiyasi
async function authMiddleware(bot, msg, next) {
  const chatId = msg.chat.id;
  const isAuthorized = await checkAuthorization(chatId);

  if (!isAuthorized) {
    return bot.sendMessage(
      chatId,
      "❌ Siz hali ro‘yxatdan o‘tmagansiz!\n\n" +
      "Iltimos, /register orqali avtorizatsiyadan o‘ting."
    );
  } else {
    next(); // Agar foydalanuvchi avtorizatsiyadan o‘tgan bo‘lsa, buyruq ishlaydi
  }
}

module.exports = authMiddleware;
