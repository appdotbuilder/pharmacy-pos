
import { db } from '../db';
import { batchesTable } from '../db/schema';
import { type CreateBatchInput, type Batch } from '../schema';

export const createBatch = async (input: CreateBatchInput): Promise<Batch> => {
  try {
    // Insert batch record
    const result = await db.insert(batchesTable)
      .values({
        drug_id: input.drug_id,
        batch_number: input.batch_number,
        expiration_date: input.expiration_date.toISOString().split('T')[0], // Convert Date to string
        quantity: input.quantity,
        purchase_price: input.purchase_price.toString(), // Convert number to string for numeric column
        supplier_id: input.supplier_id,
        received_date: input.received_date.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const batch = result[0];
    return {
      ...batch,
      purchase_price: parseFloat(batch.purchase_price), // Convert string back to number
      expiration_date: new Date(batch.expiration_date), // Convert string back to Date
      received_date: new Date(batch.received_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Batch creation failed:', error);
    throw error;
  }
};
