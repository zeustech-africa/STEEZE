import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// NOTE: All payment processing now goes through Paystack.

export default router;

