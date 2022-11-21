import { sessions } from "../db.js";

export default async function validTokenMiddleware(req, res, next) {
    if ('authorization' in req.headers === false) {
        res.sendStatus(400);
        req.userID = null;
        return;
    }

    const regex = new RegExp('^Bearer ');

    const {authorization} = req.headers;

    if (regex.test(authorization) === false) {
        res.sendStatus(400);
        req.userID = null;
        return;
    }

    const token = authorization.replace('Bearer ', '');

    const session = await sessions.findOne({token});

    if (session === null) {
        res.sendStatus(401);
        req.userID = null;
        return;
    }

    req.userID = session.userID;

    next();
}