import { Router } from "express";
import {
  bcryptPassword,
  comparePassword,
  generateAccessToken,
  getSessionData,
  validatetoken,
} from "../../helpers/helperFunction.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import { checkRateLimit } from "../../helpers/helperFunction.js";
import usermodel from "../../model/usermodel.js";

const authRouter = Router();

authRouter.post("/signin", signinHandler);
authRouter.post("/forgotpassword", forgetpasswordHandler);
authRouter.post("/resetpassword", resetpasswordHandler);
authRouter.post("/publictoken", refreshtokenHandler);
authRouter.post("/signup", signupHandler);

export default authRouter;

//signin
async function signinHandler(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const users = await usermodel.findOne({ email });

    if (!users) {
      return errorResponse(res, 404, "email not found");
    }
    const comparepassword = comparePassword(password, users.password);

    if (!comparepassword) {
      return errorResponse(res, 404, "invalid password");
    }

    const userid = users._id.toString();

    const { encoded_token, public_token } = generateAccessToken(
      userid,
      users.email,
      users.role
    );

    successResponse(res, "SignIn successfully", {
      encoded_token,
      public_token,
    });
  } catch (error) {
    console.log(error);
    errorResponse(res, 500, "internal server error");
  }
}

//forget password
async function forgetpasswordHandler(req, res) {
  try {
    const { email } = req.body;
    const usersotp = await usermodel.findOne({ email });
    if (!usersotp) {
      errorResponse(res, 400, "email id not found");
      return;
    }
    const isWithinRateLimit = await checkRateLimit(email);
    if (!isWithinRateLimit) {
      return errorResponse(
        res,
        429,
        "Too many requests, please try again later"
      );
    }
    // usersotp.tokenotp = await getEmailOTP(email);
    await usersotp.save();

    successResponse(res, "OTP successfully sent");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 400, "internal server error");
  }
}

//Reset password
async function resetpasswordHandler(req, res) {
  try {
    const { email, tokenotp, password } = req.body;
    const userReset = await usermodel.findOne({ email });

    if (!userReset) {
      errorResponse(res, 400, "email id not found");
      return;
    }

    // if (tokenotp != userReset.tokenotp) {
    //   errorResponse(res, 400, "invalid otp");
    //   return;
    // }
    userReset.password = bcryptPassword(password);
    userReset.save();
    successResponse(res, "password set successfully");
  } catch (error) {
    console.log("error", error);
  }
}

//refresh token
async function refreshtokenHandler(req, res) {
  try {
    const token = req.body.public_token;

    if (!token) {
      errorResponse(res, 400, "token not found");
      return;
    }
    let decoded = validatetoken(token);

    const sessionid = decoded ? getSessionData(decoded.id) : null;

    if (!sessionid || sessionid != decoded.sessionid) {
      console.log("session refresh token reused", decoded.id);
      throw new Error("refresh token expired");
    }

    const { encoded_token, public_token } = generateAccessToken(
      decoded.id,
      decoded.email,
      decoded.role
    );
    successResponse(res, "refresh tokens successfully", {
      encoded_token,
      public_token,
    });
  } catch (error) {
    console.log(error.message);
    errorResponse(res, 401, "refresh token expired, signin");
  }
}

async function signupHandler(req, res) {
  try {
    const { firstname, lastname, email, mobile, role, password, approved } =
      req.body;

    if (!firstname || !lastname || !email || !mobile || !role || !password) {
      return errorResponse(res, 400, "some params are missing");
    }
    // Prevent Signup with Admin Role
    if (role === "Admin") {
      return errorResponse(
        res,
        403,
        "Admin account cannot be created via signup"
      );
    }

    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, "User with this email already exists");
    }

    const hashedpassword = bcryptPassword(password);

    const newUser = await usermodel.create({
      mobile,
      firstname,
      lastname,
      email,
      approved,
      password: hashedpassword,
      approved,
      role,
    });

    await newUser.save();

    return successResponse(res, "Successfully signed up");
  } catch (error) {
    console.log("Error:", error.message);
    return errorResponse(res, 400, error.message);
  }
}
