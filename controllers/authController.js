const bot = require("../services/telegramService");
const { getUserById, saveUser } = require("../services/firebaseService");
const authorizedUsers = new Set();
const awaiting_auth = new Set();
const db = require("../config/firebase");

async function checkAuthorization(chatId) {

  if (authorizedUsers.has(chatId)) {
    return true;
  }

  const userData = await getUserById(chatId);

  if (userData && userData.authorized === true) {
    authorizedUsers.add(chatId); 
    return true;
  }

  return false;
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (await checkAuthorization(chatId)) {
    return bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
  }

  bot.sendMessage(chatId, `Assalomu alaykum! 👋\n\n` +
    `Ahsan Labs bildirishnoma botiga xush kelibsiz. Ushbu bot orqali siz kripto bozoridagi eng so‘nggi signal va tahlillarni olishingiz mumkin. Davom etish uchun /register buyrug‘ini bering va platformadagi hisobingizni ulang.`);
});

bot.onText(/\/register/, async (msg) => {
  const chatId = msg.chat.id;

  if (await checkAuthorization(chatId)) {
    return bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
  }

  bot.sendMessage(chatId, "Iltimos, Ahsan Labs tizimida ro‘yxatdan o‘tgan user ID-ni yuboring.");
  awaiting_auth.add(chatId);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!awaiting_auth.has(chatId)) return;

  const text = msg.text ? msg.text.trim() : "";
  const userData = await getUserById(text);

  if (userData) {
    awaiting_auth.delete(chatId);
    authorizedUsers.add(chatId);

    await saveUser(chatId, userData, msg.text);

    bot.sendMessage(chatId, `✅ Tabriklaymiz! Akauntingiz muvaffaqiyatli bog‘landi. Endilikda siz Ahsan Labs'ning barcha signal va tahlil bildirishnomalarini olishingiz mumkin. \n\n /help `);
  } else {
    bot.sendMessage(chatId, "❌ Xatolik! Noto‘g‘ri user_id, qaytadan kiriting.");
  }
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  if (await checkAuthorization(chatId)) {
    bot.sendMessage(
      chatId,
      "✅ Akauntingiz bog‘langan! Siz bildirishnomalarni qabul qilayapsiz.\n\n" +
      "⚙ Agar o‘zgartirmoqchi bo‘lsangiz, /settings buyrug‘ini bering."
    );
  } else {
    bot.sendMessage(chatId, "❌ Siz hali ro‘yxatdan o‘tmagansiz.\n`/register` orqali avtorizatsiyadan o‘ting.");
  }
});

bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id.toString(); 

  try {
    const usersRef = db.collection("user");
    const userQuery = await usersRef.where("chatId", "==", Number(chatId)).get();

    if (userQuery.empty) {
      return bot.sendMessage(chatId, "❌ Siz allaqachon ro‘yxatdan o‘tmagansiz.");
    }

    for (let doc of userQuery.docs) {
      await usersRef.doc(doc.id).update({ authorized: false });
    }

    console.log();
    
    if (authorizedUsers.has(Number(chatId))) {
      authorizedUsers.delete(Number(chatId)); // 🔥 Har doim string formatda o‘chiramiz
    } 


    bot.sendMessage(
      chatId,
      "🚫 *Siz botdan chiqdingiz!* Endi bildirishnomalarni olmayapsiz.\n\n" +
      "Qayta ulanish uchun /register buyrug‘ini bering.",
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error("🔥 Unsubscribe xatosi:", error);
    bot.sendMessage(chatId, "⚠ Xatolik yuz berdi, keyinroq qayta urinib ko‘ring.");
  }
});
