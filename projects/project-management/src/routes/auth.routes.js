import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/auth.contollers.js";
import { validation } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
} from "../validators/index.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validation, registerUser);
router.route("/login").post(userLoginValidator(), validation, loginUser);
router.route("/logout").post(verifyJwt, logoutUser);

export default router;
