import { Router } from "express";
import { walletDelete, walletGet, walletPost } from "../controllers/walletController.js";
import validTokenMiddleware from "../middlewares/validTokenMiddleware.js";

const walletRouter = Router();
walletRouter.use(validTokenMiddleware);

walletRouter.post('/wallet', walletPost);

walletRouter.get('/wallet', walletGet);

walletRouter.delete('/exit', walletDelete);

export default walletRouter;