import express from 'express';
import { authenticate } from '../middleware/auth';
import * as appointmentController from '../controllers/appointmentController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post('/create', appointmentController.createAppointment);

// Get my appointments (for buyers/viewers)
router.get('/my', appointmentController.getMyAppointments);

// Get my property appointments (for property owners)
router.get('/myPropertyAppointment', appointmentController.getPropertyAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Update appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

// Legacy routes (keeping for compatibility)
router.post('/', appointmentController.createAppointment);
router.get('/property/:propertyId', appointmentController.getPropertyAppointments);
router.put('/:id/cancel', appointmentController.cancelAppointment);
router.put('/:id/confirm', appointmentController.confirmAppointment);

export default router;
