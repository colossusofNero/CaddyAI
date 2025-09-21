const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static get tableName() {
    return 'users';
  }

  static async findById(id) {
    return db(this.tableName).where({ id }).first();
  }

  static async findByEmail(email) {
    return db(this.tableName).where({ email: email.toLowerCase() }).first();
  }

  static async create(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      handicap,
      skillLevel,
      dominantHand,
      preferences
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await db(this.tableName)
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        handicap,
        skill_level: skillLevel || 'beginner',
        dominant_hand: dominantHand || 'right',
        preferences: preferences ? JSON.stringify(preferences) : null
      })
      .returning('*');

    return this.sanitizeUser(user);
  }

  static async updateById(id, updateData) {
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'date_of_birth',
      'gender', 'handicap', 'skill_level', 'dominant_hand',
      'preferences', 'profile_image_url'
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (filteredData.preferences) {
      filteredData.preferences = JSON.stringify(filteredData.preferences);
    }

    const [user] = await db(this.tableName)
      .where({ id })
      .update(filteredData)
      .returning('*');

    return this.sanitizeUser(user);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    return db(this.tableName)
      .where({ id })
      .update({ password_hash: hashedPassword });
  }

  static async updateLastLogin(id) {
    return db(this.tableName)
      .where({ id })
      .update({ last_login: new Date() });
  }

  static async verifyEmail(id) {
    return db(this.tableName)
      .where({ id })
      .update({ email_verified: true });
  }

  static async deactivate(id) {
    return db(this.tableName)
      .where({ id })
      .update({ is_active: false });
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static sanitizeUser(user) {
    if (!user) return null;

    const {
      password_hash,
      ...sanitizedUser
    } = user;

    // Parse JSON fields
    if (sanitizedUser.preferences && typeof sanitizedUser.preferences === 'string') {
      try {
        sanitizedUser.preferences = JSON.parse(sanitizedUser.preferences);
      } catch (e) {
        sanitizedUser.preferences = null;
      }
    }

    // Convert snake_case to camelCase for API response
    return {
      id: sanitizedUser.id,
      email: sanitizedUser.email,
      firstName: sanitizedUser.first_name,
      lastName: sanitizedUser.last_name,
      phone: sanitizedUser.phone,
      dateOfBirth: sanitizedUser.date_of_birth,
      gender: sanitizedUser.gender,
      handicap: sanitizedUser.handicap,
      skillLevel: sanitizedUser.skill_level,
      dominantHand: sanitizedUser.dominant_hand,
      preferences: sanitizedUser.preferences,
      profileImageUrl: sanitizedUser.profile_image_url,
      isActive: sanitizedUser.is_active,
      emailVerified: sanitizedUser.email_verified,
      lastLogin: sanitizedUser.last_login,
      createdAt: sanitizedUser.created_at,
      updatedAt: sanitizedUser.updated_at
    };
  }

  static async getAllUsers(limit = 10, offset = 0) {
    const users = await db(this.tableName)
      .select('*')
      .where({ is_active: true })
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    return users.map(user => this.sanitizeUser(user));
  }

  static async getUserStats(id) {
    const stats = await db.raw(`
      SELECT
        COUNT(DISTINCT r.id) as total_rounds,
        COUNT(DISTINCT c.id) as total_calculations,
        AVG(r.total_score) as average_score,
        MIN(r.total_score) as best_score,
        COUNT(DISTINCT DATE(r.played_date)) as days_played
      FROM users u
      LEFT JOIN rounds r ON u.id = r.user_id AND r.is_complete = true
      LEFT JOIN calculations c ON u.id = c.user_id
      WHERE u.id = ? AND u.is_active = true
    `, [id]);

    return stats.rows[0];
  }
}

module.exports = User;