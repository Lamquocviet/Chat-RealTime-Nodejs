import express from "express";
import {
  changePassword,
  forgotPassword,
  googleLogin,
  refreshToken,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "../controllers/authController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import passport from "../../config/passport.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/signin", signIn);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/signin`,
  }),
  googleLogin,
);

router.post("/signout", protectedRoute, signOut);

router.post("/refresh", refreshToken);

router.patch("/change-password", protectedRoute, changePassword);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
