const { prisma } = require('../../db/prisma');

class DeliveryPartnerService {
  async getPartners(filters = {}) {
    const { status, search, page = 1, pageSize = 10 } = filters;
    
    const skip = (page - 1) * pageSize;
    
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.deliveryPartner.findMany({
        where,
        include: {
          drivers: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        skip,
        take: Number(pageSize)
      }),
      prisma.deliveryPartner.count({ where })
    ]);

    return {
      partners,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getPartnerById(id) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true
          }
        }
      }
    });

    if (!partner) {
      throw new Error('Delivery partner not found');
    }

    return partner;
  }

  async createPartner(partnerData) {
    const { areasCovered, ...otherData } = partnerData;
    
    const partner = await prisma.deliveryPartner.create({
      data: {
        ...otherData,
        areasCovered: areasCovered || []
      }
    });

    return partner;
  }

  async updatePartner(id, partnerData) {
    const { areasCovered, ...otherData } = partnerData;
    
    // Check if partner exists
    const existingPartner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!existingPartner) {
      throw new Error('Delivery partner not found');
    }

    const updatedPartner = await prisma.deliveryPartner.update({
      where: { id },
      data: {
        ...otherData,
        ...(areasCovered && { areasCovered })
      }
    });

    return updatedPartner;
  }

  async deletePartner(id) {
    // Check if partner exists
    const existingPartner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!existingPartner) {
      throw new Error('Delivery partner not found');
    }

    // Check if partner has active drivers
    const driversCount = await prisma.user.count({
      where: {
        partnerId: id,
        isActive: true
      }
    });

    if (driversCount > 0) {
      throw new Error('Cannot delete partner with active drivers');
    }

    // Delete partner
    await prisma.deliveryPartner.delete({ where: { id } });
    
    return { success: true };
  }

  async getPartnerDrivers(partnerId) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true }
    });

    if (!partner) {
      throw new Error('Delivery partner not found');
    }

    const drivers = await prisma.user.findMany({
      where: {
        partnerId,
        role: 'DELIVERY'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        deliveries: {
          where: {
            OR: [
              { status: 'ASSIGNED' },
              { status: 'PICKED_UP' },
              { status: 'OUT_FOR_DELIVERY' }
            ]
          },
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    return { partner, drivers };
  }

  async assignDriverToPartner(userId, partnerId) {
    // Check if user exists and is a delivery person
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.role !== 'DELIVERY') {
      throw new Error('User is not a delivery person');
    }

    // Check if partner exists
    const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      throw new Error('Delivery partner not found');
    }

    // Assign user to partner
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { partnerId }
    });

    // Update active drivers count
    await prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: {
        activeDrivers: {
          increment: 1
        }
      }
    });

    return updatedUser;
  }

  async removeDriverFromPartner(userId) {
    // Check if user exists and is assigned to a partner
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, partnerId: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.partnerId) {
      throw new Error('User is not assigned to any partner');
    }

    const partnerId = user.partnerId;

    // Remove user from partner
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { partnerId: null }
    });

    // Update active drivers count
    await prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: {
        activeDrivers: {
          decrement: 1
        }
      }
    });

    return updatedUser;
  }
}

module.exports = { DeliveryPartnerService };
