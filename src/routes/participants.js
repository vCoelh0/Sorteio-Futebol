import { Router } from 'express';
import { listActiveParticipants } from '../services/participants.js';

export const participantsRouter = Router();

participantsRouter.get('/', async (_request, response, next) => {
  try {
    const participants = await listActiveParticipants();
    response.json({ participants, total: participants.length });
  } catch (error) {
    next(error);
  }
});
