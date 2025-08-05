
import { db } from '../db';
import { batchesTable } from '../db/schema';
import { type Batch } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getBatchesByDrug = async (drugId: number): Promise<Batch[]> => {
  try {
    // Fetch all batches for the specified drug, ordered by expiration date (FIFO)
    const results = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.drug_id, drugId))
      .orderBy(asc(batchesTable.expiration_date))
      .execute();

    // Convert numeric and date fields to proper types before returning
    return results.map(batch => ({
      ...batch,
      purchase_price: parseFloat(batch.purchase_price),
      expiration_date: new Date(batch.expiration_date),
      received_date: new Date(batch.received_date)
    }));
  } catch (error) {
    console.error('Failed to fetch batches by drug:', error);
    throw error;
  }
};
