// import { plainToClass } from 'class-transformer';
// import { validate } from 'class-validator';
import express from 'express';
// import { CartItem, CreateCustomerInput, EditCustomerProfileInput, OrderInputs, UserLoginInput } from '../dto';
import Customer from '../models/Customer.js';
import DeliveryUser from '../models/DeliveryUser.js';
import Food from '../models/Food.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Vendor from '../models/Vendor.js';
import { 
  GeneratePassword, GenerateSalt, 
  GenerateSignature, ValidatePassword 
} from '../utility/PasswordUtility.js';
import { GenerateOtp, onRequestOTP } from '../utility/NotificationUtility.js';


export const CustomerSignUp = async (req, res, next) => {
  // const customerInputs = plainToClass(CreateCustomerInput, req.body);
  // const validationError = await validate(
  //   customerInputs, 
  //   {validationError: { target: true}}
  // )
  // if(validationError.length > 0){
  //   return res.status(400).json(validationError);
  // }
  // const { email, phone, password } = customerInputs;

  const { email, phone, password } = req.body;

  // Manually validate inputs
  if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (!phone || typeof phone !== 'string' || phone.length < 10) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  const { otp, expiry } = GenerateOtp();
  // console.log('CustomerSignUp otp ', otp)
  // console.log('CustomerSignUp expiry ', expiry)
  const existingCustomer =  await Customer.findOne({ email: email });
  // console.log('CustomerSignUp existingCustomer ', existingCustomer)

  if (existingCustomer !== null) {
    return res.status(400).json({message: 'Email already exist!'});
  }

  const result = await Customer.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    otp: otp,
    otp_expiry: expiry,
    firstName: '',
    lastName: '',
    address: '',
    verified: false,
    lat: 0,
    lng: 0,
    orders: []
  })
  // console.log('CustomerSignUp result ', result)

  if (result) {
    // send OTP to customer
    await onRequestOTP(otp, phone);
    
    // Generate the Signature
    const signature = await GenerateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified
    })
    // Send the result
    return res.status(201).json({
      signature, 
      verified: result.verified, 
      email: result.email
    })
  }
  return res.status(400).json({ msg: 'Error while creating user'});
}

export const CustomerLogin = async (req, res, next) => {
  // const customerInputs = plainToClass(UserLoginInput, req.body);
  // const validationError = await validate(
  //   customerInputs, 
  //   {validationError: { target: true}}
  // )
  // if (validationError.length > 0) {
  //   return res.status(400).json(validationError);
  // }
  // const { email, password } = customerInputs;
  const { email, password } = req.body;

  // Manually validate input data
  if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ msg: 'Invalid email format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  const customer = await Customer.findOne({ email: email});
  console.log('CustomerLogin customer ', customer)
  
  if (customer) {
    const validation = await ValidatePassword(
      password, 
      customer.password, 
      customer.salt
    );
    console.log('CustomerLogin validation ', validation)
    
    if (validation) {
      const signature = await GenerateSignature({
        _id: customer._id,
        email: customer.email,
        verified: customer.verified
      })
      console.log('CustomerLogin signature ', signature)

      return res.json({
        signature: signature,
        email: customer.email,
        verified: customer.verified
      })
    }
  }

  return res.json({ msg: 'Error With Signup'});
}

export const CustomerVerify = async (req, res, next) => {
  const { otp } = req.body;
  const customer = req.user;

  if(customer){
    const profile = await Customer.findById(customer._id);
    
    if(profile){
      if(profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()){
        profile.verified = true;

        const updatedCustomerResponse = await profile.save();

        const signature = GenerateSignature({
          _id: updatedCustomerResponse._id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified
        })

        return res.status(200).json({
          signature,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified
        })
      }
    }
  }
  return res.status(400).json({ msg: 'Unable to verify Customer'});
}

export const RequestOtp = async (req, res, next) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const { otp, expiry } = GenerateOtp();
      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      const sendCode = await onRequestOTP(otp, profile.phone);

      if (!sendCode) {
        // Part 5, 33 min mark
        return res.status(400).json({ message: 'Failed to verify your phone number' })
      }
      return res.status(200).json({ message: 'OTP sent to your registered Mobile Number!'})
    }
  }
  return res.status(400).json({ msg: 'Error with Requesting OTP'});
}

export const GetCustomerProfile = async (req, res, next) => {
  const customer = req.user;

  if (customer) {
    const profile =  await Customer.findById(customer._id);
    
    if(profile){
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: 'Error while Fetching Profile'});
}

