import express from 'express';
import { 
  GetAvailableOffers, GetFoodAvailability, 
  GetFoodsIn30Min, GetTopRestaurants, 
  RestaurantById, SearchFoods 
} from '../controllers/ShoppingController.js';

const router = express.Router();

router.get('/:pincode', GetFoodAvailability )
router.get('/top-restaurant/:pincode', GetTopRestaurants)
router.get('/foods-in-30-min/:pincode', GetFoodsIn30Min)
router.get('/search/:pincode', SearchFoods)
router.get('/restaurant/:id', RestaurantById)
router.get('/offers/:pincode', GetAvailableOffers)


// export { router as ShoppingRoute}
export default router;

