import { Router } from "express";
import { registerUser } from "../controllers/auth.contollers.js";

const router = Router();

router.route("/register").post(registerUser);

export default router;
