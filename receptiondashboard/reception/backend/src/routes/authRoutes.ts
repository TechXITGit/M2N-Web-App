import express from 'express';
import { login, setup2FA, verifySetup2FA, verifyLogin2FA, verifyBackupCode } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify-setup', verifySetup2FA);
router.post('/2fa/verify-login', verifyLogin2FA);
router.post('/2fa/verify-backup-code', verifyBackupCode);

export default router;
