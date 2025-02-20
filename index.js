require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json");

// 🔹 Firebase Firestore ulash
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com",
  });
}

const db = admin.firestore();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// 🔹 Avtorizatsiyadan o‘tgan foydalanuvchilar ro‘yxati
const authorizedUsers = new Set();
const awaiting_auth = new Set(); // Foydalanuvchi avtorizatsiya uchun user_id kiritayotganini belgilaydi

// 🔹 /start komandasi → User ID so‘rash
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Agar foydalanuvchi allaqachon avtorizatsiyadan o‘tgan bo‘lsa
  if (authorizedUsers.has(chatId)) {
    bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
    return;
  }

  // Foydalanuvchiga xush kelibsiz xabari yuborish
  const welcomeMessage = `Assalomu alaykum! 👋\n\n` +
    `Ahsan Labs bildirishnoma botiga xush kelibsiz. Ushbu bot orqali siz kripto bozoridagi eng so‘nggi signal va tahlillarni olishingiz mumkin.\n\n` +
    `Davom etish uchun /register buyrug‘ini bering va platformadagi hisobingizni ulang.`;

  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/register/, async (msg) => {
  const chatId = msg.chat.id;

  // Agar foydalanuvchi allaqachon avtorizatsiyadan o‘tgan bo‘lsa
  if (authorizedUsers.has(chatId)) {
    bot.sendMessage(chatId, "✅ Siz allaqachon avtorizatsiyadan o‘tgansiz!");
    return;
  }

  // Foydalanuvchi avtorizatsiya jarayonida emas, unga ID kiritishni so‘raymiz
  bot.sendMessage(chatId, "Akauntingizni Telegram bot bilan bog‘lash uchun Ahsan Labs tizimida ro‘yxatdan o‘tgan tokenni yuboring. Masalan: 123456");
  awaiting_auth.add(chatId);
});
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  // Foydalanuvchi avtorizatsiyadan o‘tganmi?
  if (authorizedUsers.has(chatId)) {
    bot.sendMessage(chatId, 
      "✅ Akauntingiz bog‘langan! Siz bildirishnomalarni qabul qilayapsiz.\n\n" +
      "⚙ Agar o‘zgartirmoqchi bo‘lsangiz, /settings buyrug‘ini bering."
    );
  } else {
    bot.sendMessage(chatId, 
      "❌ Siz hali ro‘yxatdan o‘tmadingiz.\n\n" +
      "Ro‘yxatdan o‘tish uchun /register buyrug‘ini bering."
    );
  }
});

// 🔹 User ID ni tekshirish va avtorizatsiya qilish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Agar foydalanuvchi /start bosmagan bo‘lsa yoki awaiting_auth ichida bo‘lmasa, hech narsa qilmaymiz
  if (!awaiting_auth.has(chatId)) {
    return;
  }

  const text = msg.text ? msg.text.trim() : ""; // Agar msg.text bo‘sh bo‘lsa, "" qilib o‘zgartiramiz

  // ❌ Noto‘g‘ri user_id formatidan xatolik chiqmasligi uchun tekshiramiz
  // if (!text || text.length < 3) {
  //   bot.sendMessage(chatId, "❌ Noto‘g‘ri user_id. Iltimos, qayta kiriting:");
  //   return;
  // }

  try {
    // 🔍 Firestore'dagi user_id bo‘yicha foydalanuvchini qidirish
    const usersSnapshot = await db
      .collection("user")
      .where("user_id", "==", text)
      .get();

    if (!usersSnapshot.empty) {
      // 🔹 Foydalanuvchi topildi
      const userData = usersSnapshot.docs[0].data();
      awaiting_auth.delete(chatId);
      authorizedUsers.add(chatId);

      console.log(
        " ${userData.name} Tabriklaymiz! Akauntingiz muvaffaqiyatli bog‘landi. Endilikda siz Ahsan Labs'ning barcha signal va tahlil bildirishnomalarini olishingiz mumkin"
      );

      // 🔹 Firestore'da foydalanuvchini saqlash
      await db
        .collection("users")
        .doc(chatId.toString())
        .set({
          chatId: chatId,
          authorized: true,
          name: userData.name || "No Name",
          tg_username: userData.tg_username || "No Username",
          user_id: userData.user_id,
          joinedAt: new Date().toISOString(),
        });

      // 🔹 alerts kolleksiyasidan ushbu user_id bo‘yicha symbols larni olish
      const alertsSnapshot = await db
        .collection("alerts")
        .where("user_id", "==", text)
        .get();
      let allSymbols = [];

      if (!alertsSnapshot.empty) {
        alertsSnapshot.forEach((doc) => {
          const alertData = doc.data();
          console.log("🔍 Alert:", alertData);

          // symbols ni tekshiramiz va array formatda ekanligiga ishonch hosil qilamiz
          if (alertData.symbols && Array.isArray(alertData.symbols)) {
            allSymbols.push(...alertData.symbols);
          } else if (typeof alertData.symbols === "string") {
            allSymbols.push(alertData.symbols);
          }
        });

        if (allSymbols.length > 0) {
          let message = "🟢 Sizga bog‘langan aktiv symbols lar:\n\n";
          message +=` 🔔 Symbols: ${[...new Set(allSymbols)].join(", ")}\n;`
          bot.sendMessage(chatId, message);
        } else {
          bot.sendMessage(chatId, "⚠ Sizga hech qanday symbol bog‘lanmagan.");
        }
      } else {
        bot.sendMessage(chatId, "⚠ Sizga hech qanday symbol bog‘lanmagan.");
      }

      // 🔹 Foydalanuvchiga "Ahsan Labs" tugmasini yuborish
      bot.sendMessage(
        chatId,
       ` ✅ Avtorizatsiya muvaffaqiyatli! Xush kelibsiz, ${userData.name}!`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔗 Ahsan Labs'ga o'tish",
                  url: "https://ahsanlabs.uz/",
                },
              ],
            ],
          },
        }
      );
    } else {
      bot.sendMessage(
        chatId,
        "❌ Xatolik! Noto‘g‘ri user_id, qaytadan kiriting."
      );
    }
  } catch (error) {
    console.error("🔥 Firestore'dan user_id tekshirishda xatolik:", error);
    bot.sendMessage(
      chatId,
      "⚠ Xatolik yuz berdi, keyinroq qayta urinib ko‘ring."
    );
  }
});



