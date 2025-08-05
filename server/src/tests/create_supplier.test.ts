
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { createSupplier } from '../handlers/create_supplier';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateSupplierInput = {
  name: 'Test Supplier Ltd',
  contact_person: 'John Doe',
  phone: '+1234567890',
  email: 'contact@testsupplier.com',
  address: '123 Business Street, City, Country'
};

// Test input with nullable fields
const minimalInput: CreateSupplierInput = {
  name: 'Minimal Supplier',
  contact_person: null,
  phone: null,
  email: null,
  address: null
};

describe('createSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a supplier with all fields', async () => {
    const result = await createSupplier(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Supplier Ltd');
    expect(result.contact_person).toEqual('John Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('contact@testsupplier.com');
    expect(result.address).toEqual('123 Business Street, City, Country');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a supplier with minimal fields', async () => {
    const result = await createSupplier(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Supplier');
    expect(result.contact_person).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save supplier to database', async () => {
    const result = await createSupplier(testInput);

    // Query using proper drizzle syntax
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, result.id))
      .execute();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Test Supplier Ltd');
    expect(suppliers[0].contact_person).toEqual('John Doe');
    expect(suppliers[0].phone).toEqual('+1234567890');
    expect(suppliers[0].email).toEqual('contact@testsupplier.com');
    expect(suppliers[0].address).toEqual('123 Business Street, City, Country');
    expect(suppliers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple suppliers successfully', async () => {
    const supplier1 = await createSupplier(testInput);
    const supplier2 = await createSupplier({
      name: 'Another Supplier',
      contact_person: 'Jane Smith',
      phone: '+0987654321',
      email: 'jane@another.com',
      address: 'Different Address'
    });

    // Verify both suppliers exist
    const allSuppliers = await db.select()
      .from(suppliersTable)
      .execute();

    expect(allSuppliers).toHaveLength(2);
    
    // Check first supplier
    const firstSupplier = allSuppliers.find(s => s.id === supplier1.id);
    expect(firstSupplier?.name).toEqual('Test Supplier Ltd');
    
    // Check second supplier
    const secondSupplier = allSuppliers.find(s => s.id === supplier2.id);
    expect(secondSupplier?.name).toEqual('Another Supplier');
  });
});
