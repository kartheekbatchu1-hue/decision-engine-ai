import express from 'express';
import {
  createDecision,
  getDecisions,
  getDecisionById,
  analyzeDecision,
  simulateDecision,
  deleteDecision,
  updateDecisionStatus,
} from '../controllers/decisionController.js';
import { validateRequest, createDecisionSchema } from '../validators/decisionValidator.js';

const router = express.Router();

router.post('/', validateRequest(createDecisionSchema), createDecision);
router.get('/', getDecisions);
router.get('/:id', getDecisionById);
router.post('/:id/analyze', analyzeDecision);
router.post('/:id/simulate', simulateDecision);
router.patch('/:id/status', updateDecisionStatus);
router.delete('/:id', deleteDecision);

export default router;

