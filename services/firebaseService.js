const db = require("../config/firebase");

async function getUserById(userId) {
  const snapshot = await db.collection("user").where("user_id", "==", userId).get();
  return snapshot.empty ? null : { id: snapshot.docs[0].id, data: snapshot.docs[0].data() };

}

async function saveUser(userId, userData, msg) {
  const user = await getUserById(msg);

  if (user) {
    return db.collection("user").doc(user.id).update({
      authorized: true, // 
      updatedAt: new Date().toISOString(),
      chatId:userId,
    });
  } else {
    console.log("Foydalanuvchi topilmadi, yangilash bajarilmadi.");
    return null;
  }
}

module.exports = { getUserById, saveUser };
