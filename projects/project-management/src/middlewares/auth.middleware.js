import { ApiError } from "../utils/api-error";
import { asyncHandler } from "../utils/async-handler";
import { User } from "../models/user.models";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookie?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unothorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry",
    );
    if (!user) {
      throw new ApiError(401, "Invalid User");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid AccessToken");
  }
});
