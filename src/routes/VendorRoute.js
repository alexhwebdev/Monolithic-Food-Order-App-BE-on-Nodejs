import express from 'express';
import { 
  VendorLogin, GetVendorProfile, UpdateVendorProfile, UpdateVendorService,
  AddFood, GetFoods,
  UpdateVendorCoverImage,
  GetCurrentOrders, ProcessOrder, GetOrderDetails,
  GetOffers, AddOffer, EditOffer
} from '../controllers/VendorController.js';
import { Authenticate } from '../middleware/CommonAuth.js';
import multer from 'multer';

const router = express.Router();

// const imageStorage = multer.diskStorage({
//   destination: function(req,file, cb){
//     cb(null, 'images')
//   },
//   filename: function(req,file,cb){
//     cb(null, new Date().toISOString() + '_' + file.originalname);
//   }
// })
// const images = multer({ storage: imageStorage }).array('images', 10); // max 10 images


const imageStorage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'images')
  },
  filename: function(req, file, cb){
    cb(null, new Date().toISOString() + '_' + file.originalname);
    // cb(null, Date.now() + file.originalname);
  }
})
const images = multer({ storage: imageStorage }).array('images', 10); // max 10 images

router.get('/login', VendorLogin);
router.use(Authenticate)
router.get('/profile', GetVendorProfile);
router.patch('/profile', UpdateVendorProfile);
router.patch('/service', UpdateVendorService);

router.post('/food', images, AddFood);
router.get('/foods', GetFoods);

router.patch('/coverimage', images, UpdateVendorCoverImage);

router.get('/orders', GetCurrentOrders);
router.get('/order/:id', GetOrderDetails)
router.put('/order/:id/process', ProcessOrder);

router.get('/offers', GetOffers);
router.post('/offer', AddOffer);
router.put('/offer/:id', EditOffer)
// Delete Offers
 
router.get('/', (req, res, next) => {
  res.json({ message: "Hello from Vendor"})
})

// export { router as VendorRoute };
export default router;