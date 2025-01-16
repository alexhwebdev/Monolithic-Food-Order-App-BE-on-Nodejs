import express from 'express';
import { 
  CreateVendor, GetVendors, GetVendorByID, 
  GetTransactions, GetTransactionById, 
  VerifyDeliveryUser,
  GetDeliveryUsers
} from '../controllers/AdminController.js';

const router = express.Router();

router.post('/vendor', CreateVendor)
router.get('/vendors', GetVendors)
router.get('/vendor/:id', GetVendorByID)
router.get('/transactions', GetTransactions)
router.get('/transaction/:id', GetTransactionById)
router.get('/delivery/users', GetDeliveryUsers);
router.put('/delivery/verify', VerifyDeliveryUser)

router.get('/', (req, res, next) => {
  res.json({ message: "Hello from AdminRoute"})
})

// export { router as AdminRoute };
export default router;