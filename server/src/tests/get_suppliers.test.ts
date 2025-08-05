
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { getSuppliers } from '../handlers/get_suppliers';

// Test data
const testSupplier1: CreateSupplierInput = {
  name: 'ABC Medical Supply',
  contact_person: 'John Doe',
  phone: '+1234567890',
  email: 'john@abcmedical.com',
  address: '123 Medical Street'
};

const testSupplier2: CreateSupplierInput = {
  name: 'XYZ Pharmaceuticals',
  contact_person: 'Jane Smith',
  phone: '+0987654321',
  email: 'jane@xyzpharma.com',
  address: '456 Pharma Avenue'
};

const testSupplier3: CreateSupplierInput = {
  name: 'Local Distributor',
  contact_person: null,
  phone: null,
  email: null,
  address: null
};

describe('getSuppliers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no suppliers exist', async () => {
    const result = await getSuppliers();

    expect(result).toEqual([]);
  });

  it('should return all suppliers', async () => {
    // Create test suppliers
    await db.insert(suppliersTable)
      .values([testSupplier1, testSupplier2, testSupplier3])
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(3);
    
    // Verify supplier 1
    const supplier1 = result.find(s => s.name === 'ABC Medical Supply');
    expect(supplier1).toBeDefined();
    expect(supplier1!.contact_person).toEqual('John Doe');
    expect(supplier1!.phone).toEqual('+1234567890');
    expect(supplier1!.email).toEqual('john@abcmedical.com');
    expect(supplier1!.address).toEqual('123 Medical Street');
    expect(supplier1!.id).toBeDefined();
    expect(supplier1!.created_at).toBeInstanceOf(Date);

    // Verify supplier 2
    const supplier2 = result.find(s => s.name === 'XYZ Pharmaceuticals');
    expect(supplier2).toBeDefined();
    expect(supplier2!.contact_person).toEqual('Jane Smith');
    expect(supplier2!.phone).toEqual('+0987654321');
    expect(supplier2!.email).toEqual('jane@xyzpharma.com');
    expect(supplier2!.address).toEqual('456 Pharma Avenue');

    // Verify supplier 3 (with null values)
    const supplier3 = result.find(s => s.name === 'Local Distributor');
    expect(supplier3).toBeDefined();
    expect(supplier3!.contact_person).toBeNull();
    expect(supplier3!.phone).toBeNull();
    expect(supplier3!.email).toBeNull();
    expect(supplier3!.address).toBeNull();
  });

  it('should return suppliers ordered by creation date', async () => {
    // Create suppliers sequentially to test ordering
    await db.insert(suppliersTable)
      .values(testSupplier1)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(suppliersTable)
      .values(testSupplier2)
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('ABC Medical Supply');
    expect(result[1].name).toEqual('XYZ Pharmaceuticals');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
