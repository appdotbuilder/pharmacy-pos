
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable, batchesTable, suppliersTable } from '../db/schema';
import { type CreateDrugInput, type CreateBatchInput, type CreateSupplierInput } from '../schema';
import { getLowStockDrugs } from '../handlers/get_low_stock_drugs';

// Test data
const testSupplier: CreateSupplierInput = {
  name: 'Test Supplier',
  contact_person: 'John Doe',
  phone: '123456789',
  email: 'supplier@test.com',
  address: '123 Test St'
};

const testDrugLowStock: CreateDrugInput = {
  name: 'Low Stock Drug',
  active_ingredient: 'Test Ingredient A',
  producer: 'Test Producer A',
  category: 'free',
  unit: 'tablet',
  purchase_price: 10.00,
  prescription_price: 15.00,
  general_price: 12.00,
  insurance_price: 11.00,
  barcode: 'LOW123',
  minimum_stock: 100,
  storage_location: 'A1'
};

const testDrugHighStock: CreateDrugInput = {
  name: 'High Stock Drug',
  active_ingredient: 'Test Ingredient B',
  producer: 'Test Producer B',
  category: 'limited_free',
  unit: 'bottle',
  purchase_price: 25.50,
  prescription_price: 35.00,
  general_price: 30.00,
  insurance_price: 28.00,
  barcode: 'HIGH456',
  minimum_stock: 50,
  storage_location: 'B2'
};

const testDrugNoBatches: CreateDrugInput = {
  name: 'No Batches Drug',
  active_ingredient: 'Test Ingredient C',
  producer: 'Test Producer C',
  category: 'hard',
  unit: 'capsule',
  purchase_price: 5.75,
  prescription_price: 8.00,
  general_price: 7.00,
  insurance_price: 6.50,
  barcode: null,
  minimum_stock: 20,
  storage_location: null
};

