const db = require("../config/firebase");

const authorizedUsers = new Set(); // Ro‘yxatdan o‘tgan foydalanuvchilar cache qilinadi

async function checkAuthorization(chatId) {
  console.log(`🔍 Tekshirilayotgan chatId: ${chatId}`);

  if (authorizedUsers.has(chatId)) {
    console.log(`✅ Cache orqali avtorizatsiya tasdiqlandi: ${chatId}`);
    return true;
  }

  // Firestore'da `chatId` ni qidirish (katta-kichik harfni tekshirish)
  const snapshot = await db.collection("user").where("chatId", "==", Number(chatId)).get();

  if (!snapshot.empty) {
    const userData = snapshot.docs[0].data();

    if (userData.authorized === true) {
      authorizedUsers.add(chatId);
      return true;
    } else {
      console.log("⛔ Foydalanuvchi avtorizatsiyadan o‘tmagan:", userData);
    }
  } else {
    console.log("❌ Foydalanuvchi topilmadi.");
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
    return next(); // 
  }
}

module.exports = authMiddleware;
