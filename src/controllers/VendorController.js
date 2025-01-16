import express from 'express';
// import { CreateFoodInput, CreateOfferInputs, EditVendorInput, VendorLoginInput } from '../dto'
import Food from '../models/Food.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import { GenerateSignature, ValidatePassword } from '../utility/PasswordUtility.js';
import { FindVendor } from './AdminController.js';


export const VendorLogin = async (req, res, next) => {
  // console.log('VendorLogin req ', req)
  const { email, password } = req.body;
  const existingUser = await FindVendor('', email);
  if (existingUser !== null) {
    const validation = await ValidatePassword(
      password, 
      existingUser.password, 
      existingUser.salt
    );
    // console.log('VendorLogin validation ', validation)
    if (validation) {
      const signature = await GenerateSignature({
        _id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name
      })
      console.log('VendorLogin signature ', signature)
      return res.json(signature);
    }
  }
  return res.json({'message': 'Login credential is not valid'})
}

export const GetVendorProfile = async (req, res, next) => {
  const user = req.user;
  console.log('GetVendorProfile user ', user)
  if (user) {
    const existingVendor = await FindVendor(user._id);
    // console.log('GetVendorProfile existingVendor ', existingVendor)
    return res.json(existingVendor);
  }
  return res.json({'message': 'vendor Information Not Found'})
}

export const UpdateVendorProfile = async (req, res, next) => {
  const user = req.user;
  const { foodType, name, address, phone} = req.body;
  console.log('UpdateVendorProfile user ', user)

  if (user) {
    const existingVendor = await FindVendor(user._id);
    console.log('UpdateVendorProfile existingVendor ', existingVendor)
    if (existingVendor !== null){
      existingVendor.name = name;
      existingVendor.address;
      existingVendor.phone = phone;
      existingVendor.foodType = foodType;
      const saveResult = await existingVendor.save();
      console.log('UpdateVendorProfile saveResult ', saveResult)
      return res.json(saveResult);
    }
  }
  return res.json({'message': 'Unable to Update vendor profile '})
}

export const UpdateVendorCoverImage = async (req,res, next) => {
  const user = req.user;

  if (user) {
    const vendor = await FindVendor(user._id);
    console.log('UpdateVendorCoverImage vendor ', vendor)

    if (vendor !== null){
      const files = req.files;
      console.log('UpdateVendorCoverImage files ', files)
      const images = files.map((file) => file.filename);
      vendor.coverImages.push(...images);
      const saveResult = await vendor.save();
      
      return res.json(saveResult);
    }
  }
  return res.json({'message': 'Unable to Update vendor profile '})
}

export const UpdateVendorService = async (req,res, next) => {
  const user = req.user;
  const { lat, lng } = req.body;
    
  if (user) {
    const existingVendor = await FindVendor(user._id);
    
    if (existingVendor !== null){
      existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
      if (lat && lng) {
        existingVendor.lat = lat;
        existingVendor.lng = lng;
      }
      const saveResult = await existingVendor.save();

      return res.json(saveResult);
    }
  }
  return res.json({'message': 'Unable to Update vendor profile '})
}

export const AddFood = async (req, res, next) => {
  const user = req.user;
  const { name, description, category, foodType, 
    readyTime, price } = req.body;
    
  if (user) {
    const vendor = await FindVendor(user._id);

    if (vendor !== null) {
      const files = req.files;
      const images = files.map((file) => file.filename);
      const food = await Food.create({
        vendorId: vendor._id,
        name: name,
        description: description,
        category: category,
        price: price,
        rating: 0,
        readyTime: readyTime,
        foodType: foodType,
        // images: ['placeholder.jpg']
        images: images
      })
      vendor.foods.push(food);
      const result = await vendor.save();
      return res.json(result);
    }
  }
  return res.json({'message': 'Unable to Update vendor profile '})
}

export const GetFoods = async (req, res, next) => {
  const user = req.user;

  if (user) {
    const foods = await Food.find({ vendorId: user._id});
    if (foods !== null) {
      return res.json(foods);
    }
  }
  return res.json({'message': 'Foods not found!'})
}

