import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.contollers.js";
import { validation } from "../middlewares/validator.middleware.js";
import { userRegisterValidator } from "../validators/index.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validation, registerUser);
router.route("/login").post(loginUser);

export default router;
