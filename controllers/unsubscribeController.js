const bot = require("../services/telegramService");
const db = require("../config/firebase");

// 📌 `/unsubscribe` - Foydalanuvchini ro‘yxatdan chiqarish (lekin o‘chirmaslik)
bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id.toString(); // ID ni string formatga o‘tkazish

  try {
    const usersRef = db.collection("user");
    const userQuery = await usersRef.where("chatId", "==", Number(chatId)).get();


    if (userQuery.empty) {
      return bot.sendMessage(chatId, "❌ Siz allaqachon ro‘yxatdan o‘tmagansiz.");
    }

    // 🔥 `authorized: false` qilib yangilash
    userQuery.forEach(async (doc) => {
      await usersRef.doc(doc.id).update({ authorized: false, chatId: chatId + 1 });
    });

    bot.sendMessage(
      chatId,
      "🚫 *Bildirishnomalar o‘chirildi!* Siz endi botdan xabar olmaysiz.\n\n" +
      "Qayta ulanish uchun /register buyrug‘ini bering.",
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error("🔥 Unsubscribe xatosi:", error);
    bot.sendMessage(chatId, "⚠ Xatolik yuz berdi, keyinroq qayta urinib ko‘ring.");
  }
});
