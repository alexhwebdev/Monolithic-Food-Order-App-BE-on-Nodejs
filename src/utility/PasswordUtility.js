import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { APP_SECRET } from '../config/index.js';
// import { VendorPayload } from '../dto';
// import { AuthPayload } from '../dto/Auth.dto';
import dotenv from 'dotenv';
// Load environment variables from the .env file
dotenv.config({ path: './.env' });

export const GenerateSalt = async () => {
  return await bcrypt.genSalt()    
}

export const GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
}

export const ValidatePassword = async (
  enteredPassword, savedPassword, salt
) => {
  return await GeneratePassword(enteredPassword, salt) === savedPassword;
}

export const GenerateSignature = async (payload) => {
  return jwt.sign(payload, process.env.APP_SECRET, { expiresIn: '90d'});
}

export const ValidateSignature  = async (req) => {
  const signature = req.get('Authorization');
  console.log('ValidateSignature signature', signature)

  if (signature) {
    try {
      const payload = await jwt.verify(signature.split(' ')[1], process.env.APP_SECRET); 
      req.user = payload;
      return true;

    } catch(err){
      return false
    } 
  }
  return false
};
