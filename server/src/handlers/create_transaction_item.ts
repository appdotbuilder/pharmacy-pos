import { db } from '../db';
import { transactionItemsTable, batchesTable } from '../db/schema';
import { type CreateTransactionItemInput, type TransactionItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransactionItem = async (input: CreateTransactionItemInput): Promise<TransactionItem> => {
  try {
    // Fetch the batch to check availability and get current stock
    const batchResults = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, input.batch_id))
      .execute();

    if (batchResults.length === 0) {
      throw new Error(`Batch with ID ${input.batch_id} does not exist`);
    }

    const batch = batchResults[0];
    
    // Check if requested quantity is available
    if (batch.quantity < input.quantity) {
      throw new Error(`Insufficient stock. Available: ${batch.quantity}, requested: ${input.quantity}`);
    }

    // Calculate new quantity after deduction
    const newQuantity = batch.quantity - input.quantity;

    // Update batch quantity (deduct stock)
    await db.update(batchesTable)
      .set({ quantity: newQuantity })
      .where(eq(batchesTable.id, input.batch_id))
      .execute();

    // Insert transaction item record
    const result = await db.insert(transactionItemsTable)
      .values({
        transaction_id: input.transaction_id,
        drug_id: input.drug_id,
        batch_id: input.batch_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        discount_amount: input.discount_amount.toString(), // Convert number to string for numeric column
        subtotal: input.subtotal.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const transactionItem = result[0];
    return {
      ...transactionItem,
      unit_price: parseFloat(transactionItem.unit_price), // Convert string back to number
      discount_amount: parseFloat(transactionItem.discount_amount), // Convert string back to number
      subtotal: parseFloat(transactionItem.subtotal) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction item creation failed:', error);
    throw error;
  }
};