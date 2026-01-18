import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as appointmentService from '../services/appointmentService';
import { AuthRequest } from '../middleware/auth';

// Create appointment
export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      propertyId: z.string(),
      listingId: z.string(),
      datetime: z.string().datetime(),
      description: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.createAppointment(
      {
        propertyId: BigInt(data.propertyId),
        listingId: BigInt(data.listingId),
        datetime: new Date(data.datetime),
        description: data.description,
      },
      userId
    );

    res.status(201).json({ result: 'success', appointment });
  } catch (error) {
    next(error);
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointmentId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.getAppointmentById(appointmentId, userId);

    res.status(200).json({ result: 'success', appointment });
  } catch (error) {
    next(error);
  }
};

// Update appointment
export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      datetime: z.string().datetime().optional(),
      description: z.string().optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    });

    const data = schema.parse(req.body);
    const appointmentId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.updateAppointment(
      appointmentId,
      {
        datetime: data.datetime ? new Date(data.datetime) : undefined,
        description: data.description,
        status: data.status,
      },
      userId
    );

    res.status(200).json({ result: 'success', appointment });
  } catch (error) {
    next(error);
  }
};

// Cancel appointment
export const cancelAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointmentId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.cancelAppointment(appointmentId, userId);

    res.status(200).json({ result: 'success', appointment });
  } catch (error) {
    next(error);
  }
};

// Confirm appointment
export const confirmAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointmentId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.confirmAppointment(appointmentId, userId);

    res.status(200).json({ result: 'success', appointment });
  } catch (error) {
    next(error);
  }
};

// Get my appointments
export const getMyAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await appointmentService.getMyAppointments(userId, { status, page, limit });

    res.status(200).json({ result: 'success', appointments: result.appointments, total: result.pagination.total });
  } catch (error) {
    next(error);
  }
};

// Get property appointments
export const getPropertyAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const propertyId = BigInt(req.params.propertyId);
    const userId = BigInt(req.user!.userId);
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await appointmentService.getPropertyAppointments(propertyId, userId, { status, page, limit });

    res.status(200).json({ result: 'success', appointments: result.appointments, total: result.pagination.total });
  } catch (error) {
    next(error);
  }
};

// Delete appointment
export const deleteAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointmentId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const appointment = await appointmentService.cancelAppointment(appointmentId, userId);

    res.status(200).json({ result: 'success', reason: 'Cuộc hẹn đã được xóa thành công' });
  } catch (error) {
    next(error);
  }
};