export const EditCustomerProfile = async (req, res, next) => {
  // const customer = req.user;
  // const customerInputs = plainToClass(EditCustomerProfileInput, req.body);
  // const validationError = await validate(customerInputs, {validationError: { target: true}})
  // if(validationError.length > 0){
  //   return res.status(400).json(validationError);
  // }
  // const { firstName, lastName, address } = customerInputs;

  const customer = req.user;
  
  // Manually extract input values from req.body
  const { firstName, lastName, address } = req.body;

  // Manual validation for the inputs
  if (firstName && typeof firstName !== 'string') {
    return res.status(400).json({ message: 'First name must be a string' });
  }
  if (lastName && typeof lastName !== 'string') {
    return res.status(400).json({ message: 'Last name must be a string' });
  }
  if (address && typeof address !== 'string') {
    return res.status(400).json({ message: 'Address must be a string' });
  }

  if (customer) {
    const profile =  await Customer.findById(customer._id);

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

const assignOrderForDelivery = async (orderId, vendorId) => {
  // find the vendor
  const vendor = await Vendor.findById(vendorId);
  console.log('assignOrderForDelivery vendor ', vendor)
  
  if (vendor) {
    const areaCode = vendor.pincode;
    const vendorLat = vendor.lat;
    const vendorLng = vendor.lng;
    console.log('assignOrderForDelivery areaCode ', areaCode)

    //find the available Delivery person
    const deliveryPerson = await DeliveryUser.find({ pincode: areaCode, verified: true, isAvailable: true});
    console.log('assignOrderForDelivery deliveryPerson ', deliveryPerson)

    if (deliveryPerson) {
      // Check the nearest delivery person and assign the order
      const currentOrder = await Order.findById(orderId);
      console.log('assignOrderForDelivery currentOrder ', currentOrder)

      if (currentOrder) {
        //update Delivery ID
        currentOrder.deliveryId = deliveryPerson[0]._id; 
        await currentOrder.save();
        //Notify to vendor for received new order firebase push notification
      }
    }
  }
  // Update Delivery ID
}

const validateTransaction = async(txnId) => {
  const currentTransaction = await Transaction.findById(txnId);
  console.log('validateTransaction currentTransaction ', currentTransaction)

  if (currentTransaction) {
    if (currentTransaction.status.toLowerCase() !== 'failed') {
      return {status: true, currentTransaction};
    }
  }
  return {status: false, currentTransaction};
}

export const CreateOrder = async (req, res, next) => {
  const customer = req.user;
  console.log('CreateOrder customer ', customer)
  const { txnId, amount, items } = req.body; // txnId = orderId
  console.log('CreateOrder req.body ', req.body)
  console.log('CreateOrder req.body.txnId ', req.body.txnId)
  console.log('CreateOrder req.body.amount ', req.body.amount)
  console.log('CreateOrder req.body.items ', req.body.items)

  if (customer) {
    const { status, currentTransaction } =  await validateTransaction(txnId);
    console.log('CreateOrder status ', status)
    console.log('CreateOrder currentTransaction ', currentTransaction)

    if (!status) {
      return res.status(404).json({ message: 'Error while Creating Order!'})
    }

    const profile = await Customer.findById(customer._id);
    const orderId = `${Math.floor(Math.random() * 89999)+ 1000}`;
    // const cart = req.body;
    let cartItems = Array();
    let netAmount = 0.0;
    let vendorId;

    const foods = await Food
      .find()
      .where('_id')
      .in(items.map(item => item._id))
      .exec();

    // let foodId = food._id

    foods.map(food => {
      items.map(({ _id, unit}) => {
        if (food._id == _id) {
          vendorId = food.vendorId;
          netAmount += (food.price * unit);
          cartItems.push({ food, unit})
        }
      })
    })

    if (cartItems) {
      const currentOrder = await Order.create({
        orderId: orderId,
        vendorId: vendorId,
        items: cartItems,
        totalAmount: netAmount,
        paidAmount: amount,
        orderDate: new Date(),
        orderStatus: 'Waiting',
        remarks: '',
        deliveryId: '',
        readyTime: 45
      })

      profile.cart = [];
      profile.orders.push(currentOrder);
      
      currentTransaction.vendorId = vendorId;
      currentTransaction.orderId = orderId;
      currentTransaction.status = 'CONFIRMED'

      await currentTransaction.save();
      await assignOrderForDelivery(currentOrder._id, vendorId);

      const profileSaveResponse =  await profile.save();
      
      res.status(200).json(profileSaveResponse);
    } else {
      return res.status(400).json({message: 'Unable to create Order!'});
    }
  }
  // return res.status(400).json({ msg: 'Error while Creating Order'});
}

export const GetOrders = async (req, res, next) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");
    
    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
  return res.status(400).json({ msg: 'Orders not found'});
}

export const GetOrderById = async (req, res, next) => {
  const orderId = req.params.id;
  console.log('CreateOrder req.params ', req.params)
  console.log('CreateOrder req.params.id ', req.params.id)
  
  if (orderId) {
    console.log('CreateOrder orderId ', orderId)
    const order = await Order.findById(orderId).populate("items.food");
    console.log('CreateOrder order ', order)

    if (order) {
      return res.status(200).json(order);
    }
  }
  return res.status(400).json({ msg: 'Order not found'});
}

export const AddToCart = async (req, res, next) => {
  const customer = req.user;
  console.log('AddToCart customer ', customer)
  console.log('AddToCart req.body ', req.body)
  
  if (customer) {
    const profile = await Customer.findById(customer._id);
    let cartItems = Array();

    const { _id, unit } = req.body;
    const food = await Food.findById(_id);
    console.log('AddToCart profile ', profile)
    console.log('AddToCart food ', food)

    if (food) {
      if (profile != null) {
        cartItems = profile.cart;
        console.log('AddToCart cartItems 1 ', cartItems)

        if (cartItems.length > 0) {
          // check and update
          let existFoodItems = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          console.log('AddToCart existFoodItems ', existFoodItems)
          
          if (existFoodItems.length > 0) {
            const index = cartItems.indexOf(existFoodItems[0]);
            console.log('AddToCart index ', index)
            
            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else{ 
            cartItems.push({ food, unit})
          }
        } else {
          console.log('AddToCart cartItems 2 ', cartItems)
          // add new Item
          cartItems.push({ food, unit });
        }

        if (cartItems) {
          profile.cart = cartItems;
          const cartResult = await profile.save();
          return res.status(200).json(cartResult.cart);
        }
      }
    }
  }
  return res.status(404).json({ msg: 'Unable to add to cart!'});
}

export const GetCart = async (req, res, next) => {
  const customer = req.user;
  
  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(200).json(profile.cart);
    }
  }
  return res.status(400).json({message: 'Cart is Empty!'})
}

