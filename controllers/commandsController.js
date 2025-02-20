const bot = require("../services/telegramService");
const authMiddleware = require("../middlewares/authMiddleware");

// 📌 Buyruqlar ro‘yxati
const commandsList = `
📌 *Ahsan Labs Bot Buyruqlari*:

🟢 *Asosiy buyruqlar:*
  /start - Botni ishga tushirish
  /help - Barcha buyruqlar haqida ma'lumot
  /status - Akaunt bog‘langanligini tekshirish

🔹 *Avtorizatsiya:*
  /register - Foydalanuvchini avtorizatsiya qilish
  /unsubscribe - Botdan chiqish va bildirishnomalarni o‘chirish ❌

🔔 *Bildirishnomalar:*
  /alerts - Foydalanuvchining sozlangan signal va tahlillarini ko‘rish
  /settings - Bildirishnomalar sozlamalarini o‘zgartirish

💡 *Qo‘shimcha:*  
  /about - Bot haqida ma'lumot
`;

// 📌 `/help` buyruqni qo‘shish
bot.onText(/\/help/, async (msg) => {
  authMiddleware(bot, msg, () => {
    bot.sendMessage(msg.chat.id, commandsList, { parse_mode: "Markdown" });
  });
});

// 📌 `/about` buyruqni qo‘shish
bot.onText(/\/about/, async (msg) => {
  authMiddleware(bot, msg, () => {
    const aboutText = `
🤖 *Ahsan Labs Bot*  
Ushbu bot orqali siz kripto bozorining eng so‘nggi signal va tahlillarini olishingiz mumkin.  
📢 Loyihaning rasmiy sayti: [Ahsan Labs](https://ahsanlabs.uz/)
    `;
    bot.sendMessage(msg.chat.id, aboutText, { parse_mode: "Markdown", disable_web_page_preview: true });
  });
});

module.exports = commandsList;
