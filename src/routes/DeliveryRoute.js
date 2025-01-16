import express from 'express';
import {
  DeliverySignUp, DeliveryLogin,
  UpdateDeliveryUserStatus, EditDeliveryProfile, GetDeliveryProfile
} from '../controllers/DeliveryController.js';
import { Authenticate } from '../middleware/CommonAuth.js';
import Offer from '../models/Offer.js';

const router = express.Router();

router.post('/signup', DeliverySignUp)
router.post('/login', DeliveryLogin)
router.use(Authenticate);
router.put('/change-status', UpdateDeliveryUserStatus);
router.get('/profile', GetDeliveryProfile)
router.patch('/profile', EditDeliveryProfile)

// export { router as DeliveryRoute}
export default router;