describe('getLowStockDrugs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return drugs with stock below minimum threshold', async () => {
    // Create supplier first
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();
    const supplierId = supplierResult[0].id;

    // Create drugs
    const drugResults = await db.insert(drugsTable)
      .values([
        {
          ...testDrugLowStock,
          purchase_price: testDrugLowStock.purchase_price.toString(),
          prescription_price: testDrugLowStock.prescription_price.toString(),
          general_price: testDrugLowStock.general_price.toString(),
          insurance_price: testDrugLowStock.insurance_price.toString()
        },
        {
          ...testDrugHighStock,
          purchase_price: testDrugHighStock.purchase_price.toString(),
          prescription_price: testDrugHighStock.prescription_price.toString(),
          general_price: testDrugHighStock.general_price.toString(),
          insurance_price: testDrugHighStock.insurance_price.toString()
        }
      ])
      .returning()
      .execute();

    const lowStockDrugId = drugResults[0].id;
    const highStockDrugId = drugResults[1].id;

    // Create batches - low stock drug has total 50, needs 100 (below threshold)
    await db.insert(batchesTable)
      .values([
        {
          drug_id: lowStockDrugId,
          batch_number: 'BATCH001',
          expiration_date: '2025-12-31',
          quantity: 30,
          purchase_price: '10.00',
          supplier_id: supplierId,
          received_date: '2024-01-01'
        },
        {
          drug_id: lowStockDrugId,
          batch_number: 'BATCH002',
          expiration_date: '2025-06-30',
          quantity: 20,
          purchase_price: '10.00',
          supplier_id: supplierId,
          received_date: '2024-01-15'
        },
        // High stock drug has total 150, needs 50 (above threshold)
        {
          drug_id: highStockDrugId,
          batch_number: 'BATCH003',
          expiration_date: '2025-12-31',
          quantity: 150,
          purchase_price: '25.50',
          supplier_id: supplierId,
          received_date: '2024-01-01'
        }
      ])
      .execute();

    const lowStockDrugs = await getLowStockDrugs();

    expect(lowStockDrugs).toHaveLength(1);
    expect(lowStockDrugs[0].name).toEqual('Low Stock Drug');
    expect(lowStockDrugs[0].minimum_stock).toEqual(100);
    expect(typeof lowStockDrugs[0].purchase_price).toBe('number');
    expect(lowStockDrugs[0].purchase_price).toEqual(10.00);
  });

  it('should return drugs with no batches as low stock', async () => {
    // Create drug with no batches (stock = 0, minimum = 20)
    await db.insert(drugsTable)
      .values({
        ...testDrugNoBatches,
        purchase_price: testDrugNoBatches.purchase_price.toString(),
        prescription_price: testDrugNoBatches.prescription_price.toString(),
        general_price: testDrugNoBatches.general_price.toString(),
        insurance_price: testDrugNoBatches.insurance_price.toString()
      })
      .execute();

    const lowStockDrugs = await getLowStockDrugs();

    expect(lowStockDrugs).toHaveLength(1);
    expect(lowStockDrugs[0].name).toEqual('No Batches Drug');
    expect(lowStockDrugs[0].minimum_stock).toEqual(20);
    expect(lowStockDrugs[0].category).toEqual('hard');
  });

  it('should return empty array when all drugs have sufficient stock', async () => {
    // Create supplier
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();
    const supplierId = supplierResult[0].id;

    // Create drug with high stock
    const drugResult = await db.insert(drugsTable)
      .values({
        ...testDrugHighStock,
        purchase_price: testDrugHighStock.purchase_price.toString(),
        prescription_price: testDrugHighStock.prescription_price.toString(),
        general_price: testDrugHighStock.general_price.toString(),
        insurance_price: testDrugHighStock.insurance_price.toString()
      })
      .returning()
      .execute();

    // Create batch with stock above minimum
    await db.insert(batchesTable)
      .values({
        drug_id: drugResult[0].id,
        batch_number: 'BATCH001',
        expiration_date: '2025-12-31',
        quantity: 100, // Above minimum of 50
        purchase_price: '25.50',
        supplier_id: supplierId,
        received_date: '2024-01-01'
      })
      .execute();

    const lowStockDrugs = await getLowStockDrugs();

    expect(lowStockDrugs).toHaveLength(0);
  });

  it('should handle multiple batches for same drug correctly', async () => {
    // Create supplier
    const supplierResult = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();
    const supplierId = supplierResult[0].id;

    // Create drug
    const drugResult = await db.insert(drugsTable)
      .values({
        ...testDrugLowStock,
        minimum_stock: 200, // Set high minimum
        purchase_price: testDrugLowStock.purchase_price.toString(),
        prescription_price: testDrugLowStock.prescription_price.toString(),
        general_price: testDrugLowStock.general_price.toString(),
        insurance_price: testDrugLowStock.insurance_price.toString()
      })
      .returning()
      .execute();

    // Create multiple batches totaling 150 (below minimum of 200)
    await db.insert(batchesTable)
      .values([
        {
          drug_id: drugResult[0].id,
          batch_number: 'BATCH001',
          expiration_date: '2025-12-31',
          quantity: 50,
          purchase_price: '10.00',
          supplier_id: supplierId,
          received_date: '2024-01-01'
        },
        {
          drug_id: drugResult[0].id,
          batch_number: 'BATCH002',
          expiration_date: '2025-06-30',
          quantity: 75,
          purchase_price: '10.00',
          supplier_id: supplierId,
          received_date: '2024-01-15'
        },
        {
          drug_id: drugResult[0].id,
          batch_number: 'BATCH003',
          expiration_date: '2025-03-31',
          quantity: 25,
          purchase_price: '10.00',
          supplier_id: supplierId,
          received_date: '2024-02-01'
        }
      ])
      .execute();

    const lowStockDrugs = await getLowStockDrugs();

    expect(lowStockDrugs).toHaveLength(1);
    expect(lowStockDrugs[0].name).toEqual('Low Stock Drug');
    expect(lowStockDrugs[0].minimum_stock).toEqual(200);
  });
});
