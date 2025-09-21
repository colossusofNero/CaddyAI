const { db } = require('../config/database');

class Club {
  static get tableName() {
    return 'clubs';
  }

  static async findById(id) {
    const club = await db(this.tableName).where({ id }).first();
    return this.sanitizeClub(club);
  }

  static async findByUserId(userId) {
    const clubs = await db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .orderBy('order_index', 'asc')
      .orderBy('type', 'asc');

    return clubs.map(club => this.sanitizeClub(club));
  }

  static async create(userId, clubData) {
    const {
      name,
      type,
      brand,
      model,
      loft,
      shaftFlex,
      averageDistance,
      distanceRanges,
      notes,
      orderIndex
    } = clubData;

    const [club] = await db(this.tableName)
      .insert({
        user_id: userId,
        name,
        type,
        brand,
        model,
        loft,
        shaft_flex: shaftFlex,
        average_distance: averageDistance,
        distance_ranges: distanceRanges ? JSON.stringify(distanceRanges) : null,
        notes,
        order_index: orderIndex || 0
      })
      .returning('*');

    return this.sanitizeClub(club);
  }

  static async updateById(id, userId, updateData) {
    const allowedFields = [
      'name', 'type', 'brand', 'model', 'loft', 'shaft_flex',
      'average_distance', 'distance_ranges', 'notes', 'order_index'
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      const dbKey = this.camelToSnake(key);
      if (allowedFields.includes(dbKey)) {
        filteredData[dbKey] = updateData[key];
      }
    });

    if (filteredData.distance_ranges) {
      filteredData.distance_ranges = JSON.stringify(filteredData.distance_ranges);
    }

    const [club] = await db(this.tableName)
      .where({ id, user_id: userId })
      .update(filteredData)
      .returning('*');

    return this.sanitizeClub(club);
  }

  static async deleteById(id, userId) {
    return db(this.tableName)
      .where({ id, user_id: userId })
      .update({ is_active: false });
  }

  static async reorderClubs(userId, clubOrders) {
    const trx = await db.transaction();

    try {
      for (const { id, orderIndex } of clubOrders) {
        await trx(this.tableName)
          .where({ id, user_id: userId })
          .update({ order_index: orderIndex });
      }

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getClubsByType(userId, type) {
    const clubs = await db(this.tableName)
      .where({ user_id: userId, type, is_active: true })
      .orderBy('order_index', 'asc');

    return clubs.map(club => this.sanitizeClub(club));
  }

  static async getClubStats(userId) {
    const stats = await db.raw(`
      SELECT
        type,
        COUNT(*) as count,
        AVG(average_distance) as avg_distance,
        MIN(average_distance) as min_distance,
        MAX(average_distance) as max_distance
      FROM clubs
      WHERE user_id = ? AND is_active = true AND average_distance IS NOT NULL
      GROUP BY type
      ORDER BY
        CASE type
          WHEN 'driver' THEN 1
          WHEN 'fairway_wood' THEN 2
          WHEN 'hybrid' THEN 3
          WHEN 'iron' THEN 4
          WHEN 'wedge' THEN 5
          WHEN 'putter' THEN 6
        END
    `, [userId]);

    return stats.rows;
  }

  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static sanitizeClub(club) {
    if (!club) return null;

    // Parse JSON fields
    let distanceRanges = null;
    if (club.distance_ranges && typeof club.distance_ranges === 'string') {
      try {
        distanceRanges = JSON.parse(club.distance_ranges);
      } catch (e) {
        distanceRanges = null;
      }
    } else if (club.distance_ranges) {
      distanceRanges = club.distance_ranges;
    }

    // Convert snake_case to camelCase for API response
    return {
      id: club.id,
      userId: club.user_id,
      name: club.name,
      type: club.type,
      brand: club.brand,
      model: club.model,
      loft: club.loft,
      shaftFlex: club.shaft_flex,
      averageDistance: club.average_distance,
      distanceRanges,
      notes: club.notes,
      isActive: club.is_active,
      orderIndex: club.order_index,
      createdAt: club.created_at,
      updatedAt: club.updated_at
    };
  }

  static getDefaultClubs() {
    return [
      { name: 'Driver', type: 'driver', loft: 10.5, orderIndex: 1 },
      { name: '3 Wood', type: 'fairway_wood', loft: 15, orderIndex: 2 },
      { name: '5 Wood', type: 'fairway_wood', loft: 18, orderIndex: 3 },
      { name: '4 Hybrid', type: 'hybrid', loft: 22, orderIndex: 4 },
      { name: '5 Iron', type: 'iron', loft: 27, orderIndex: 5 },
      { name: '6 Iron', type: 'iron', loft: 31, orderIndex: 6 },
      { name: '7 Iron', type: 'iron', loft: 35, orderIndex: 7 },
      { name: '8 Iron', type: 'iron', loft: 39, orderIndex: 8 },
      { name: '9 Iron', type: 'iron', loft: 43, orderIndex: 9 },
      { name: 'PW', type: 'wedge', loft: 47, orderIndex: 10 },
      { name: 'SW', type: 'wedge', loft: 56, orderIndex: 11 },
      { name: 'LW', type: 'wedge', loft: 60, orderIndex: 12 },
      { name: 'Putter', type: 'putter', loft: 4, orderIndex: 13 }
    ];
  }
}

module.exports = Club;