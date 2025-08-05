
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { batchesTable, drugsTable, suppliersTable } from '../db/schema';
import { type CreateBatchInput } from '../schema';
import { createBatch } from '../handlers/create_batch';
import { eq } from 'drizzle-orm';

describe('createBatch', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let drugId: number;
  let supplierId: number;

  beforeEach(async () => {
    // Create prerequisite drug record
    const drugResult = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '12.00',
        insurance_price: '8.00',
        minimum_stock: 50
      })
      .returning()
      .execute();
    drugId = drugResult[0].id;

    // Create prerequisite supplier record
    const supplierResult = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: 'John Doe'
      })
      .returning()
      .execute();
    supplierId = supplierResult[0].id;
  });

  const testInput: CreateBatchInput = {
    drug_id: 0, // Will be set in each test
    batch_number: 'BATCH001',
    expiration_date: new Date('2025-12-31'),
    quantity: 100,
    purchase_price: 9.50,
    supplier_id: 0, // Will be set in each test
    received_date: new Date('2024-01-15')
  };

  it('should create a batch', async () => {
    const input = { ...testInput, drug_id: drugId, supplier_id: supplierId };
    const result = await createBatch(input);

    // Basic field validation
    expect(result.drug_id).toEqual(drugId);
    expect(result.batch_number).toEqual('BATCH001');
    expect(result.expiration_date).toEqual(new Date('2025-12-31'));
    expect(result.quantity).toEqual(100);
    expect(result.purchase_price).toEqual(9.50);
    expect(typeof result.purchase_price).toBe('number');
    expect(result.supplier_id).toEqual(supplierId);
    expect(result.received_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save batch to database', async () => {
    const input = { ...testInput, drug_id: drugId, supplier_id: supplierId };
    const result = await createBatch(input);

    // Query using proper drizzle syntax
    const batches = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, result.id))
      .execute();

    expect(batches).toHaveLength(1);
    expect(batches[0].drug_id).toEqual(drugId);
    expect(batches[0].batch_number).toEqual('BATCH001');
    expect(new Date(batches[0].expiration_date)).toEqual(new Date('2025-12-31'));
    expect(batches[0].quantity).toEqual(100);
    expect(parseFloat(batches[0].purchase_price)).toEqual(9.50);
    expect(batches[0].supplier_id).toEqual(supplierId);
    expect(new Date(batches[0].received_date)).toEqual(new Date('2024-01-15'));
    expect(batches[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different purchase prices correctly', async () => {
    const input = { 
      ...testInput, 
      drug_id: drugId, 
      supplier_id: supplierId,
      purchase_price: 15.75
    };
    const result = await createBatch(input);

    expect(result.purchase_price).toEqual(15.75);
    expect(typeof result.purchase_price).toBe('number');

    // Verify in database
    const batches = await db.select()
      .from(batchesTable)
      .where(eq(batchesTable.id, result.id))
      .execute();

    expect(parseFloat(batches[0].purchase_price)).toEqual(15.75);
  });

  it('should reject invalid foreign key references', async () => {
    const input = { 
      ...testInput, 
      drug_id: 99999, // Non-existent drug
      supplier_id: supplierId
    };

    await expect(createBatch(input)).rejects.toThrow(/foreign key constraint/i);
  });
});
