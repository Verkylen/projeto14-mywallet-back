import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

await mongoClient.connect();
const db = mongoClient.db('mywallet');

export const users = db.collection('users');
export const sessions = db.collection('sessions');
export const statement = db.collection('statement');