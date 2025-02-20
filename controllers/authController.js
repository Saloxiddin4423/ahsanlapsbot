const bot = require("../services/telegramService");
const { getUserById, saveUser } = require("../services/firebaseService");
const authMiddleware = require("../middlewares/authMiddleware");  // ✅ IMPORT QILINDI
const authorizedUsers = new Set();
const awaiting_auth = new Set();

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (authorizedUsers.has(chatId)) {
    bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
    return;
  }

  bot.sendMessage(chatId, `Assalomu alaykum! 👋\n\n` +
    `Ahsan Labs bildirishnoma botiga xush kelibsiz. Ushbu bot orqali siz kripto bozoridagi eng so‘nggi signal va tahlillarni olishingiz mumkin. Davom etish uchun /register buyrug‘ini bering va platformadagi hisobingizni ulang.`);
});

// 📌 `/register` - Avtorizatsiyadan o‘tish
bot.onText(/\/register/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (authorizedUsers.has(chatId)) {
    return bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
  }

  bot.sendMessage(chatId, "Iltimos, Ahsan Labs tizimida ro‘yxatdan o‘tgan user ID-ni yuboring.");
  awaiting_auth.add(chatId);
});

// 📌 `/status` - Foydalanuvchini tekshirish
bot.onText(/\/status/, async (msg) => {
  authMiddleware(bot, msg, () => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "✅ Akauntingiz bog‘langan! Siz bildirishnomalarni qabul qilayapsiz.\n\n" +
      "⚙ Agar o‘zgartirmoqchi bo‘lsangiz, /settings buyrug‘ini bering."
    );
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!awaiting_auth.has(chatId)) return;

  const text = msg.text ? msg.text.trim() : "";
  const userData = await getUserById(text);

  if (userData) {
    awaiting_auth.delete(chatId);
    authorizedUsers.add(chatId);
    await saveUser(chatId, userData);

    bot.sendMessage(chatId, `✅ Tabriklaymiz! Akauntingiz muvaffaqiyatli bog‘landi. Endilikda siz Ahsan Labs'ning barcha signal va tahlil bildirishnomalarini olishingiz mumkin. \n\n /help `);
  } else {
    bot.sendMessage(chatId, "❌ Xatolik! Noto‘g‘ri user_id, qaytadan kiriting.");
  }
});
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  if (authorizedUsers.has(chatId)) {
    bot.sendMessage(
      chatId,
      "✅ Akauntingiz bog‘langan! Siz bildirishnomalarni qabul qilayapsiz.\n\n" +
      "⚙ Agar o‘zgartirmoqchi bo‘lsangiz, /settings buyrug‘ini bering."
    );
  } else {
    bot.sendMessage(chatId, "❌ Siz hali ro‘yxatdan o‘tmagansiz.\n`/register` orqali avtorizatsiyadan o‘ting.");
  }
});