export const DeleteCart = async (req, res, next) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer
      .findById(customer._id)
      .populate('cart.food')
      .exec();

    if (profile != null) {
      profile.cart = [];
      const cartResult = await profile.save();

      return res.status(200).json(cartResult);
    }
  }
  return res.status(400).json({message: 'cart is Already Empty!'})
}

export const VerifyOffer = async (req, res, next) => {
  const offerId = req.params.id;
  const customer = req.user;
  console.log('VerifyOffer offerId ', offerId)
  console.log('VerifyOffer customer ', customer)
  
  if (customer) {
    const appliedOffer = await Offer.findById(offerId);
    console.log('VerifyOffer appliedOffer ', appliedOffer)
    
    if (appliedOffer) {
      if (appliedOffer.promoType === "USER") {
        // Can only apply once per user

      } else {
        if (appliedOffer.isActive) {
          return res.status(200).json({ message: 'Offer is Valid', offer: appliedOffer});
        }        
      }
    }
  }
  return res.status(400).json({ msg: 'Offer is Not Valid'});
}

export const CreatePayment = async (req, res, next) => {
  const customer = req.user;
  const { amount, paymentMode, offerId} = req.body;
  let payableAmount = Number(amount);
  console.log('CreatePayment customer ', customer)
  console.log('CreatePayment amount ', amount)
  console.log('CreatePayment paymentMode ', paymentMode)
  console.log('CreatePayment offerId ', offerId)

  if (offerId) {
    const appliedOffer = await Offer.findById(offerId);
    console.log('CreatePayment appliedOffer ', appliedOffer)

    if (appliedOffer) {
      if(appliedOffer.isActive){
        payableAmount = (payableAmount - appliedOffer.offerAmount);
      }      
    }
  }
  // perform payment gateway charge api

  // create record on transaction
  const transaction = await Transaction.create({
    customer: customer._id,
    vendorId: '',
    orderId: '',
    orderValue: payableAmount,
    offerUsed: offerId || 'NA',
    status: 'OPEN',
    paymentMode: paymentMode,
    paymentResponse: 'Payment is cash on Delivery'
  })
  console.log('CreatePayment transaction ', transaction)

  return res.status(200).json(transaction);
}
