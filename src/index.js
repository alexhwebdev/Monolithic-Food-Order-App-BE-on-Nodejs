import App from './services/ExpressApp.js';
import dbConnection from './services/Database.js';
// import { PORT } from './config';
import express from 'express';
import dotenv from 'dotenv';
// Load environment variables from the .env file
dotenv.config({ path: './.env' });

const StartServer = async () => {
  const app = express();

  await dbConnection()
  await App(app);

  app.listen(process.env.PORT || 8000, () => {
    console.log(`Listening to port ${process.env.PORT}`);
  });
}
StartServer();