// 🔹 Telegram xabarlari uchun maxsus belgilarni qochirish (MarkdownV2 uchun)
function escapeMarkdownV2(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}




// 🔹 Telegram xabarlari uchun maxsus belgilarni qochirish (MarkdownV2 uchun)
// 🔹 Telegram xabarlari uchun maxsus belgilarni qochirish (MarkdownV2 uchun)
function escapeMarkdownV2(text) {
    if (!text || typeof text !== "string") return ""; // Agar matn bo‘lmasa, bo‘sh string qaytarish
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}


// 🔹 Real-time kuzatuv
db.collection("analysis").orderBy("created_at", "desc").limit(10).onSnapshot(async (snapshot) => {
    console.log("🔄 Yangi `analysis` ma'lumotlarini tekshirish...");

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 15 daqiqa oldin

    snapshot.forEach(async (doc) => {
        const analysisData = doc.data();
        const createdAt = analysisData.created_at.toDate(); // Firestore timestamp'ini Date formatiga o‘girish

        // 🔹 Faqat oxirgi 15 daqiqada qo‘shilganlarni tekshirish
        if (createdAt < fifteenMinutesAgo) {
            return; // Agar ma'lumot 15 daqiqadan eski bo‘lsa, uni o‘tkazib yuboramiz
        }

        const symbol = escapeMarkdownV2(analysisData.symbol);
        const timeframe = escapeMarkdownV2(analysisData.timeframe_id);

        console.log(`📜 Yangi Analysis: Symbol: ${symbol}, Timeframe: ${timeframe}, Vaqti: ${createdAt}`);

        // 🔹 `alerts` kolleksiyasidan `symbol` bo‘yicha user_id larni olish
        const symbolAlertsSnapshot = await db.collection("alerts")
            .where("symbols", "array-contains", symbol)
            .get();

        // 🔹 `alerts` kolleksiyasidan `timeframe` bo‘yicha user_id larni olish
        const timeframeAlertsSnapshot = await db.collection("alerts")
            .where("timeframes", "array-contains", timeframe)
            .get();

        let userIds = new Set();
        
        // 🔹 Symbol bo‘yicha alertlar
        symbolAlertsSnapshot.forEach(alertDoc => {
            const alertData = alertDoc.data();
            userIds.add(alertData.user_id);
        });

        // 🔹 Timeframe bo‘yicha alertlar (qo‘shilib ketmasligi uchun yana qo‘shamiz)
        timeframeAlertsSnapshot.forEach(alertDoc => {
            const alertData = alertDoc.data();
            userIds.add(alertData.user_id);
        });

        console.log(`👤 Ushbu analysis uchun bog‘langan user_id lar:`, Array.from(userIds));

        // 🔹 `users` kolleksiyasidan `chatId` larni olish faqat `userIds` bo‘sh bo‘lmasa
        if (userIds.size > 0) {
            const usersSnapshot = await db.collection("users")
                .where("user_id", "in", Array.from(userIds))
                .get();

            let chatIds = [];
            if (!usersSnapshot.empty) {
                usersSnapshot.forEach(userDoc => {
                    const userData = userDoc.data();
                    if (userData.chatId) {
                        chatIds.push(userData.chatId);
                    }
                });
            }

            console.log(`📩 Ushbu foydalanuvchilarga xabar yuborish mumkin:`, chatIds);

            // 🔹 Telegram bot orqali foydalanuvchilarga xabar yuborish
            if (chatIds.length > 0) {
                const message = `📊 *Yangi Analiz Qo‘shildi\\!* \n\n` +
                    `🔹 *Symbol:* ${symbol} \n` +
                    `⏳ *Timeframe:* ${timeframe} \n\n` +
                    `📢 Ushbu valyutaga yangi analiz qo‘shildi\\!`;

                chatIds.forEach(chatId => {
                    bot.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
                });
            }
        } else {
            console.log(`⚠ Ushbu analysis uchun hech qanday user_id topilmadi.`);
        }
    });
});
