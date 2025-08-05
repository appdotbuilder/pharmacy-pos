
import { db } from '../db';
import { batchesTable } from '../db/schema';
import { type Batch } from '../schema';
import { lte, gte, and } from 'drizzle-orm';

export const getExpiringBatches = async (monthsAhead: number = 6): Promise<Batch[]> => {
  try {
    // Calculate the date range - from today to monthsAhead months from now
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);

    // Convert dates to ISO string format for comparison with date columns
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Query batches that expire within the specified timeframe
    // Only include batches that haven't expired yet and will expire within the timeframe
    const results = await db.select()
      .from(batchesTable)
      .where(
        and(
          gte(batchesTable.expiration_date, todayStr), // Not expired yet
          lte(batchesTable.expiration_date, futureDateStr) // Will expire within timeframe
        )
      )
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(batch => ({
      ...batch,
      purchase_price: parseFloat(batch.purchase_price),
      expiration_date: new Date(batch.expiration_date),
      received_date: new Date(batch.received_date)
    }));
  } catch (error) {
    console.error('Failed to get expiring batches:', error);
    throw error;
  }
};
