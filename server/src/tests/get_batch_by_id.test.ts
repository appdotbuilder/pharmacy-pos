import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable, suppliersTable, batchesTable } from '../db/schema';
import { getBatchById } from '../handlers/get_batch_by_id';

describe('getBatchById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve the correct batch by ID', async () => {
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
        purchase_price: '25.50',
        supplier_id: supplier[0].id,
        received_date: '2024-01-01'
      })
      .returning()
      .execute();

    const result = await getBatchById(batch[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(batch[0].id);
    expect(result!.drug_id).toEqual(drug[0].id);
    expect(result!.batch_number).toEqual('BATCH001');
    expect(result!.expiration_date).toEqual(new Date('2025-12-31'));
    expect(result!.quantity).toEqual(100);
    expect(result!.purchase_price).toEqual(25.50); // Verify numeric conversion
    expect(typeof result!.purchase_price).toBe('number'); // Ensure it's a number type
    expect(result!.supplier_id).toEqual(supplier[0].id);
    expect(result!.received_date).toEqual(new Date('2024-01-01'));
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent batch ID', async () => {
    const result = await getBatchById(999);

    expect(result).toBeNull();
  });

  it('should correctly convert numeric fields to numbers', async () => {
    // Create prerequisite data
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier 2',
        contact_person: 'Jane Smith',
        phone: '987654321',
        email: 'jane@supplier.com',
        address: 'Supplier Address 2'
      })
      .returning()
      .execute();

    const drug = await db.insert(drugsTable)
      .values({
        name: 'Another Drug',
        active_ingredient: 'Another Ingredient',
        producer: 'Another Producer',
        category: 'free',
        unit: 'capsule',
        purchase_price: '5.75',
        prescription_price: '8.50',
        general_price: '10.25',
        insurance_price: '7.00',
        barcode: 'ANOTHER123',
        minimum_stock: 5,
        storage_location: 'B2'
      })
      .returning()
      .execute();

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'BATCH002',
        expiration_date: '2026-06-30',
        quantity: 200,
        purchase_price: '12.99', // Decimal value to test conversion
        supplier_id: supplier[0].id,
        received_date: '2024-02-15'
      })
      .returning()
      .execute();

    const result = await getBatchById(batch[0].id);

    expect(result).toBeDefined();
    expect(result!.purchase_price).toEqual(12.99);
    expect(typeof result!.purchase_price).toBe('number');
    expect(result!.purchase_price).not.toEqual('12.99'); // Should not be a string
  });

  it('should handle date fields correctly', async () => {
    // Create prerequisite data
    const supplier = await db.insert(suppliersTable)
      .values({
        name: 'Date Test Supplier',
        contact_person: 'Date Tester',
        phone: '111222333',
        email: 'date@supplier.com',
        address: 'Date Address'
      })
      .returning()
      .execute();

    const drug = await db.insert(drugsTable)
      .values({
        name: 'Date Test Drug',
        active_ingredient: 'Date Ingredient',
        producer: 'Date Producer',
        category: 'limited_free',
        unit: 'ml',
        purchase_price: '15.00',
        prescription_price: '20.00',
        general_price: '25.00',
        insurance_price: '18.00',
        barcode: 'DATE123',
        minimum_stock: 20,
        storage_location: 'C3'
      })
      .returning()
      .execute();

    const expirationDate = new Date('2027-03-15');
    const receivedDate = new Date('2024-03-01');

    const batch = await db.insert(batchesTable)
      .values({
        drug_id: drug[0].id,
        batch_number: 'DATE_BATCH',
        expiration_date: '2027-03-15',
        quantity: 50,
        purchase_price: '30.00',
        supplier_id: supplier[0].id,
        received_date: '2024-03-01'
      })
      .returning()
      .execute();

    const result = await getBatchById(batch[0].id);

    expect(result).toBeDefined();
    expect(result!.expiration_date).toBeInstanceOf(Date);
    expect(result!.received_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.expiration_date).toEqual(expirationDate);
    expect(result!.received_date).toEqual(receivedDate);
  });
});