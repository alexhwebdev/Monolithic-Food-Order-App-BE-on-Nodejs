import dotenv from 'dotenv';
// Load environment variables from the .env file
dotenv.config({ path: './.env' });

export const GenerateOtp = () => {
  const otp = Math.floor(10000 + Math.random() * 900000);
  let expiry = new Date()
  expiry.setTime(new Date().getTime() + (30 * 60 * 1000));

  return {otp, expiry};
}

export const onRequestOTP = async(otp, toPhoneNumber) => {
  // console.log('onRequestOTP toPhoneNumber ', `1${toPhoneNumber}`)
  try {
    const accountSid = process.env.TWILIO_ACCOUNTSID;
    const authToken = process.env.TWILIO_AUTHTOKEN;
    const client = require('twilio')(accountSid, authToken);

    const response = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: '+18889193309',
      to: `+1${toPhoneNumber}` // recipient phone number // Add country before the number
    })
    // console.log('onRequestOTP response ', response)

    return response;
  } catch (error){
    return false
  }
}

/* ------------------- Payment --------------------- */