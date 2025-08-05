
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { batchesTable, drugsTable, suppliersTable } from '../db/schema';
import { getExpiringBatches } from '../handlers/get_expiring_batches';

describe('getExpiringBatches', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return batches expiring within default 6 months', async () => {
    // Create test supplier
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create test drug
    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: null,
        minimum_stock: 10,
        storage_location: null
      })
      .returning()
      .execute();

    // Create batch expiring in 3 months (should be included)
    const expiringDate = new Date();
    expiringDate.setMonth(expiringDate.getMonth() + 3);

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'EXP001',
        expiration_date: expiringDate.toISOString().split('T')[0],
        quantity: 100,
        purchase_price: '25.50',
        supplier_id: supplier[0].id,
        received_date: new Date().toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const results = await getExpiringBatches();

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(batch[0].id);
    expect(results[0].batch_number).toEqual('EXP001');
    expect(results[0].purchase_price).toEqual(25.50);
    expect(typeof results[0].purchase_price).toBe('number');
    expect(results[0].expiration_date).toBeInstanceOf(Date);
    expect(results[0].received_date).toBeInstanceOf(Date);
  });

  it('should return batches expiring within custom timeframe', async () => {
    // Create test supplier
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create test drug
    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: null,
        minimum_stock: 10,
        storage_location: null
      })
      .returning()
      .execute();

    // Create batch expiring in 2 months (should be included with 3-month window)
    const expiringDate = new Date();
    expiringDate.setMonth(expiringDate.getMonth() + 2);

    await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'EXP002',
        expiration_date: expiringDate.toISOString().split('T')[0],
        quantity: 50,
        purchase_price: '15.75',
        supplier_id: supplier[0].id,
        received_date: new Date().toISOString().split('T')[0]
      })
      .execute();

    const results = await getExpiringBatches(3);

    expect(results).toHaveLength(1);
    expect(results[0].batch_number).toEqual('EXP002');
    expect(results[0].purchase_price).toEqual(15.75);
  });

  it('should exclude already expired batches', async () => {
    // Create test supplier
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create test drug
    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: null,
        minimum_stock: 10,
        storage_location: null
      })
      .returning()
      .execute();

    // Create batch that expired 1 month ago (should be excluded)
    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() - 1);

    await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'EXPIRED001',
        expiration_date: expiredDate.toISOString().split('T')[0],
        quantity: 25,
        purchase_price: '20.00',
        supplier_id: supplier[0].id,
        received_date: new Date().toISOString().split('T')[0]
      })
      .execute();

    const results = await getExpiringBatches();

    expect(results).toHaveLength(0);
  });

  it('should exclude batches expiring beyond timeframe', async () => {
    // Create test supplier
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create test drug
    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: null,
        minimum_stock: 10,
        storage_location: null
      })
      .returning()
      .execute();

    // Create batch expiring in 8 months (should be excluded with 6-month default)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 8);

    await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'FUTURE001',
        expiration_date: futureDate.toISOString().split('T')[0],
        quantity: 75,
        purchase_price: '30.00',
        supplier_id: supplier[0].id,
        received_date: new Date().toISOString().split('T')[0]
      })
      .execute();

    const results = await getExpiringBatches();

    expect(results).toHaveLength(0);
  });

  it('should return multiple expiring batches sorted correctly', async () => {
    // Create test supplier
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create test drug
    const drug = await db.insert(drugsTable)
      .values({
        name: 'Test Drug',
        active_ingredient: 'Test Ingredient',
        producer: 'Test Producer',
        category: 'free',
        unit: 'tablet',
        purchase_price: '10.00',
        prescription_price: '15.00',
        general_price: '20.00',
        insurance_price: '12.00',
        barcode: null,
        minimum_stock: 10,
        storage_location: null
      })
      .returning()
      .execute();

    // Create two batches expiring within 6 months
    const batch1Date = new Date();
    batch1Date.setMonth(batch1Date.getMonth() + 2);

    const batch2Date = new Date();
    batch2Date.setMonth(batch2Date.getMonth() + 4);

    await db.insert(batchesTable)
      .values([
        {
          drug_id: drug[0].id,
          batch_number: 'BATCH001',
          expiration_date: batch1Date.toISOString().split('T')[0],
          quantity: 50,
          purchase_price: '15.00',
          supplier_id: supplier[0].id,
          received_date: new Date().toISOString().split('T')[0]
        },
        {
          drug_id: drug[0].id,
          batch_number: 'BATCH002',
          expiration_date: batch2Date.toISOString().split('T')[0],
          quantity: 75,
          purchase_price: '18.50',
          supplier_id: supplier[0].id,
          received_date: new Date().toISOString().split('T')[0]
        }
      ])
      .execute();

    const results = await getExpiringBatches();

    expect(results).toHaveLength(2);
    
    // Verify all numeric conversions
    results.forEach(batch => {
      expect(typeof batch.purchase_price).toBe('number');
      expect(batch.expiration_date).toBeInstanceOf(Date);
      expect(batch.received_date).toBeInstanceOf(Date);
    });

    // Check that both batches are present
    const batchNumbers = results.map(b => b.batch_number);
    expect(batchNumbers).toContain('BATCH001');
    expect(batchNumbers).toContain('BATCH002');
  });
});
