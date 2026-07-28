// backend/src/infrastructure/database/consumer/PgConsumerRepository.ts
import { Pool } from 'pg';
import { IConsumerRepository } from '../../../domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../../domain/consumer/Consumer';
import { ConsumerStatus } from '../../../domain/consumer/value-objects/ConsumerStatus';

export class PgConsumerRepository implements IConsumerRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<Consumer | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, general_preferences, is_food_profile_complete, is_food_profile_critical, status, created_at, updated_at
       FROM consumers WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToConsumer(result.rows[0]);
  }

  async findById(id: string): Promise<Consumer | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, general_preferences, is_food_profile_complete, is_food_profile_critical, status, created_at, updated_at
       FROM consumers WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToConsumer(result.rows[0]);
  }

  async save(consumer: Consumer): Promise<void> {
    await this.pool.query(
      `INSERT INTO consumers (
        id, user_id, general_preferences, is_food_profile_complete, is_food_profile_critical, status, created_at, updated_at
      ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        general_preferences = EXCLUDED.general_preferences,
        is_food_profile_complete = EXCLUDED.is_food_profile_complete,
        is_food_profile_critical = EXCLUDED.is_food_profile_critical,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at`,
      [
        consumer.id,
        consumer.userId,
        JSON.stringify(consumer.generalPreferences),
        consumer.isFoodProfileComplete,
        consumer.isFoodProfileCritical,
        consumer.status,
        consumer.createdAt,
        consumer.updatedAt,
      ],
    );
  }

  private mapRowToConsumer(row: any): Consumer {
    return Consumer.create(
      {
        userId: row.user_id,
        generalPreferences: row.general_preferences || {},
        isFoodProfileComplete: row.is_food_profile_complete,
        isFoodProfileCritical: row.is_food_profile_critical,
        status: row.status as ConsumerStatus,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id,
    ).getValue();
  }
}
