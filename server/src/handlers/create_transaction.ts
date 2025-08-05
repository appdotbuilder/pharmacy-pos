
import { db } from '../db';
import { transactionsTable, usersTable, customersTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Verify cashier exists
    const cashier = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.cashier_id))
      .execute();

    if (cashier.length === 0) {
      throw new Error(`Cashier with id ${input.cashier_id} not found`);
    }

    // Verify customer exists if provided
    if (input.customer_id) {
      const customer = await db.select()
        .from(customersTable)
        .where(eq(customersTable.id, input.customer_id))
        .execute();

      if (customer.length === 0) {
        throw new Error(`Customer with id ${input.customer_id} not found`);
      }
    }

    // Generate unique transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        transaction_number: transactionNumber,
        type: input.type,
        customer_id: input.customer_id,
        doctor_name: input.doctor_name,
        patient_name: input.patient_name,
        subtotal: input.subtotal.toString(),
        discount_amount: input.discount_amount.toString(),
        total_amount: input.total_amount.toString(),
        payment_method: input.payment_method,
        cashier_id: input.cashier_id,
        transaction_date: new Date()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      subtotal: parseFloat(transaction.subtotal),
      discount_amount: parseFloat(transaction.discount_amount),
      total_amount: parseFloat(transaction.total_amount)
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
