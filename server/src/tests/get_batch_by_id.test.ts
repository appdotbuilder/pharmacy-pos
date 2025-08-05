import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable, suppliersTable, batchesTable } from '../db/schema';
import { type CreateDrugInput, type CreateSupplierInput, type CreateBatchInput } from '../schema';
import { getBatchById } from '../handlers/get_batch_by_id';

// Test data
const testDrug: CreateDrugInput = {
  name: 'Test Drug',
  active_ingredient: 'Test Ingredient',
  producer: 'Test Producer',
  category: 'free',
  unit: 'tablet',
  purchase_price: 10.00,
  prescription_price: 15.00,
  general_price: 12.00,
  insurance_price: 13.00,
  barcode: null,
  minimum_stock: 50,
  storage_location: 'A1'
};

const testSupplier: CreateSupplierInput = {
  name: 'Test Supplier',
  contact_person: 'John Doe',
  phone: '123-456-7890',
  email: 'supplier@test.com',
  address: '123 Test St'
};

describe('getBatchById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing batch by ID with correct field types', async () => {
    // Create prerequisite data
    const drugResult = await db.insert(drugsTable)
      .values({
        ...testDrug,
        purchase_price: testDrug.purchase_price.toString(),
        prescription_price: testDrug.prescription_price.toString(),
        general_price: testDrug.general_price.toString(),
        insurance_price: testDrug.insurance_price.toString()
      })
      .returning()
      .execute();

    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const drug = drugResult[0];
    const supplier = supplierResult[0];

    // Create batch
    const testBatch: CreateBatchInput = {
      drug_id: drug.id,
      batch_number: 'BATCH001',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      purchase_price: 9.50,
      supplier_id: supplier.id,
      received_date: new Date('2024-01-15')
    };

    const batchResult = await db.insert(batchesTable)
      .values({
        ...testBatch,
        purchase_price: testBatch.purchase_price.toString(),
        expiration_date: testBatch.expiration_date.toISOString().split('T')[0],
        received_date: testBatch.received_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const createdBatch = batchResult[0];

    // Test getBatchById
    const result = await getBatchById(createdBatch.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBatch.id);
    expect(result!.drug_id).toEqual(drug.id);
    expect(result!.batch_number).toEqual('BATCH001');
    expect(result!.quantity).toEqual(100);
    expect(result!.supplier_id).toEqual(supplier.id);

    // Verify field types
    expect(typeof result!.purchase_price).toBe('number');
    expect(result!.purchase_price).toEqual(9.50);
    expect(result!.expiration_date).toBeInstanceOf(Date);
    expect(result!.received_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify date values
    expect(result!.expiration_date.getFullYear()).toEqual(2025);
    expect(result!.expiration_date.getMonth()).toEqual(11); // December is month 11
    expect(result!.expiration_date.getDate()).toEqual(31);
    expect(result!.received_date.getFullYear()).toEqual(2024);
    expect(result!.received_date.getMonth()).toEqual(0); // January is month 0
    expect(result!.received_date.getDate()).toEqual(15);
  });

  it('should return null for a non-existent batch ID', async () => {
    const result = await getBatchById(99999);
    expect(result).toBeNull();
  });
});