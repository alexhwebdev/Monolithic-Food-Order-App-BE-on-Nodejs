// import { plainToClass } from 'class-transformer';
// import { validate } from 'class-validator';
import express from 'express';
// import { CartItem, CreateCustomerInput, CreateDeliveryUserInput, EditCustomerProfileInput, OrderInputs, UserLoginInput } from '../dto';
import Customer from '../models/Customer.js';
import DeliveryUser from '../models/DeliveryUser.js';
// import Food from '../models/Food.js';
// import Vendor from '../models/Vendor.js';
// import Offer from '../models/Offer.js';
// import Order from '../models/Order.js';
// import Transaction from '../models/Transaction.js';
import { 
  GeneratePassword, GenerateSalt, 
  GenerateSignature, ValidatePassword 
} from '../utility/PasswordUtility.js';

export const DeliverySignUp = async (req, res, next) => {
  // const deliveryUserInputs = plainToClass(CreateDeliveryUserInput, req.body);
  // const validationError = await validate(deliveryUserInputs, {validationError: { target: true}})
  // if (validationError.length > 0) {
  //   return res.status(400).json(validationError);
  // }

  const { 
    email, phone, password, address, 
    firstName, lastName, pincode 
  } = req.body;
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  const existingDeliveryUser =  await DeliveryUser.findOne({ 
    email: email
  });
  console.log('DeliverySignUp existingDeliveryUser ', existingDeliveryUser)

  if (existingDeliveryUser !== null) {
    return res.status(400).json({message: 'A Delivery User exist with the provided email ID!'});
  }

  const result = await DeliveryUser.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    firstName: firstName,
    lastName: lastName,
    address: address,
    pincode: pincode,
    verified: false,
    lat: 0,
    lng: 0
  })
  console.log('DeliverySignUp result ', result)

  if (result) {
    const signature = await GenerateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified
    })
    console.log('DeliverySignUp signature ', signature)
    return res.status(201).json({
      signature, 
      verified: result.verified, 
      email: result.email
    })
  }
  return res.status(400).json({ msg: 'Error while creating Delivery user'});
}

export const DeliveryLogin = async (req, res, next) => {
  // const loginInputs = plainToClass(UserLoginInput, req.body);
  // const validationError = await validate(loginInputs, {validationError: { target: true}})
  // if (validationError.length > 0) {
  //   return res.status(400).json(validationError);
  // }
  const { email, password } = req.body;
  const deliveryUser = await DeliveryUser.findOne({ email: email});
  console.log('DeliveryLogin deliveryUser ', deliveryUser)

  if (deliveryUser) {
    const validation = await ValidatePassword(password, deliveryUser.password, deliveryUser.salt);
    console.log('DeliveryLogin validation ', validation)

    if (validation) {
      const signature = await GenerateSignature({
        _id: deliveryUser._id,
        email: deliveryUser.email,
        verified: deliveryUser.verified
      })
      console.log('DeliveryLogin signature ', signature)

      return res.status(201).json({
        signature,
        email: deliveryUser.email,
        verified: deliveryUser.verified
      })
    }
  }
  return res.json({ msg: 'Error Login'});
}

export const GetDeliveryProfile = async (req, res, next) => {
  const deliveryUser = req.user;

  if (deliveryUser) {
    const profile =  await DeliveryUser.findById(deliveryUser._id);
    
    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: 'Error while Fetching Profile'});
}

export const EditDeliveryProfile = async (req, res, next) => {
  // const customerInputs = plainToClass(EditCustomerProfileInput, req.body);
  // const validationError = await validate(customerInputs, {validationError: { target: true}})
  // if (validationError.length > 0){
  //   return res.status(400).json(validationError);
  // }
  const deliveryUser = req.user;
  const { firstName, lastName, address } = req.body;

  if (deliveryUser) {
    const profile =  await DeliveryUser.findById(deliveryUser._id);
    
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;
      const result = await profile.save()

      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: 'Error while Updating Profile'});
}

export const UpdateDeliveryUserStatus = async (req, res, next) => {
  const deliveryUser = req.user;
  
  if (deliveryUser) {
    const { lat, lng } = req.body;
    const profile = await DeliveryUser.findById(deliveryUser._id);

    if (profile) {
      if (lat && lng) {
        profile.lat = lat;
        profile.lng = lng;
      }

      profile.isAvailable = !profile.isAvailable;
      const result = await profile.save();

      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: 'Error while Updating Profile'});
}