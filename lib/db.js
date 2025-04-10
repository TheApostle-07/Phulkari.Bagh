// // lib/db.js
// require("dotenv").config({ path: "./.env.local" });
// const mongoose = require("mongoose");

// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) {
//   throw new Error("Please define the MONGODB_URI environment variable in your .env.local file");
// }

// // Use a global variable to cache the connection in development
// if (!global.mongooseCache) {
//   global.mongooseCache = { conn: null, promise: null };
// }
// const cached = global.mongooseCache;

// async function dbConnect() {
//   if (cached.conn) {
//     return cached.conn;
//   }
//   if (!cached.promise) {
//     const opts = {
//       bufferCommands: false,
//     };
//     cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose.connection);
//   }
//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// module.exports = dbConnect;
