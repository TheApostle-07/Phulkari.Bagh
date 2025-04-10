/* eslint-disable @typescript-eslint/no-require-imports */


// lib/db.ts
import mongoose from 'mongoose'

/**
 * It's best practice to store the connection string in an environment variable.
 * In Next.js, you typically have a .env.local file (ignored by git) containing:
 * MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority"
 */
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in your .env.local file")
}

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents multiple connections to the database.
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: mongoose.Connection | null
    promise: Promise<mongoose.Connection> | null
  }
}

let cached = global.mongooseCache

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null }
}

/**
 * dbConnect
 * Connect to MongoDB using the cached connection if available.
 */
async function dbConnect(): Promise<mongoose.Connection> {
  // If a connection is already established, return it
  if (cached.conn) {
    return cached.conn
  }

  // If there's no existing connection, create a new one
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      // Additional Mongoose options can be placed here
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose.connection
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
