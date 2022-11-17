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
    const bodySchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    const {body} = req;

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

app.post('/sign-in', async (req, res) => {
    const bodySchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    const {body} = req;
    const validation = bodySchema.validate(body, {abortEarly: true});

    if ('error' in validation) {
        res.sendStatus(422);
        return;
    }

    const {email, password} = body;

    const user = await users.findOne({email});

    if (user === null) {
        res.sendStatus(401);
        return;
    }

    if(!bcrypt.compareSync(password, user.password)) {
        res.sendStatus(403);
        return;
    }

    const token = uuid();

    await sessions.insertOne({userID: user._id, token});

    res.send({token});
});

async function validToken(req, res) {
    const headersSchema = joi.object({
        authorization: joi.string().pattern(new RegExp('^Bearer ')).required()
    });

    const {headers} = req;

    const validation = headersSchema.validate(headers, {abortEarly: true});

    if ('error' in validation) {
        res.sendStatus(400);
        return false;
    }

    const token = headers.authorization.replace('Bearer ', '');

    const session = await sessions.findOne({token});

    if (session === null) {
        res.sendStatus(422);
        return false;
    }

    return session.userID;
}

app.post('/wallet', async (req, res) => {
    const bodySchema = joi.object({
        value: joi.number().required(),
        description: joi.string().required()
    });

    const validation = bodySchema.validate(req.body, {abortEarly: true});

    if ('error' in validation) {
        res.sendStatus(422);
        return;
    }

    const userID = validToken(req, res);

    if (userID === false) {
        return;
    }

    const {email} = await users.findOne({_id: userID});

    body['email'] = email;
    
    const date = new Date();
    body['date'] = date.toLocaleDateString().slice(0, 5);

    await statement.insertOne(body);

    res.sendStatus(201);
});

app.get('/wallet', async (req, res) => {
    const userID = validToken(req, res);

    if (userID === false) {
        return;
    }

    const {email} = await users.findOne({_id: userID});

    const wallet = await statement.find({email}).toArray();

    res.status(200).send(wallet);
});

app.delete('/exit', async (req, res) => {
    const userID = validToken(req, res);

    if (userID === false) {
        return;
    }

    await sessions.deleteOne({userID});

    res.sendStatus(200);
});

app.listen(5000, () => console.log('Express server listening on port http://localhost:5000'));