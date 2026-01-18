import prisma from '../utils/prisma';
import { Area } from '@prisma/client';

export class SuggestService {
  /**
   * Search suggestions by keyword
   * Searches in Area names and Listing titles
   */
  static async searchSuggestions(keyword: string): Promise<any[]> {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const searchKeyword = keyword.trim().toLowerCase();

    // Search in areas
    const areas = await prisma.area.findMany({
      where: {
        name: {
          contains: searchKeyword,
          mode: 'insensitive',
        },
      },
      select: {
        areaId: true,
        name: true,
        type: true,
      },
      take: 10,
    });

    // Search in listings
    const listings = await prisma.listing.findMany({
      where: {
        title: {
          contains: searchKeyword,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
      select: {
        listingId: true,
        title: true,
      },
      take: 10,
    });

    // Combine and format results
    const suggestions = [
      ...areas.map((area) => ({
        id: area.areaId.toString(),
        label: area.name,
        type: 'AREA',
        value: area.name,
      })),
      ...listings.map((listing) => ({
        id: listing.listingId.toString(),
        label: listing.title,
        type: 'LISTING',
        value: listing.title,
      })),
    ];

    return suggestions;
  }
}
