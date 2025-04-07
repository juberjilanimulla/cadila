import { errorResponse } from "./serverResponse.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt, { compare } from "bcryptjs";
import axios from "axios";
import config from "../config.js";
import crypto from "crypto";
import usermodel from "../model/usermodel.js";
import dotenv from "dotenv";
import Mailjet from "node-mailjet";

dotenv.config();
const secrectKey = crypto.randomBytes(48).toString("hex");

export function generateAccessToken(id, email, role, firstname) {
  const sessionid = createSession(id);
  const encoded_tokenPayload = {
    id,
    email,
    role,
    firstname,
  };
  const public_tokenPayload = {
    id,
    email,
    role,
    sessionid,
    firstname,
  };
  const encoded_token = jwt.sign(encoded_tokenPayload, secrectKey, {
    expiresIn: "1d",
  });
  const public_token = jwt.sign(public_tokenPayload, secrectKey, {
    expiresIn: "1d",
  });
  return { encoded_token, public_token };
}

export function validatetoken(token) {
  try {
    // console.log("tok", token);
    return jwt.verify(token, secrectKey);
  } catch (error) {
    throw error;
  }
}

export async function isAdminMiddleware(req, res, next) {
  const isAdmin = res.locals.role;
  // console.log("isAdmin", isAdmin);
  if (!isAdmin || isAdmin !== "Admin") {
    errorResponse(res, 403, "user not authorized");
    return;
  }
  next();
}

// auth middleware
/**
 *
 * @param {import("express").Request} req
 * @param {Response} res
 * @param {import("express").Nextexport function} next
 */
export function authMiddleware(req, res, next) {
  const authHeader =
    req.headers.Authorization || req.headers.authorization || req.query.token;

  if (!authHeader) {
    errorResponse(res, 401, "token not found");
    return;
  }
  const encoded_token = authHeader.split(" ")[1];

  if (!encoded_token) return res.status(401).json("Unauthorize user");

  try {
    const decoded = jwt.verify(encoded_token, secrectKey);

    if (!decoded.id || !decoded.role || !decoded.email) {
      console.log("Not authorized");
      return res.status(401).json("Unauthorize user");
    }

    res.locals["id"] = decoded.id;
    res.locals["role"] = decoded.role;
    res.locals["email"] = decoded.email;

    next();
  } catch (error) {
    console.log(error.message);
    return errorResponse(res, 401, "user not authorized");
  }
}

//hash pass
export function bcryptPassword(password) {
  return bcrypt.hashSync(password, 10);
}

//compare pass
export function comparePassword(password, hashedpassword) {
  return bcrypt.compareSync(password, hashedpassword);
}

//sessions...
let sessions = new Map();
/**
 *
 * @param {Object} data
 * @returns
 */
export function createSession(id) {
  const sessionId = uuidv4();
  sessions.set(id, sessionId);
  return sessionId;
}

export function getSessionData(id) {
  return sessions.has(id) ? sessions.get(id) : null;
}

export function deleteSession(id) {
  return sessions.has(id) ? sessions.delete(id) : false;
}

export async function Admin() {
  const adminstr = process.env.ADMIN;
  const admins = adminstr.split(",");

  for (const email of admins) {
    const exist = await usermodel.findOne({ email });
    if (!exist) {
      await usermodel.create({
        firstname: "admin",
        lastname: "admin",
        email: email,
        role: "Admin",
        mobile: "+1 (832) 757-9277",
        password: bcryptPassword("1234"),
        approved: true,
      });
    } else {
      console.log("admin already exist");
    }
  }
}

// export async function GetJobidNumber() {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, "0");

//   const prefix = `${year}${month}`;

//   // Find the highest serial number for the current month
//   const lastproduct = await careermodel
//     .findOne({
//       jobid: new RegExp(`^${prefix}`),
//     })
//     .sort({ jobid: -1 })
//     .exec();

//   let serialNumber = "0001";
//   if (lastproduct) {
//     const lastSerial = parseInt(lastproduct.jobid.slice(-4), 10);
//     serialNumber = String(lastSerial + 1).padStart(4, "0");
//   }

//   return `${prefix}${serialNumber}`;
// }

const otpRequestStore = {};

//  Function to check rate limit for OTP requests
export async function checkRateLimit(email) {
  const windowMs = 15 * 60 * 1000; // 15 minutes in milliseconds
  const maxRequests = 5;
  const now = Date.now();

  // Initialize request count for the mobile number if not exists
  if (!otpRequestStore[email]) {
    otpRequestStore[email] = [];
  }

  // Clean up old entries from the store
  otpRequestStore[email] = otpRequestStore[email].filter((entry) => {
    return entry.timestamp + windowMs > now;
  });

  // Check request count
  if (otpRequestStore[email].length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request to the store
  otpRequestStore[email].push({ timestamp: now });

  return true; // Within rate limit
}

export async function getnumber(id) {
  // console.log(id);
  return id;
}

export async function sendEmailOTP(email) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mj = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    const request = await mj.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER,
            Name: "Cadila Global",
          },
          To: [{ Email: email }],
          Subject: "Reset your password",
          TextPart: `Hi ,

Thank you for connecting with Cadila Global.

Please use the following One-Time Password (OTP) to verify your email address:
${otp}
 
If you did not request this verification, please disregard this message.

Warm regards,
Cadila Globall`,
        },
      ],
    });

    return otp;
  } catch (error) {
    console.error("Mailjet OTP Error:", error.response?.body || error.message);
    return null;
  }
}

