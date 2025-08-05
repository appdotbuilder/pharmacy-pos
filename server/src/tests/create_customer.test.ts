
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  phone: '081234567890',
  email: 'john.doe@example.com',
  address: 'Jl. Merdeka No. 123, Jakarta',
  insurance_info: 'BPJS Kesehatan - 123456789'
};

// Test input with minimal fields (nullable fields as null)
const minimalInput: CreateCustomerInput = {
  name: 'Jane Smith',
  phone: null,
  email: null,
  address: null,
  insurance_info: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('081234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.address).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(result.insurance_info).toEqual('BPJS Kesehatan - 123456789');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a customer with minimal fields', async () => {
    const result = await createCustomer(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.insurance_info).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].phone).toEqual('081234567890');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].address).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(customers[0].insurance_info).toEqual('BPJS Kesehatan - 123456789');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple customers with unique IDs', async () => {
    const result1 = await createCustomer(testInput);
    const result2 = await createCustomer(minimalInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('John Doe');
    expect(result2.name).toEqual('Jane Smith');

    // Verify both are saved in database
    const customers = await db.select()
      .from(customersTable)
      .execute();

    expect(customers).toHaveLength(2);
  });
});
