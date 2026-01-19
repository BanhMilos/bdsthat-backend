import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

// Helpers to normalize IDs to numbers in API responses
const toNumberIfBigInt = (v: any) => (typeof v === 'bigint' ? Number(v) : v);
const mapUser = (u: any) =>
  u
    ? {
        ...u,
        userId: toNumberIfBigInt(u.userId),
      }
    : u;
const mapProperty = (p: any) =>
  p
    ? {
        ...p,
        propertyId: toNumberIfBigInt(p.propertyId),
        userId: toNumberIfBigInt(p.userId),
        authorizedUserId:
          p.authorizedUserId !== null && p.authorizedUserId !== undefined
            ? toNumberIfBigInt(p.authorizedUserId)
            : p.authorizedUserId,
        authorizedAgentId:
          p.authorizedAgentId !== null && p.authorizedAgentId !== undefined
            ? toNumberIfBigInt(p.authorizedAgentId)
            : p.authorizedAgentId,
        projectId:
          p.projectId !== null && p.projectId !== undefined
            ? toNumberIfBigInt(p.projectId)
            : p.projectId,
        buildingId:
          p.buildingId !== null && p.buildingId !== undefined
            ? toNumberIfBigInt(p.buildingId)
            : p.buildingId,
        subdivisionId:
          p.subdivisionId !== null && p.subdivisionId !== undefined
            ? toNumberIfBigInt(p.subdivisionId)
            : p.subdivisionId,
        primaryMediaId:
          p.primaryMediaId !== null && p.primaryMediaId !== undefined
            ? toNumberIfBigInt(p.primaryMediaId)
            : p.primaryMediaId,
        User_Property_userIdToUser: mapUser(p.User_Property_userIdToUser),
        User_Property_authorizedAgentIdToUser: mapUser(p.User_Property_authorizedAgentIdToUser),
      }
    : p;

export interface CreatePropertyInput {
  userId: bigint;
  address: string;
  title: string;
  propertyType: string;
  description?: string;
  projectId?: bigint;
  buildingId?: bigint;
  subdivisionId?: bigint;
  floor?: number;
  unit?: string;
  width?: number;
  length?: number;
  floors?: number;
  floorArea?: number;
  buildingArea?: number;
  landArea?: number;
  bedrooms?: number;
  toilets?: number;
  direction?: string;
  legalDocumentType?: string;
  legalDocumentNumber?: string;
  legalStatus?: string;
  latitude?: number;
  longitude?: number;
  furniture?: string;
  streetWidth?: number;
  usageStatus?: string;
  areaPId?: number;
  areaWId?: number;
  oldAreaPId?: number;
  oldAreaDId?: number;
  oldAreaWId?: number;
  authorizedUserId?: bigint;
  authorizedAgentId?: bigint;
}

export interface UpdatePropertyInput {
  address?: string;
  title?: string;
  propertyType?: string;
  description?: string;
  projectId?: bigint;
  buildingId?: bigint;
  subdivisionId?: bigint;
  floor?: number;
  unit?: string;
  width?: number;
  length?: number;
  floors?: number;
  floorArea?: number;
  buildingArea?: number;
  landArea?: number;
  bedrooms?: number;
  toilets?: number;
  direction?: string;
  legalDocumentType?: string;
  legalDocumentNumber?: string;
  legalStatus?: string;
  latitude?: number;
  longitude?: number;
  furniture?: string;
  streetWidth?: number;
  usageStatus?: string;
  status?: string;
  areaPId?: number;
  areaWId?: number;
  oldAreaPId?: number;
  oldAreaDId?: number;
  oldAreaWId?: number;
  authorizedUserId?: bigint;
  authorizedAgentId?: bigint;
  primaryMediaId?: bigint;
}

export const createProperty = async (input: CreatePropertyInput) => {
  const property = await prisma.property.create({
    data: {
      userId: input.userId,
      address: input.address,
      title: input.title,
      propertyType: input.propertyType as any,
      description: input.description,
      projectId: input.projectId,
      buildingId: input.buildingId,
      subdivisionId: input.subdivisionId,
      floor: input.floor,
      unit: input.unit,
      width: input.width ? new Prisma.Decimal(input.width) : undefined,
      length: input.length ? new Prisma.Decimal(input.length) : undefined,
      floors: input.floors,
      floorArea: input.floorArea ? new Prisma.Decimal(input.floorArea) : undefined,
      buildingArea: input.buildingArea ? new Prisma.Decimal(input.buildingArea) : undefined,
      landArea: input.landArea ? new Prisma.Decimal(input.landArea) : undefined,
      bedrooms: input.bedrooms,
      toilets: input.toilets,
      direction: input.direction as any,
      legalDocumentType: input.legalDocumentType as any,
      legalDocumentNumber: input.legalDocumentNumber,
      legalStatus: input.legalStatus as any,
      latitude: input.latitude ? new Prisma.Decimal(input.latitude) : undefined,
      longitude: input.longitude ? new Prisma.Decimal(input.longitude) : undefined,
      furniture: input.furniture as any,
      streetWidth: input.streetWidth ? new Prisma.Decimal(input.streetWidth) : undefined,
      usageStatus: input.usageStatus as any,
      areaPId: input.areaPId,
      areaWId: input.areaWId,
      oldAreaPId: input.oldAreaPId,
      oldAreaDId: input.oldAreaDId,
      oldAreaWId: input.oldAreaWId,
      authorizedUserId: input.authorizedUserId,
      authorizedAgentId: input.authorizedAgentId,
      status: 'DRAFT',
    },
    include: {
      Media_Media_propertyIdToProperty: {
        orderBy: { order: 'asc' },
      },
      Document: true,
    },
  });

  return mapProperty(property);
};