export const GetCurrentOrders = async (req, res, next) => {
  const user = req.user;
  console.log('GetCurrentOrders user', user)
  
  if (user) {
    const orders = await Order
      .find({ vendorId: user._id})
      .populate('items.food');
    console.log('GetCurrentOrders orders', orders)

    if (orders != null) {
      return res.status(200).json(orders);
    }
  }
  return res.json({ message: 'Orders Not found'});
}

export const GetOrderDetails = async (req, res, next) => {
  const orderId = req.params.id;
  console.log('GetOrderDetails orderId', orderId)
  
  if (orderId) {
    const order = await Order
      .findById(orderId)
      .populate('items.food');
    console.log('GetOrderDetails order', order)

    if (order != null) {
      return res.status(200).json(order);
    }
  }
  return res.json({ message: 'Order Not found'});
}

export const ProcessOrder = async (req, res, next) => {
  const orderId = req.params.id;
  console.log('ProcessOrder orderId', orderId)
  const { status, remarks, time } = req.body;
  console.log('ProcessOrder status', status)
  console.log('ProcessOrder remarks', remarks)
  console.log('ProcessOrder time', time)
  
  if (orderId) {
    const order = await Order
      .findById(orderId)
      .populate('items.food');
    console.log('ProcessOrder order', order)
    order.orderStatus = status;
    order.remarks = remarks;

    if (time) {
      order.readyTime = time;
    }

    const orderResult = await order.save();
    console.log('ProcessOrder orderResult', orderResult)
    if (orderResult != null) {
      return res.status(200).json(orderResult);
    }
  }
  return res.json({ message: 'Unable to process order'});
}

export const GetOffers = async (req, res, next) => {
  const user = req.user;
  console.log('GetOffers user ', user)

  if (user) {
    let currentOffer = Array();
    const offers = await Offer.find().populate('vendors');
    console.log('GetOffers currentOffer ', currentOffer)
    console.log('GetOffers offers ', offers)

    if (offers) {
      offers.map(item => {
        console.log('GetOffers item ', item)

        if (item.vendors) {
          item.vendors.map(vendor => {
            console.log('GetOffers vendor ', vendor)
            
            if (vendor._id.toString() === user._id) {
              currentOffer.push(item);
            }
          })
        }

        if (item.offerType === "GENERIC") {
          currentOffer.push(item)
        }
      })
    }
    return res.status(200).json(currentOffer);
  }
  return res.json({ message: 'Offers Not available'});
}

export const AddOffer = async (req, res, next) => {
  const user = req.user;
  console.log('AddOffer user ', user)

  if (user) {
    const { title, description, offerType, offerAmount, 
      pincode, promocode, promoType, startValidity, 
      endValidity, bank, bins, minValue, isActive 
    } = req.body;

    const vendor = await FindVendor(user._id);
    console.log('AddOffer vendor ', vendor)

    if (vendor) {
      const offer = await Offer.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promocode,
        promoType,
        startValidity,
        endValidity,
        bank,
        bins,
        isActive,
        minValue,
        vendors:[vendor]
      })
      console.log('AddOffer offer ', offer)
      return res.status(200).json(offer);
    }
  }
  return res.json({ message: 'Unable to add Offer!'});
}

export const EditOffer = async (req, res, next) => {
  const user = req.user;
  const offerId = req.params.id;
  console.log('EditOffer user ', user)
  console.log('EditOffer offerId ', offerId)

  if (user) {
    const { title, description, offerType, 
      offerAmount, pincode, promocode, promoType, 
      startValidity, endValidity, bank, bins, 
      minValue, isActive 
    } = req.body;

    const currentOffer = await Offer.findById(offerId);
    console.log('EditOffer currentOffer ', currentOffer)

    if (currentOffer) {
      const vendor = await FindVendor(user._id);

      if (vendor) {
        currentOffer.title = title,
        currentOffer.description = description,
        currentOffer.offerType = offerType,
        currentOffer.offerAmount = offerAmount,
        currentOffer.pincode = pincode,
        currentOffer.promoType = promoType,
        currentOffer.startValidity = startValidity,
        currentOffer.endValidity = endValidity,
        currentOffer.bank = bank,
        currentOffer.isActive = isActive,
        currentOffer.minValue = minValue;

        const result = await currentOffer.save();
        console.log('EditOffer result ', result)
        
        return res.status(200).json(result);
      } 
    }
  }
  return res.json({ message: 'Unable to add Offer!'});    
}


