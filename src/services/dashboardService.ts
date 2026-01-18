import prisma from '../utils/prisma';

class DashboardService {
  async getTopProvinces(fromDate?: Date, toDate?: Date) {
    // Build where clause for date filtering
    const whereClause: any = {
      status: 'ACTIVE',
    };

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt.gte = fromDate;
      }
      if (toDate) {
        whereClause.createdAt.lte = toDate;
      }
    }

    // Get all active listings with their property information
    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        Property: true,
      },
    });

    // Group by province (areaPId from Property)
    const provinceMap = new Map<string, { total: number; areaPId: number; name: string }>();

    for (const listing of listings) {
      if (listing.Property?.areaPId) {
        const provinceId = listing.Property.areaPId;
        const provinceKey = provinceId.toString();

        if (provinceMap.has(provinceKey)) {
          provinceMap.get(provinceKey)!.total++;
        } else {
          // Fetch province name
          const area = await prisma.area.findUnique({
            where: { areaId: provinceId },
          });

          if (area) {
            provinceMap.set(provinceKey, {
              total: 1,
              areaPId: provinceId,
              name: area.name,
            });
          }
        }
      }
    }

    // Convert map to array and sort by total (descending)
    const topProvinces = Array.from(provinceMap.values()).sort((a, b) => b.total - a.total);

    return topProvinces;
  }
}

export default new DashboardService();
