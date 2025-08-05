
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable, customersTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  let testUserId: number;
  let testCustomerId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user (cashier)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        full_name: 'Test Cashier',
        password_hash: 'hashedpassword',
        role: 'cashier',
        is_active: true
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '1234567890',
        email: 'test@example.com',
        address: 'Test Address',
        insurance_info: 'Test Insurance'
      })
      .returning()
      .execute();
    testCustomerId = customerResult[0].id;
  });

  afterEach(resetDB);

  const createTestInput = (overrides = {}): CreateTransactionInput => ({
    type: 'prescription',
    customer_id: testCustomerId,
    doctor_name: 'Dr. Test',
    patient_name: 'Test Patient',
    subtotal: 100.50,
    discount_amount: 10.25,
    total_amount: 90.25,
    payment_method: 'cash',
    cashier_id: testUserId,
    ...overrides
  });

  it('should create a transaction', async () => {
    const input = createTestInput();
    const result = await createTransaction(input);

    // Basic field validation
    expect(result.type).toEqual('prescription');
    expect(result.customer_id).toEqual(testCustomerId);
    expect(result.doctor_name).toEqual('Dr. Test');
    expect(result.patient_name).toEqual('Test Patient');
    expect(result.subtotal).toEqual(100.50);
    expect(result.discount_amount).toEqual(10.25);
    expect(result.total_amount).toEqual(90.25);
    expect(result.payment_method).toEqual('cash');
    expect(result.cashier_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.transaction_number).toMatch(/^TXN-\d+/);
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const input = createTestInput();
    const result = await createTransaction(input);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const savedTransaction = transactions[0];
    expect(savedTransaction.type).toEqual('prescription');
    expect(savedTransaction.customer_id).toEqual(testCustomerId);
    expect(savedTransaction.doctor_name).toEqual('Dr. Test');
    expect(savedTransaction.patient_name).toEqual('Test Patient');
    expect(parseFloat(savedTransaction.subtotal)).toEqual(100.50);
    expect(parseFloat(savedTransaction.discount_amount)).toEqual(10.25);
    expect(parseFloat(savedTransaction.total_amount)).toEqual(90.25);
    expect(savedTransaction.payment_method).toEqual('cash');
    expect(savedTransaction.cashier_id).toEqual(testUserId);
    expect(savedTransaction.transaction_date).toBeInstanceOf(Date);
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should generate unique transaction numbers', async () => {
    const input = createTestInput();
    
    const result1 = await createTransaction(input);
    const result2 = await createTransaction(input);

    expect(result1.transaction_number).not.toEqual(result2.transaction_number);
    expect(result1.transaction_number).toMatch(/^TXN-\d+/);
    expect(result2.transaction_number).toMatch(/^TXN-\d+/);
  });

  it('should handle non-prescription transactions', async () => {
    const input = createTestInput({
      type: 'non_prescription',
      doctor_name: null,
      patient_name: null
    });

    const result = await createTransaction(input);

    expect(result.type).toEqual('non_prescription');
    expect(result.doctor_name).toBeNull();
    expect(result.patient_name).toBeNull();
  });

  it('should handle transactions without customer', async () => {
    const input = createTestInput({
      customer_id: null
    });

    const result = await createTransaction(input);

    expect(result.customer_id).toBeNull();
  });

  it('should handle different payment methods', async () => {
    const paymentMethods = ['cash', 'debit_card', 'credit_card', 'qris', 'receivable'] as const;

    for (const method of paymentMethods) {
      const input = createTestInput({ payment_method: method });
      const result = await createTransaction(input);
      expect(result.payment_method).toEqual(method);
    }
  });

  it('should throw error for non-existent cashier', async () => {
    const input = createTestInput({ cashier_id: 99999 });

    expect(createTransaction(input)).rejects.toThrow(/cashier with id 99999 not found/i);
  });

  it('should throw error for non-existent customer', async () => {
    const input = createTestInput({ customer_id: 99999 });

    expect(createTransaction(input)).rejects.toThrow(/customer with id 99999 not found/i);
  });

  it('should handle numeric field conversions correctly', async () => {
    const input = createTestInput({
      subtotal: 123.45,
      discount_amount: 12.34,
      total_amount: 111.11
    });

    const result = await createTransaction(input);

    // Verify return types are numbers
    expect(typeof result.subtotal).toBe('number');
    expect(typeof result.discount_amount).toBe('number');
    expect(typeof result.total_amount).toBe('number');
    expect(result.subtotal).toEqual(123.45);
    expect(result.discount_amount).toEqual(12.34);
    expect(result.total_amount).toEqual(111.11);
  });
});