export function generatecaptcha() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let captcha = "";
  const usedChars = new Set();

  while (captcha.length < 8) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));

    if (!usedChars.has(randomChar)) {
      captcha += randomChar;
      usedChars.add(randomChar);
    }
  }
  return captcha;
}

export async function sendContactFormEmail({
  firstname,
  lastname,
  email,
  mobile,
  message,
}) {
  try {
    const mj = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    const request = await mj.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER,
            Name: "Cadila Global ",
          },
          To: [
            {
              Email: process.env.ADMIN_JU, // Admin email to receive alerts
              Name: "Cadila Global",
            },
          ],
          Subject: "New Contact Form Submission",
          HTMLPart: `
            <h3> New Contact Form Submission Received</h3>
            <p><strong>Name:</strong> ${firstname} ${lastname}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Message:</strong><br/> ${message}</p>
            <br/>
           
          `,
        },
      ],
    });

    return true;
  } catch (error) {
    console.error(
      "Mailjet Contact Email Error:",
      error.response?.body || error.message
    );
    return false;
  }
}

export async function sendUserApprovalStatusEmail({
  email,
  firstname,
  approved,
}) {
  try {
    const mj = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    const subject = approved
      ? " You account has been Approved."
      : " Your account have been locked.";

    const message = approved
      ? `<p>Hi ${firstname},</p><p> Your account has been <strong>approved</strong> by our admin team. You may now proceed with accessing the dashboard.</p>`
      : `<p>Hi ${firstname},</p><p> Your account has been <strong>locked</strong>. Please contact your admin team to unlock your account.</p>`;

    await mj.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER,
            Name: "Cadila Global",
          },
          To: [{ Email: email }],
          Subject: subject,
          HTMLPart: `
            ${message}
            <br/>
            <p>Regards,<br/>Cadila Global</p>
          `,
        },
      ],
    });
  } catch (error) {
    console.error(
      "Mailjet Notification Email Error:",
      error.response?.body || error.message
    );
  }
}

// export async function sendMailToTalent({
//   companyname,
//   email,
//   jobrole,
//   jobdescription,
//   mobile,
// }) {
//   try {
//     const mj = Mailjet.apiConnect(
//       process.env.MAILJET_API_KEY,
//       process.env.MAILJET_SECRET_KEY
//     );

//     const request = await mj.post("send", { version: "v3.1" }).request({
//       Messages: [
//         {
//           From: {
//             Email: process.env.MAILJET_SENDER,
//             Name: "Cadila Global",
//           },
//           To: [
//             {
//               Email: email, // Talent's email address
//               Name: companyname,
//             },
//           ],
//           Subject: " Congratulations! Your Job Role Submission is Received",
//           HTMLPart: `
//             <h3> Thank You for Submitting a Job Role!</h3>
//             <p>Dear ${companyname},</p>
//             <p>We have received the following details for your job posting:</p>
//             <ul>
//               <li><strong>Job Role:</strong> ${jobrole}</li>
//               <li><strong>Job Description:</strong> ${jobdescription}</li>
//               <li><strong>Mobile:</strong> ${mobile}</li>
//               <li><strong>Email:</strong> ${email}</li>
//             </ul>
//             <p>Our team will review your submission and get back to you shortly.</p>
//             <br/>
//             <p style="font-size: 13px; color: #888;">If you did not submit this, please contact us immediately at ${process.env.ADMIN_JU}.</p>
//           `,
//         },
//       ],
//     });

//     return true;
//   } catch (error) {
//     console.error(
//       "Mailjet Talent Email Error:",
//       error.response?.body || error.message
//     );
//     return false;
//   }
// }
export async function sendMailToAdminforTalent({
  companyname,
  email,
  jobrole,
  jobdescription,
  mobile,
}) {
  try {
    const mj = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    const request = await mj.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER, // Verified sender email address
            Name: "Talent Hire Form",
          },
          To: [
            {
              Email: process.env.ADMIN_JU, // Admin email address
              Name: "Cadila Global Admin",
            },
          ],
          ReplyTo: {
            Email: email, // User's email address to allow direct reply
            Name: companyname,
          },
          Subject: "New Talent Hire Submission Received",
          HTMLPart: `
            <h3> New Talent Hire Submission Received</h3>
            <p>The following details were submitted by a company:</p>
            <ul>
              <li><strong>Company Name:</strong> ${companyname}</li>
              <li><strong>Job Role:</strong> ${jobrole}</li>
              <li><strong>Job Description:</strong> ${jobdescription}</li>
              <li><strong>Mobile:</strong> ${mobile}</li>
              <li><strong>Email:</strong> ${email}</li>
            </ul>
            <p>Please review this submission and take the necessary actions.</p>
            <br/>
            <p style="font-size: 13px; color: #888;">This email was automatically generated by the Talent Hire Form system.</p>
          `,
        },
      ],
    });
    return { success: true, message: "Email sent successfully to admin." };
  } catch (error) {
    console.error(
      "Mailjet Talent Email Error:",
      error.response?.body || error.message
    );
    return { success: false, error: error.response?.body || error.message };
  }
}
