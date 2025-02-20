const bot = require("../services/telegramService");
const db = require("../config/firebase");

// 📌 `/unsubscribe` - Foydalanuvchini ro‘yxatdan chiqarish
bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // 🔍 Firestore'da foydalanuvchini topish
    const userRef = db.collection("users").doc(chatId.toString());
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return bot.sendMessage(chatId, "❌ Siz allaqachon ro‘yxatdan o‘tmagansiz.");
    }

    // 🔥 Foydalanuvchini Firestore'dan o‘chirish
    await userRef.delete();

    bot.sendMessage(
      chatId,
      "❌ *Bildirishnomalar o‘chirildi!* Siz botdan chiqdingiz.\n\n" +
      "Qayta ulanish uchun /register buyrug‘ini bering.",
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("🔥 Unsubscribe xatosi:", error);
    bot.sendMessage(chatId, "⚠ Xatolik yuz berdi, keyinroq qayta urinib ko‘ring.");
  }
});
