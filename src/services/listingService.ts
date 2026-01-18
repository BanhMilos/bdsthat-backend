import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export interface CreateListingInput {
  userId: bigint;
  propertyId: bigint;
  title: string;
  description?: string;
  price: number;
  listingType: string;
  priority?: number;
  currency?: string;
  expirationDate?: Date;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number;
  listingType?: string;
  status?: string;
  priority?: number;
  currency?: string;
  expirationDate?: Date;
}

export const createListing = async (input: CreateListingInput) => {
  // Verify property belongs to user
  const property = await prisma.property.findUnique({
    where: { propertyId: input.propertyId },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  if (property.userId !== input.userId) {
    throw new Error('Not authorized to create listing for this property');
  }

  if (property.status !== 'APPROVED') {
    throw new Error('Property must be approved before creating listing');
  }

  const priority = input.priority || 0;
  const pushedDate = new Date();
  const expirationDate = input.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  const listing = await prisma.listing.create({
    data: {
      propertyId: input.propertyId,
      userId: input.userId,
      title: input.title,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      listingType: input.listingType as any,
      priority,
      pushedDate: pushedDate,
      expirationDate: expirationDate,
      currency: input.currency || 'VND',
      status: 'PENDING',
    },
    include: {
      Property: {
        include: {
          Media_Media_propertyIdToProperty: {
            orderBy: { order: 'asc' },
            take: 5,
          },
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          phone: true,
          email: true,
          avatar: true,
          agentStatus: true,
        },
      },
    },
  });

  return listing;
};

export const listListings = async (filters: {
  page?: number;
  limit?: number;
  listingType?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minArea?: number;
  maxArea?: number;
  areaPId?: number;
  areaWId?: number;
  priority?: number;
  isFeatured?: boolean;
  status?: string;
  search?: string;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Default to showing only active listings
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = 'ACTIVE';
  }

  if (filters.listingType) {
    where.listingType = filters.listingType;
  }

  if (filters.priority !== undefined) {
    where.priority = filters.priority;
  }

  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured ? 1 : 0;
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = new Prisma.Decimal(filters.minPrice);
    if (filters.maxPrice) where.price.lte = new Prisma.Decimal(filters.maxPrice);
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      {
        Property: {
          address: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ];
  }

  // Property filters
  const propertyWhere: any = {};

  if (filters.propertyType) {
    propertyWhere.propertyType = filters.propertyType;
  }

  if (filters.bedrooms) {
    propertyWhere.bedrooms = filters.bedrooms;
  }

  if (filters.minArea || filters.maxArea) {
    propertyWhere.landArea = {};
    if (filters.minArea) propertyWhere.landArea.gte = new Prisma.Decimal(filters.minArea);
    if (filters.maxArea) propertyWhere.landArea.lte = new Prisma.Decimal(filters.maxArea);
  }

  if (filters.areaPId) {
    propertyWhere.areaPId = filters.areaPId;
  }

  if (filters.areaWId) {
    propertyWhere.areaWId = filters.areaWId;
  }

  if (Object.keys(propertyWhere).length > 0) {
    where.Property = propertyWhere;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        Property: {
          include: {
            Media_Media_propertyIdToProperty: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
        User: {
          select: {
            userId: true,
            fullname: true,
            phone: true,
            avatar: true,
            agentStatus: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { priority: 'desc' },
        { pushedDate: 'desc' },
      ],
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getListingById = async (listingId: bigint, userId?: bigint) => {
  const listing = await prisma.listing.findUnique({
    where: { listingId: listingId },
    include: {
      Property: {
        include: {
          Media_Media_propertyIdToProperty: {
            orderBy: { order: 'asc' },
          },
          Document: true,
          Panorama: true,
        },
      },
      User: {
        select: {
            userId: true,
          fullname: true,
          phone: true,
          email: true,
          avatar: true,
          agentStatus: true,
          agentCertificate: true,
        },
      },
    },
  });

  if (!listing) {
    return null;
  }

  // Increment view count if not the owner or admin
  if (userId !== listing.userId) {
    await prisma.listing.update({
      where: { listingId: listingId },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  return listing;
};

export const updateListing = async (listingId: bigint, userId: bigint, input: UpdateListingInput) => {
  const listing = await prisma.listing.findUnique({
    where: { listingId: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.userId !== userId) {
    throw new Error('Not authorized to update this listing');
  }

  const updated = await prisma.listing.update({
    where: { listingId: listingId },
    data: {
      title: input.title,
      description: input.description,
      price: input.price ? new Prisma.Decimal(input.price) : undefined,
      listingType: input.listingType as any,
      status: input.status as any,
      priority: input.priority,
      currency: input.currency,
      expirationDate: input.expirationDate,
    },
    include: {
      Property: {
        include: {
          Media_Media_propertyIdToProperty: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  return updated;
};

export const deleteListing = async (listingId: bigint, userId: bigint) => {
  const listing = await prisma.listing.findUnique({
    where: { listingId: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.userId !== userId) {
    throw new Error('Not authorized to delete this listing');
  }

  await prisma.listing.delete({
    where: { listingId: listingId },
  });

  return { message: 'Listing deleted successfully' };
};

export const pushListing = async (listingId: bigint, userId: bigint) => {
  const listing = await prisma.listing.findUnique({
    where: { listingId: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.userId !== userId) {
    throw new Error('Not authorized to push this listing');
  }

  if (listing.status !== 'ACTIVE') {
    throw new Error('Only active listings can be pushed');
  }

  // Check if user has push credits available
  if (listing.pushRemain !== null && listing.pushRemain <= 0) {
    throw new Error('No push credits remaining for this listing');
  }

  const updated = await prisma.listing.update({
    where: { listingId: listingId },
    data: {
      pushedDate: new Date(),
      pushCount: {
        increment: 1,
      },
      pushRemain: listing.pushRemain !== null ? {
        decrement: 1,
      } : undefined,
    },
  });

  return updated;
};

export const recreateListing = async (listingId: bigint, userId: bigint) => {
  const existingListing = await prisma.listing.findUnique({
    where: { listingId: listingId },
    include: {
      Property: true,
    },
  });

  if (!existingListing) {
    throw new Error('Listing not found');
  }

  if (existingListing.userId !== userId) {
    throw new Error('Not authorized to recreate this listing');
  }

  // Create new listing with same data
  const newListing = await prisma.listing.create({
    data: {
      propertyId: existingListing.propertyId,
      userId: existingListing.userId,
      title: existingListing.title,
      description: existingListing.description,
      price: existingListing.price,
      listingType: existingListing.listingType,
      priority: 0, // Reset priority
      pushedDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: existingListing.currency,
      status: 'PENDING',
    },
    include: {
      Property: {
        include: {
          Media_Media_propertyIdToProperty: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  return newListing;
};

export const getMyListings = async (userId: bigint, filters: {
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

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        Property: {
          include: {
            Media_Media_propertyIdToProperty: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRelatedListings = async (listingId: bigint, limit: number = 10) => {
  const listing = await prisma.listing.findUnique({
    where: { listingId: listingId },
    include: {
      Property: true,
    },
  });

  if (!listing) {
    return [];
  }

  const relatedListings = await prisma.listing.findMany({
    where: {
      listingId: { not: listingId },
      status: 'ACTIVE',
      listingType: listing.listingType,
      Property: {
        propertyType: listing.Property.propertyType,
        areaPId: listing.Property.areaPId,
      },
    },
    take: limit,
    include: {
      Property: {
        include: {
          Media_Media_propertyIdToProperty: {
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      },
      User: {
        select: {
          userId: true,
          fullname: true,
          phone: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { pushedDate: 'desc' },
    ],
  });

  return relatedListings;
};

export const generateListingWithAI = async (propertyId: bigint, userId: bigint) => {
  const property = await prisma.property.findUnique({
    where: { propertyId: propertyId },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  if (property.userId !== userId) {
    throw new Error('Not authorized');
  }

  // Simulated AI generation (in production, call OpenAI API)
  const titleAI = `${property.propertyType} - ${property.title} - ${property.bedrooms} phòng ngủ, ${property.landArea} m²`;
  const descriptionAI = `
${property.title} - ${property.propertyType} cao cấp tại ${property.address}.

Thông tin chi tiết:
- Diện tích: ${property.landArea} m²
- Số phòng ngủ: ${property.bedrooms}
- Số phòng tắm: ${property.toilets}
- Hướng nhà: ${property.direction}
- Nội thất: ${property.furniture}

${property.description || ''}

Liên hệ ngay để xem nhà và được tư vấn chi tiết!
  `.trim();

  return {
    titleAI,
    descriptionAI,
  };
};

export const getUserListings = async (userId: bigint, filters: {
  page?: number;
  limit?: number;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [listings, total, user] = await Promise.all([
    prisma.listing.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      skip,
      take: limit,
      include: {
        Property: {
          include: {
              Media_Media_propertyIdToProperty: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { pushedDate: 'desc' },
    }),
    prisma.listing.count({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
    }),
    prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        fullname: true,
        phone: true,
        email: true,
        avatar: true,
        agentStatus: true,
        agentCertificate: true,
      },
    }),
  ]);

  return {
    user,
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
