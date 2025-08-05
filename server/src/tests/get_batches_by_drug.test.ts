
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable, drugsTable, batchesTable } from '../db/schema';
import { type CreateSupplierInput, type CreateDrugInput, type CreateBatchInput } from '../schema';
import { getBatchesByDrug } from '../handlers/get_batches_by_drug';

// Test data
const testSupplier: CreateSupplierInput = {
  name: 'Test Supplier',
  contact_person: 'John Doe',
  phone: '123-456-7890',
  email: 'supplier@test.com',
  address: '123 Test St',
};

const testDrug: CreateDrugInput = {
  name: 'Test Drug',
  active_ingredient: 'Test Ingredient',
  producer: 'Test Producer',
  category: 'free',
  unit: 'tablet',
  purchase_price: 10.50,
  prescription_price: 15.00,
  general_price: 12.00,
  insurance_price: 11.00,
  barcode: '1234567890',
  minimum_stock: 10,
  storage_location: 'A1'
};

describe('getBatchesByDrug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return batches for a specific drug ordered by expiration date', async () => {
    // Create prerequisite data
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();
    const supplierId = supplierResult[0].id;

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
    const drugId = drugResult[0].id;

    // Create multiple batches with different expiration dates
    const batch1: CreateBatchInput = {
      drug_id: drugId,
      batch_number: 'BATCH001',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      purchase_price: 10.50,
      supplier_id: supplierId,
      received_date: new Date('2024-01-15')
    };

    const batch2: CreateBatchInput = {
      drug_id: drugId,
      batch_number: 'BATCH002',
      expiration_date: new Date('2024-06-30'), // Earlier expiration
      quantity: 50,
      purchase_price: 10.25,
      supplier_id: supplierId,
      received_date: new Date('2024-01-10')
    };

    const batch3: CreateBatchInput = {
      drug_id: drugId,
      batch_number: 'BATCH003',
      expiration_date: new Date('2026-03-15'),
      quantity: 75,
      purchase_price: 10.75,
      supplier_id: supplierId,
      received_date: new Date('2024-01-20')
    };

    await db.insert(batchesTable).values([
      {
        ...batch1,
        purchase_price: batch1.purchase_price.toString(),
        expiration_date: batch1.expiration_date.toISOString().split('T')[0],
        received_date: batch1.received_date.toISOString().split('T')[0]
      },
      {
        ...batch2,
        purchase_price: batch2.purchase_price.toString(),
        expiration_date: batch2.expiration_date.toISOString().split('T')[0],
        received_date: batch2.received_date.toISOString().split('T')[0]
      },
      {
        ...batch3,
        purchase_price: batch3.purchase_price.toString(),
        expiration_date: batch3.expiration_date.toISOString().split('T')[0],
        received_date: batch3.received_date.toISOString().split('T')[0]
      }
    ]).execute();

    // Test the handler
    const result = await getBatchesByDrug(drugId);

    // Should return all 3 batches
    expect(result).toHaveLength(3);

    // Should be ordered by expiration date (FIFO - earliest first)
    expect(result[0].batch_number).toBe('BATCH002'); // 2024-06-30
    expect(result[1].batch_number).toBe('BATCH001'); // 2025-12-31
    expect(result[2].batch_number).toBe('BATCH003'); // 2026-03-15

    // Verify numeric conversion
    expect(typeof result[0].purchase_price).toBe('number');
    expect(result[0].purchase_price).toBe(10.25);
    expect(result[1].purchase_price).toBe(10.50);
    expect(result[2].purchase_price).toBe(10.75);

    // Verify date conversion
    expect(result[0].expiration_date).toBeInstanceOf(Date);
    expect(result[0].received_date).toBeInstanceOf(Date);

    // Verify other fields
    expect(result[0].drug_id).toBe(drugId);
    expect(result[0].quantity).toBe(50);
    expect(result[0].supplier_id).toBe(supplierId);
  });

  it('should return empty array for drug with no batches', async () => {
    // Create prerequisite data
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

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
    const drugId = drugResult[0].id;

    // Test with drug that has no batches
    const result = await getBatchesByDrug(drugId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent drug', async () => {
    const nonExistentDrugId = 999999;

    const result = await getBatchesByDrug(nonExistentDrugId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return batches for the specified drug', async () => {
    // Create prerequisite data
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();
    const supplierId = supplierResult[0].id;

    // Create two different drugs
    const drug1Result = await db.insert(drugsTable)
      .values({
        ...testDrug,
        name: 'Drug 1',
        purchase_price: testDrug.purchase_price.toString(),
        prescription_price: testDrug.prescription_price.toString(),
        general_price: testDrug.general_price.toString(),
        insurance_price: testDrug.insurance_price.toString()
      })
      .returning()
      .execute();
    const drug1Id = drug1Result[0].id;

    const drug2Result = await db.insert(drugsTable)
      .values({
        ...testDrug,
        name: 'Drug 2',
        purchase_price: testDrug.purchase_price.toString(),
        prescription_price: testDrug.prescription_price.toString(),
        general_price: testDrug.general_price.toString(),
        insurance_price: testDrug.insurance_price.toString()
      })
      .returning()
      .execute();
    const drug2Id = drug2Result[0].id;

    // Create batches for both drugs
    await db.insert(batchesTable).values([
      {
        drug_id: drug1Id,
        batch_number: 'DRUG1_BATCH1',
        expiration_date: '2025-01-01',
        quantity: 100,
        purchase_price: '10.00',
        supplier_id: supplierId,
        received_date: '2024-01-01'
      },
      {
        drug_id: drug1Id,
        batch_number: 'DRUG1_BATCH2',
        expiration_date: '2025-02-01',
        quantity: 50,
        purchase_price: '10.50',
        supplier_id: supplierId,
        received_date: '2024-01-02'
      },
      {
        drug_id: drug2Id,
        batch_number: 'DRUG2_BATCH1',
        expiration_date: '2025-01-15',
        quantity: 75,
        purchase_price: '12.00',
        supplier_id: supplierId,
        received_date: '2024-01-03'
      }
    ]).execute();

    // Test fetching batches for drug1 only
    const result = await getBatchesByDrug(drug1Id);

    expect(result).toHaveLength(2);
    expect(result[0].batch_number).toBe('DRUG1_BATCH1');
    expect(result[1].batch_number).toBe('DRUG1_BATCH2');
    expect(result.every(batch => batch.drug_id === drug1Id)).toBe(true);

    // Verify date and numeric conversions
    expect(result[0].expiration_date).toBeInstanceOf(Date);
    expect(result[0].received_date).toBeInstanceOf(Date);
    expect(typeof result[0].purchase_price).toBe('number');
  });
});
