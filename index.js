const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

require('dotenv').config();


admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const bot = new Telegraf(process.env.BOT_TOKEN);


const userSessions = {}; 

// ==============================
// 🔐 AUTHENTICATION
// ==============================

// Step 1: Start
bot.start((ctx) => {
  ctx.reply("Send your Firebase UID to authenticate.");
});

// Step 2: Save UID
bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id;
  const uid = ctx.message.text.trim();

  // Optional: verify user exists in Firebase Auth
  try {
    await admin.auth().getUser(uid);

    userSessions[telegramId] = uid;

    ctx.reply("✅ Authenticated! Now send a video.");
  } catch (err) {
    ctx.reply("❌ Invalid UID. Try again.");
  }
});

// ==============================
// 🎥 VIDEO HANDLER
// ==============================

bot.on('video', async (ctx) => {
  const telegramId = ctx.from.id;

  if (!userSessions[telegramId]) {
    return ctx.reply("❌ Please authenticate first by sending your Firebase UID.");
  }

  const userId = userSessions[telegramId];
  const video = ctx.message.video;

  try {
    ctx.reply("⬇️ Downloading video...");

    // Get Telegram file link
    const fileLink = await ctx.telegram.getFileLink(video.file_id);

    const tempFilePath = path.join(__dirname, `${Date.now()}_${video.file_name || 'video.mp4'}`);

    // Download video
    const response = await axios({
      url: fileLink.href,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    ctx.reply("☁️ Uploading to Firebase...");

    // Upload to Firebase Storage
    const fileName = `videos/${Date.now()}_${video.file_name || 'video.mp4'}`;

    const upload = await bucket.upload(tempFilePath, {
      destination: fileName,
      metadata: {
        contentType: video.mime_type || 'video/mp4',
      }
    });

    const file = upload[0];

    // Make public URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });

    const id = uuidv4();

    const netlifyUrl = `https://your-netlify-app.netlify.app?videoUrl=${encodeURIComponent(url)}&id=${id}`;

    // Save to Firestore
    const videoData = {
      clickCount: 2,
      createdAt: admin.firestore.Timestamp.now(),
      earnings: 0.004,
      id: id,
      netlifyUrl: netlifyUrl,
      serverCreatedAt: admin.firestore.Timestamp.now(),
      size: video.file_size,
      storageUrl: url,
      title: video.file_name || "video.mp4",
      userId: userId,
      views: 2
    };

    await db.collection("Videos").doc(id).set(videoData);

    ctx.reply("✅ Video uploaded successfully!");
    ctx.reply(`🔗 Link: ${netlifyUrl}`);

    // Cleanup
    fs.unlinkSync(tempFilePath);

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error uploading video.");
  }
});

// ==============================
// 🚀 START BOT
// ==============================

bot.launch();

console.log("🤖 Bot is running...");