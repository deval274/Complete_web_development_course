import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  verifyEmail,
} from "../controllers/auth.contollers.js";
import { validation } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  userChangeCurrentPasswordValidator,
} from "../validators/index.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

// unsecure routes
router
  .route("/register")
  .post(userRegisterValidator(), validation, registerUser);
router.route("/login").post(userLoginValidator(), validation, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validation, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validation, resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJwt,
    userChangeCurrentPasswordValidator(),
    validation,
    changeCurrentPassword,
  );
router
  .route("/resend-email-verification")
  .post(verifyJwt, resendEmailVerification);

export default router;
