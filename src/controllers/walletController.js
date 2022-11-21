import joi from "joi";
import { sessions, statement, users } from "../db.js";

export async function walletPost(req, res) {
    const bodySchema = joi.object({
        value: joi.number().required(),
        description: joi.string().required(),
        type: joi.string().valid('in', 'out').required()
    });

    const {body} = req;

    const validation = bodySchema.validate(body, {abortEarly: true});

    if ('error' in validation) {
        res.sendStatus(422);
        return;
    }

    const {userID} = req;

    if (userID === null) {
        return;
    }

    const {email} = await users.findOne({_id: userID});

    body['email'] = email;
    
    const date = new Date();
    body['date'] = date.toLocaleDateString().slice(0, 5);

    await statement.insertOne(body);

    res.sendStatus(201);
}

export async function walletGet(req, res) {
    const {userID} = req;

    if (userID === null) {
        return;
    }

    const {email} = await users.findOne({_id: userID});

    const wallet = await statement.find({email}).toArray();

    res.status(200).send(wallet);
}

export async function walletDelete(req, res) {
    const {userID} = req;

    if (userID === false) {
        return;
    }

    await sessions.deleteOne({userID});

    res.sendStatus(200);
}