import { Router } from 'express';
import { registerUser, testToken } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';
import { validateSchema } from '../middleware/validate';
import { registerUserSchema } from '../validators/userValidator';


const router = Router();

router.post('/register', authenticate, validateSchema(registerUserSchema), registerUser);
router.post('/test-token', testToken);


export default router;