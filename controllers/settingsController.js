const bot = require("../services/telegramService");

// 📌 `/settings` - Foydalanuvchi sozlamalarini o‘zgartirish
bot.onText(/\/settings/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "⚙ *Sozlamalar bo‘limi:*", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔔 Bildirishnomalarni yoqish", callback_data: "enable_alerts" },
          { text: "🔕 Bildirishnomalarni o‘chirish", callback_data: "disable_alerts" }
        ],
        [
          { text: "⬅ Orqaga", callback_data: "back_to_menu" }
        ]
      ]
    }
  });
});

// 📌 Callback funksiyalar
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "enable_alerts") {
    bot.sendMessage(chatId, "✅ Bildirishnomalar yoqildi.");
  } else if (data === "disable_alerts") {
    bot.sendMessage(chatId, "❌ Bildirishnomalar o‘chirildi.");
  } else if (data === "back_to_menu") {
    bot.sendMessage(chatId, "🏠 Asosiy menyuga qaytish uchun /help buyrug‘ini bering.");
  }

  bot.answerCallbackQuery(query.id);
});
