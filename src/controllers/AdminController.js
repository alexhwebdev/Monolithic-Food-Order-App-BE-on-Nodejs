import express from 'express';
// import { CreateVendorInput } from '../dto';
import DeliveryUser from '../models/Vendor.js';
import Vendor from '../models/Vendor.js';
import Transaction from '../models/Transaction.js';
import { 
  GeneratePassword, 
  GenerateSalt 
} from '../utility/PasswordUtility.js';
 
export const FindVendor = async (id, email) => {
  if (email) {
    return await Vendor.findOne({ email: email })
  } else {
    return await Vendor.findById(id);
  }
}

export const CreateVendor = async (req, res, next) => {
  // console.log('CreateVendor ' )
  const { name, address, pincode, foodType, 
    email, password, ownerName, phone }  = req.body;

  const existingVendor = await FindVendor('', email);
  if (existingVendor !== null) {
    return res.json({ "message": "A vendor is exist with this email ID"})
  }

  const salt =  await GenerateSalt()
  const userPassword = await GeneratePassword(password, salt);
  // console.log('CreateVendor userPassword ', userPassword)

  const createdVendor =  await Vendor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: [],
    foods: [],
    lat: 0,
    lng: 0
  })

  return res.json(createdVendor)
}


export const GetVendors = async (req, res, next) => {
  const vendors = await Vendor.find()

  if (vendors !== null) {
    return res.json(vendors)
  }

  return res.json({"message": "Vendors data not available"})
}

export const GetVendorByID = async (req, res, next) => {
  const vendorId = req.params.id;
  const vendors = await FindVendor(vendorId);

  if(vendors !== null){
    return res.json(vendors)
  }

  return res.json({"message": "Vendors data not available"})
}

export const GetTransactions = async (req, res, next) => {
  const transactions = await Transaction.find();

  if (transactions) {
    return res.status(200).json(transactions)
  }
  return res.json({"message": "Transactions data not available"})
}

export const GetTransactionById = async (req, res, next) => {
  const id = req.params.id;
  const transaction = await Transaction.findById(id);

  if (transaction) {
    return res.status(200).json(transaction)
  }
  return res.json({"message": "Transaction data not available"})
}

export const VerifyDeliveryUser = async (req, res, next) => {
  const { _id, status } = req.body;

  if (_id) {
    const profile = await DeliveryUser.findById(_id);

    if (profile) {
      profile.verified = status;
      const result = await profile.save();

      return res.status(200).json(result);
    }
  }
  return res.json({ message: 'Unable to verify Delivery User'});
}

export const GetDeliveryUsers = async (req, res, next) => {
  const deliveryUsers = await DeliveryUser.find();

  if (deliveryUsers) {
    return res.status(200).json(deliveryUsers);
  }
  return res.json({ message: 'Unable to get Delivery Users'});
}