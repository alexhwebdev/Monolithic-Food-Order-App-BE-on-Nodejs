import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import AdminRoute from '../routes/AdminRoute.js'
import VendorRoute from '../routes/VendorRoute.js'
import CustomerRoute from '../routes/CustomerRoute.js';
import ShoppingRoute from '../routes/ShoppingRoute.js';
// import DeliveryRoute from '../routes/DeliveryRoute.js';
 

const __filename = fileURLToPath(import.meta.url); // Get the current file path
const __dirname = path.dirname(__filename); // Get the directory name from the file path
// console.log('__filename ', __filename)
// console.log('__dirname ', __dirname)

export default async ( app ) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true}))

  // app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({ extended: true }));
  
  const imagePath = path.join(__dirname,'../images');
  app.use('/images', express.static(imagePath));

  app.use('/images', express.static(imagePath));
  app.use('/admin', AdminRoute);
  app.use('/vendor', VendorRoute)
  app.use('/customer', CustomerRoute)
  // app.use('/delivery', DeliveryRoute);
  app.use(ShoppingRoute);

  return app;
}

  