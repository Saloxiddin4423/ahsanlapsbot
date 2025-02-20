const db = require("../config/firebase");

async function getUserById(userId) {
  const snapshot = await db.collection("user").where("user_id", "==", userId).get();
  return snapshot.empty ? null : snapshot.docs[0].data();
}

async function saveUser(chatId, userData) {
  return db.collection("users").doc(chatId.toString()).set({
    chatId,
    authorized: true,
    name: userData.name || "No Name",
    tg_username: userData.tg_username || "No Username",
    user_id: userData.user_id,
    joinedAt: new Date().toISOString(),
  });
}

module.exports = { getUserById, saveUser };