export const listProperties = async (filters: {
  page?: number;
  limit?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minArea?: number;
  maxArea?: number;
  areaPId?: number;
  areaWId?: number;
  userId?: bigint;
  status?: string;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.propertyType) {
    where.propertyType = filters.propertyType;
  }

  if (filters.bedrooms) {
    where.bedrooms = filters.bedrooms;
  }

  if (filters.minArea || filters.maxArea) {
    where.landArea = {};
    if (filters.minArea) where.landArea.gte = new Prisma.Decimal(filters.minArea);
    if (filters.maxArea) where.landArea.lte = new Prisma.Decimal(filters.maxArea);
  }

  if (filters.areaPId) {
    where.areaPId = filters.areaPId;
  }

  if (filters.areaWId) {
    where.areaWId = filters.areaWId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    // By default, show only approved properties
    where.status = 'APPROVED';
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
          Media_Media_propertyIdToProperty: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        User_Property_userIdToUser: {
          select: {
            userId: true,
            fullname: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties: properties.map(mapProperty),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPropertyById = async (propertyId: bigint) => {
  const property = await prisma.property.findUnique({
    where: { propertyId: propertyId },
    include: {
      Media_Media_propertyIdToProperty: {
        orderBy: { order: 'asc' },
      },
      Document: true,
      Panorama: true,
      User_Property_userIdToUser: {
        select: {
          userId: true,
          fullname: true,
          phone: true,
          email: true,
          avatar: true,
          agentStatus: true,
        },
      },
      User_Property_authorizedAgentIdToUser: {
        select: {
          userId: true,
          fullname: true,
          phone: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return property ? mapProperty(property) : null;
};

export const updateProperty = async (propertyId: bigint, userId: bigint, input: UpdatePropertyInput) => {
  // Check ownership
  const property = await prisma.property.findUnique({
    where: { propertyId: propertyId },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  if (property.userId !== userId) {
    throw new Error('Not authorized to update this property');
  }

  const updated = await prisma.property.update({
    where: { propertyId: propertyId },
    data: {
      address: input.address,
      title: input.title,
      propertyType: input.propertyType as any,
      description: input.description,
      projectId: input.projectId,
      buildingId: input.buildingId,
      subdivisionId: input.subdivisionId,
      floor: input.floor,
      unit: input.unit,
      width: input.width ? new Prisma.Decimal(input.width) : undefined,
      length: input.length ? new Prisma.Decimal(input.length) : undefined,
      floors: input.floors,
      floorArea: input.floorArea ? new Prisma.Decimal(input.floorArea) : undefined,
      buildingArea: input.buildingArea ? new Prisma.Decimal(input.buildingArea) : undefined,
      landArea: input.landArea ? new Prisma.Decimal(input.landArea) : undefined,
      bedrooms: input.bedrooms,
      toilets: input.toilets,
      direction: input.direction as any,
      legalDocumentType: input.legalDocumentType as any,
      legalDocumentNumber: input.legalDocumentNumber,
      legalStatus: input.legalStatus as any,
      latitude: input.latitude ? new Prisma.Decimal(input.latitude) : undefined,
      longitude: input.longitude ? new Prisma.Decimal(input.longitude) : undefined,
      furniture: input.furniture as any,
      streetWidth: input.streetWidth ? new Prisma.Decimal(input.streetWidth) : undefined,
      usageStatus: input.usageStatus as any,
      status: input.status as any,
      areaPId: input.areaPId,
      areaWId: input.areaWId,
      oldAreaPId: input.oldAreaPId,
      oldAreaDId: input.oldAreaDId,
      oldAreaWId: input.oldAreaWId,
      authorizedUserId: input.authorizedUserId,
      authorizedAgentId: input.authorizedAgentId,
      primaryMediaId: input.primaryMediaId,
    },
    include: {
      Media_Media_propertyIdToProperty: {
        orderBy: { order: 'asc' },
      },
      Document: true,
    },
  });

  return mapProperty(updated);
};

export const deleteProperty = async (propertyId: bigint, userId: bigint) => {
  const property = await prisma.property.findUnique({
    where: { propertyId: propertyId },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  if (property.userId !== userId) {
    throw new Error('Not authorized to delete this property');
  }

  // Check if there are active listings for this property
  const activeListings = await prisma.listing.count({
    where: {
      propertyId: propertyId,
      status: {
        in: ['ACTIVE', 'PENDING', 'REVIEWING'],
      },
    },
  });

  if (activeListings > 0) {
    throw new Error('Cannot delete property with active listings');
  }

  await prisma.property.delete({
    where: { propertyId: propertyId },
  });

  return { message: 'Property deleted successfully' };
};

export const getMyProperties = async (userId: bigint, filters: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { userId: userId };

  if (filters.status) {
    where.status = filters.status;
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        Media_Media_propertyIdToProperty: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        Listing: {
          where: {
            status: { in: ['ACTIVE', 'PENDING', 'REVIEWING'] },
          },
          take: 1,
        },
        _count: {
          select: {
            Listing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
