import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import joi from 'joi';
import bcrypt from 'bcrypt';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

await mongoClient.connect();
const db = mongoClient.db('mywallet');
const users = db.collection('users');
const sessions = db.collection('sessions');
const statement = db.collection('statement');

const app = express();
app.use(cors());
app.use(json());

app.post('/sign-up', async (req, res) => {
    const {body} = req;

    const bodySchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    const validation = bodySchema.validate(body, {abortEarly: true});

    if ('error' in validation) {
        res.sendStatus(422);
        return;
    }

    const {email, password} = body;

    const user = await users.findOne({email});

    if (user !== null) {
        res.sendStatus(422);
        return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    body.password = passwordHash;

    await users.insertOne(body);

    res.sendStatus(201);
});

app.listen(5000, () => console.log('Express server listening on port http://localhost:5000'));