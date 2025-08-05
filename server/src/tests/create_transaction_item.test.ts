import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable, suppliersTable, batchesTable, usersTable, customersTable, transactionsTable, transactionItemsTable } from '../db/schema';
import { type CreateTransactionItemInput } from '../schema';
import { createTransactionItem } from '../handlers/create_transaction_item';
import { eq } from 'drizzle-orm';

describe('createTransactionItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction item and deduct stock from batch', async () => {
    // Create prerequisite data
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: 'John Doe',
        phone: '123456789',
        email: 'test@supplier.com',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'hard',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: 'TEST123',
        minimum_stock: 10,
        storage_location: 'A1'
      })
      .returning()
      .execute();

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'BATCH001',
        expiration_date: '2025-12-31',
        quantity: 100,
        purchase_price: '10.00',
        supplier_id: supplier[0].id,
        received_date: '2024-01-01'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        full_name: 'Test Cashier',
        password_hash: 'hashedpassword',
        role: 'cashier',
        is_active: true
      })
      .returning()
      .execute();

    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '987654321',
        email: 'customer@test.com',
        address: 'Customer Address',
        insurance_info: 'Insurance Info'
      })
      .returning()
      .execute();

    const transaction = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN001',
        type: 'prescription',
        customer_id: customer[0].id,
        doctor_name: 'Dr. Smith',
        patient_name: 'Patient Name',
        subtotal: '150.00',
        discount_amount: '0.00',
        total_amount: '150.00',
        payment_method: 'cash',
        cashier_id: user[0].id,
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreateTransactionItemInput = {
      transaction_id: transaction[0].id,
      drug_id: drug[0].id,
      batch_id: batch[0].id,
      quantity: 5,
      unit_price: 15.00,
      discount_amount: 0.00,
      subtotal: 75.00
    };

    const result = await createTransactionItem(testInput);

    // Verify transaction item was created
    expect(result.transaction_id).toEqual(transaction[0].id);
    expect(result.drug_id).toEqual(drug[0].id);
    expect(result.batch_id).toEqual(batch[0].id);
    expect(result.quantity).toEqual(5);
    expect(result.unit_price).toEqual(15.00);
    expect(result.discount_amount).toEqual(0.00);
    expect(result.subtotal).toEqual(75.00);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify stock was deducted from batch
    const updatedBatch = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, batch[0].id))
      .execute();

    expect(updatedBatch[0].quantity).toEqual(95); // 100 - 5 = 95
  });

  it('should throw error when insufficient stock', async () => {
    // Create prerequisite data with low stock
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: 'John Doe',
        phone: '123456789',
        email: 'test@supplier.com',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'hard',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: 'TEST123',
        minimum_stock: 10,
        storage_location: 'A1'
      })
      .returning()
      .execute();

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'BATCH001',
        expiration_date: '2025-12-31',
        quantity: 3, // Only 3 items in stock
        purchase_price: '10.00',
        supplier_id: supplier[0].id,
        received_date: '2024-01-01'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        full_name: 'Test Cashier',
        password_hash: 'hashedpassword',
        role: 'cashier',
        is_active: true
      })
      .returning()
      .execute();

    const transaction = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN002',
        type: 'non_prescription',
        customer_id: null,
        doctor_name: null,
        patient_name: null,
        subtotal: '150.00',
        discount_amount: '0.00',
        total_amount: '150.00',
        payment_method: 'cash',
        cashier_id: user[0].id,
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreateTransactionItemInput = {
      transaction_id: transaction[0].id,
      drug_id: drug[0].id,
      batch_id: batch[0].id,
      quantity: 5, // Requesting more than available
      unit_price: 15.00,
      discount_amount: 0.00,
      subtotal: 75.00
    };

    await expect(createTransactionItem(testInput)).rejects.toThrow(/insufficient stock/i);

    // Verify stock was not changed
    const batchAfterError = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, batch[0].id))
      .execute();

    expect(batchAfterError[0].quantity).toEqual(3); // Should remain unchanged
  });

  it('should throw error when batch does not exist', async () => {
    // Create prerequisite data (without batch)
    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        full_name: 'Test Cashier',
        password_hash: 'hashedpassword',
        role: 'cashier',
        is_active: true
      })
      .returning()
      .execute();

    const transaction = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN003',
        type: 'non_prescription',
        customer_id: null,
        doctor_name: null,
        patient_name: null,
        subtotal: '150.00',
        discount_amount: '0.00',
        total_amount: '150.00',
        payment_method: 'cash',
        cashier_id: user[0].id,
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreateTransactionItemInput = {
      transaction_id: transaction[0].id,
      drug_id: 999, // Non-existent drug ID
      batch_id: 999, // Non-existent batch ID
      quantity: 5,
      unit_price: 15.00,
      discount_amount: 0.00,
      subtotal: 75.00
    };

    await expect(createTransactionItem(testInput)).rejects.toThrow(/batch with id 999 does not exist/i);

    // Verify no transaction item was created
    const transactionItems = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transaction_id, transaction[0].id))
      .execute();

    expect(transactionItems).toHaveLength(0);
  });

  it('should save transaction item to database correctly', async () => {
    // Create prerequisite data
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: 'John Doe',
        phone: '123456789',
        email: 'test@supplier.com',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'hard',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: 'TEST123',
        minimum_stock: 10,
        storage_location: 'A1'
      })
      .returning()
      .execute();

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'BATCH001',
        expiration_date: '2025-12-31',
        quantity: 50,
        purchase_price: '10.00',
        supplier_id: supplier[0].id,
        received_date: '2024-01-01'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        full_name: 'Test Cashier',
        password_hash: 'hashedpassword',
        role: 'cashier',
        is_active: true
      })
      .returning()
      .execute();

    const transaction = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN004',
        type: 'prescription',
        customer_id: null,
        doctor_name: 'Dr. Johnson',
        patient_name: 'Jane Doe',
        subtotal: '300.00',
        discount_amount: '10.00',
        total_amount: '290.00',
        payment_method: 'credit_card',
        cashier_id: user[0].id,
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreateTransactionItemInput = {
      transaction_id: transaction[0].id,
      drug_id: drug[0].id,
      batch_id: batch[0].id,
      quantity: 10,
      unit_price: 20.00,
      discount_amount: 2.50,
      subtotal: 197.50
    };

    const result = await createTransactionItem(testInput);

    // Verify the transaction item exists in database
    const savedItems = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.id, result.id))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].transaction_id).toEqual(transaction[0].id);
    expect(savedItems[0].drug_id).toEqual(drug[0].id);
    expect(savedItems[0].batch_id).toEqual(batch[0].id);
    expect(savedItems[0].quantity).toEqual(10);
    expect(parseFloat(savedItems[0].unit_price)).toEqual(20.00);
    expect(parseFloat(savedItems[0].discount_amount)).toEqual(2.50);
    expect(parseFloat(savedItems[0].subtotal)).toEqual(197.50);
    expect(savedItems[0].created_at).toBeInstanceOf(Date);
  });
});