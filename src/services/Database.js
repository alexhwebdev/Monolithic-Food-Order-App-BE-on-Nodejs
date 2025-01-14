import mongoose from 'mongoose'; 
// import { MONGO_URI } from '../config/index.js';
import dotenv from 'dotenv';
// Load environment variables from the .env file
dotenv.config({ path: './.env' });

export default async () => {
  await mongoose
    // .connect(MONGO_URI)
    .connect(process.env.MONGO_URI)
    .then((result) => {
      console.log("Connected to DB");
      // console.log("mongoose result ", result);
    })
    .catch((err) => {
      throw err;
    });
}
  
  
 
