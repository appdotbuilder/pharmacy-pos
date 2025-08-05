import { db } from '../db';
import { batchesTable } from '../db/schema';
import { type Batch } from '../schema';
import { eq } from 'drizzle-orm';

export const getBatchById = async (batchId: number): Promise<Batch | null> => {
  try {
    const results = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, batchId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const batch = results[0];
    return {
      ...batch,
      purchase_price: parseFloat(batch.purchase_price), // Convert string to number
      expiration_date: new Date(batch.expiration_date), // Convert string to Date
      received_date: new Date(batch.received_date) // Convert string to Date
    };
  } catch (error) {
    console.error('Batch retrieval failed:', error);
    throw error;
  }
};