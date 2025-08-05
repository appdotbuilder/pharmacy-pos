
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable } from '../db/schema';
import { type CreateDrugInput } from '../schema';
import { createDrug } from '../handlers/create_drug';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateDrugInput = {
  name: 'Paracetamol 500mg',
  active_ingredient: 'Paracetamol',
  producer: 'Pharma Corp',
  category: 'free',
  unit: 'tablet',
  purchase_price: 1000.50,
  prescription_price: 1500.75,
  general_price: 2000.25,
  insurance_price: 1200.00,
  barcode: '1234567890123',
  minimum_stock: 50,
  storage_location: 'Shelf A-1'
};

const testInputWithNulls: CreateDrugInput = {
  name: 'Generic Medicine',
  active_ingredient: 'Generic Compound',
  producer: 'Generic Pharma',
  category: 'hard',
  unit: 'capsule',
  purchase_price: 500.00,
  prescription_price: 750.00,
  general_price: 1000.00,
  insurance_price: 600.00,
  barcode: null,
  minimum_stock: 0,
  storage_location: null
};

describe('createDrug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a drug with all fields', async () => {
    const result = await createDrug(testInput);

    // Basic field validation
    expect(result.name).toEqual('Paracetamol 500mg');
    expect(result.active_ingredient).toEqual('Paracetamol');
    expect(result.producer).toEqual('Pharma Corp');
    expect(result.category).toEqual('free');
    expect(result.unit).toEqual('tablet');
    expect(result.purchase_price).toEqual(1000.50);
    expect(result.prescription_price).toEqual(1500.75);
    expect(result.general_price).toEqual(2000.25);
    expect(result.insurance_price).toEqual(1200.00);
    expect(result.barcode).toEqual('1234567890123');
    expect(result.minimum_stock).toEqual(50);
    expect(result.storage_location).toEqual('Shelf A-1');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.purchase_price).toBe('number');
    expect(typeof result.prescription_price).toBe('number');
    expect(typeof result.general_price).toBe('number');
    expect(typeof result.insurance_price).toBe('number');
  });

  it('should create a drug with null optional fields', async () => {
    const result = await createDrug(testInputWithNulls);

    expect(result.name).toEqual('Generic Medicine');
    expect(result.category).toEqual('hard');
    expect(result.barcode).toBeNull();
    expect(result.minimum_stock).toEqual(0);
    expect(result.storage_location).toBeNull();
    expect(result.purchase_price).toEqual(500.00);
    expect(result.prescription_price).toEqual(750.00);
    expect(result.general_price).toEqual(1000.00);
    expect(result.insurance_price).toEqual(600.00);
  });

  it('should save drug to database', async () => {
    const result = await createDrug(testInput);

    const drugs = await db.select()
      .from(drugsTable)
      .where(eq(drugsTable.id, result.id))
      .execute();

    expect(drugs).toHaveLength(1);
    const savedDrug = drugs[0];
    expect(savedDrug.name).toEqual('Paracetamol 500mg');
    expect(savedDrug.active_ingredient).toEqual('Paracetamol');
    expect(savedDrug.producer).toEqual('Pharma Corp');
    expect(savedDrug.category).toEqual('free');
    expect(savedDrug.unit).toEqual('tablet');
    expect(parseFloat(savedDrug.purchase_price)).toEqual(1000.50);
    expect(parseFloat(savedDrug.prescription_price)).toEqual(1500.75);
    expect(parseFloat(savedDrug.general_price)).toEqual(2000.25);
    expect(parseFloat(savedDrug.insurance_price)).toEqual(1200.00);
    expect(savedDrug.barcode).toEqual('1234567890123');
    expect(savedDrug.minimum_stock).toEqual(50);
    expect(savedDrug.storage_location).toEqual('Shelf A-1');
    expect(savedDrug.created_at).toBeInstanceOf(Date);
    expect(savedDrug.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different drug categories', async () => {
    const narcoticsInput: CreateDrugInput = {
      ...testInput,
      name: 'Morphine 10mg',
      category: 'narcotics_psychotropics',
      purchase_price: 5000.00,
      prescription_price: 7500.00,
      general_price: 10000.00,
      insurance_price: 6000.00
    };

    const result = await createDrug(narcoticsInput);

    expect(result.category).toEqual('narcotics_psychotropics');
    expect(result.name).toEqual('Morphine 10mg');
    expect(result.purchase_price).toEqual(5000.00);
  });

  it('should handle limited_free category', async () => {
    const limitedFreeInput: CreateDrugInput = {
      ...testInput,
      name: 'Antibiotics',
      category: 'limited_free'
    };

    const result = await createDrug(limitedFreeInput);

    expect(result.category).toEqual('limited_free');
    expect(result.name).toEqual('Antibiotics');
  });
});
