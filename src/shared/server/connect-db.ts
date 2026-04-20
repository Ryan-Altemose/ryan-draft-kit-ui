import mongoose from 'mongoose';

declare global {
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
    });
  }

  try {
    await global.mongooseConnectionPromise;
    return mongoose;
  } catch (error) {
    global.mongooseConnectionPromise = undefined;
    throw error;
  }
}
