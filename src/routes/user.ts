import { Router } from 'express';
import { registerUser } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';
import { validateSchema } from '../middleware/validate';
import { registerUserSchema } from '../validators/userValidator';


const router = Router();

router.post('/register',authenticate, validateSchema(registerUserSchema), registerUser);


export default router;