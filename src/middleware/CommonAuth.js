// import { Request, NextFunction, Response } from 'express'
// import { AuthPayload } from '../dto'
import { ValidateSignature } from '../utility/PasswordUtility.js';

// declare global {
//   namespace Express{
//     interface Request{
//       user?: AuthPayload
//     }
//   }
// }

export const Authenticate = async (req, res, next) => {
  const signature = await ValidateSignature(req);

  if (signature) {
    console.log('Authentication successful!')
    return next()
  } else {
    return res.json({message: "User Not authorised"});
  }
}
