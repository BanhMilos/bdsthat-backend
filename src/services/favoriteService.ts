import prisma from '../utils/prisma';

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
      favorites: favoritesWithListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  return {
    favorites,
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
