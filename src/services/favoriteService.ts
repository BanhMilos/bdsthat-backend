import prisma from '../utils/prisma';

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
      }
    : p;
const mapListing = (l: any) =>
  l
    ? {
        ...l,
        listingId: toNumberIfBigInt(l.listingId),
        propertyId: toNumberIfBigInt(l.propertyId),
        userId: toNumberIfBigInt(l.userId),
        Property: mapProperty(l.Property),
        User: mapUser(l.User),
      }
    : l;
const mapFavorite = (f: any) =>
  f
    ? {
        ...f,
        favoriteId: toNumberIfBigInt(f.favoriteId),
        userId: toNumberIfBigInt(f.userId),
        listingId: f.listingId ? toNumberIfBigInt(f.listingId) : f.listingId,
        propertyId: f.propertyId ? toNumberIfBigInt(f.propertyId) : f.propertyId,
        Property: mapProperty(f.Property),
        Listing: mapListing(f.Listing),
      }
    : f;

export const likeListing = async (userId: bigint, listingId: bigint) => {
  // Check if already liked
  const existing = await prisma.favorite.findFirst({
    where: {
      userId: userId,
      listingId: listingId,
      type: 'LISTING',
    },
  });

  if (existing) {
    throw new Error('Listing already liked');
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: userId,
      listingId: listingId,
      type: 'LISTING',
    },
  });

  return favorite;
};

export const unlikeListing = async (userId: bigint, listingId: bigint) => {
  const favorite = await prisma.favorite.findFirst({
    where: {
      userId: userId,
      listingId: listingId,
      type: 'LISTING',
    },
  });

  if (!favorite) {
    throw new Error('Listing not in favorites');
  }

  await prisma.favorite.delete({
    where: { favoriteId: favorite.favoriteId },
  });

  return { message: 'Listing removed from favorites' };
};

export const getMyFavorites = async (userId: bigint, filters: {
  page?: number;
  limit?: number;
  type?: string;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { userId: userId };

  if (filters.type) {
    where.type = filters.type;
  } else {
    where.type = 'LISTING'; // Default to listings
  }

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
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
            Listing: {
              where: {
                status: 'ACTIVE',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.favorite.count({ where }),
  ]);

  // If type is LISTING, include full listing details
  if (where.type === 'LISTING') {
    const favoritesWithListings = await Promise.all(
      favorites.map(async (fav) => {
        if (fav.listingId) {
          const listing = await prisma.listing.findUnique({
            where: { listingId: fav.listingId },
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
          });
          return { ...fav, Listing: listing };
        }
        return fav;
      })
    );

    return {
      favorites: favoritesWithListings.map(mapFavorite),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  return {
    favorites: favorites.map(mapFavorite),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const checkFavorite = async (userId: bigint, listingId: bigint) => {
  const favorite = await prisma.favorite.findFirst({
    where: {
      userId: userId,
      listingId: listingId,
      type: 'LISTING',
    },
  });

  return { isFavorite: !!favorite };
};
