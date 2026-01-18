import prisma from '../utils/prisma';

export interface CreateAppointmentInput {
  propertyId: bigint;
  listingId: bigint;
  datetime: Date;
  description?: string;
}

export interface UpdateAppointmentInput {
  datetime?: Date;
  description?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

// Create appointment
export const createAppointment = async (input: CreateAppointmentInput, userId: bigint) => {
  return prisma.appointment.create({
    data: {
      propertyId: input.propertyId,
      userId: userId,
      listingId: input.listingId,
      datetime: input.datetime,
      description: input.description,
      status: 'PENDING',
    },
    include: {
      Property: {
        select: {
          propertyId: true,
          title: true,
          address: true,
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          email: true,
          phone: true,
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: bigint, userId: bigint) => {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      Property: {
        select: {
          propertyId: true,
          title: true,
          address: true,
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          email: true,
          phone: true,
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Check if user is owner or appointment creator
  const property = await prisma.property.findUnique({
    where: { propertyId: appointment.propertyId },
    select: { userId: true },
  });

  if (appointment.userId !== userId && property?.userId !== userId) {
    throw new Error('Not authorized to view this appointment');
  }

  return appointment;
};

// Update appointment
export const updateAppointment = async (appointmentId: bigint, input: UpdateAppointmentInput, userId: bigint) => {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      Property: {
        select: { userId: true },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Only appointment creator or property owner can update
  if (appointment.userId !== userId && appointment.Property.userId !== userId) {
    throw new Error('Not authorized to update this appointment');
  }

  return prisma.appointment.update({
    where: { appointmentId },
    data: {
      datetime: input.datetime,
      description: input.description,
      status: input.status,
    },
    include: {
      Property: {
        select: {
          propertyId: true,
          title: true,
          address: true,
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          email: true,
          phone: true,
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: bigint, userId: bigint) => {
  return updateAppointment(appointmentId, { status: 'CANCELLED' }, userId);
};

// Confirm appointment
export const confirmAppointment = async (appointmentId: bigint, userId: bigint) => {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      Property: {
        select: { userId: true },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Only property owner can confirm
  if (appointment.Property.userId !== userId) {
    throw new Error('Only property owner can confirm appointments');
  }

  return prisma.appointment.update({
    where: { appointmentId },
    data: { status: 'CONFIRMED' },
    include: {
      Property: {
        select: {
          propertyId: true,
          title: true,
          address: true,
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          email: true,
          phone: true,
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });
};

// Get my appointments
export const getMyAppointments = async (userId: bigint, filters: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    userId: userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { datetime: 'desc' },
      include: {
        Property: {
          select: {
            propertyId: true,
            title: true,
            address: true,
          },
        },
        Listing: {
          select: {
            listingId: true,
            title: true,
          },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get property appointments (for property owner)
export const getPropertyAppointments = async (propertyId: bigint, userId: bigint, filters: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) => {
  // Verify user owns the property
  const property = await prisma.property.findUnique({
    where: { propertyId },
    select: { userId: true },
  });

  if (!property || property.userId !== userId) {
    throw new Error('Not authorized to view appointments for this property');
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    propertyId: propertyId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { datetime: 'desc' },
      include: {
        User: {
          select: {
            userId: true,
            fullname: true,
            email: true,
            phone: true,
          },
        },
        Listing: {
          select: {
            listingId: true,
            title: true,
          },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
