import joi from 'joi';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { sessions, users } from '../db.js';

export async function signUp(req, res) {
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
}

export async function signIn(req, res) {
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

    const {_id, name} = user;

    if(!bcrypt.compareSync(password, user.password)) {
        res.sendStatus(403);
        return;
    }

    const session = await sessions.findOne({userID: _id});

    if (session !== null) {
        res.send({name, token: session.token});
        return;
    }

    const token = uuid();

    await sessions.insertOne({userID: _id, token});

    res.send({name: name, token});
}