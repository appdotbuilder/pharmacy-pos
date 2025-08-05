
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable, suppliersTable } from '../db/schema';
import { type CreateDrugInput } from '../schema';
import { searchDrugs } from '../handlers/search_drugs';

// Test drug data
const testDrug1: CreateDrugInput = {
  name: 'Paracetamol 500mg',
  active_ingredient: 'Paracetamol',
  producer: 'Pharma Corp',
  category: 'free',
  unit: 'tablet',
  purchase_price: 1000.50,
  prescription_price: 1500.75,
  general_price: 2000.00,
  insurance_price: 1200.25,
  barcode: '1234567890123',
  minimum_stock: 50,
  storage_location: 'A-01'
};

const testDrug2: CreateDrugInput = {
  name: 'Amoxicillin 250mg',
  active_ingredient: 'Amoxicillin',
  producer: 'MediCorp',
  category: 'hard',
  unit: 'capsule',
  purchase_price: 2500.00,
  prescription_price: 3000.00,
  general_price: 3500.00,
  insurance_price: 2800.00,
  barcode: '9876543210987',
  minimum_stock: 30,
  storage_location: 'B-02'
};

const testDrug3: CreateDrugInput = {
  name: 'Vitamin C 1000mg',
  active_ingredient: 'Ascorbic Acid',
  producer: 'HealthCorp',
  category: 'free',
  unit: 'tablet',
  purchase_price: 500.00,
  prescription_price: 750.00,
  general_price: 1000.00,
  insurance_price: 600.00,
  barcode: null,
  minimum_stock: 100,
  storage_location: null
};

describe('searchDrugs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for empty query', async () => {
    const result = await searchDrugs('');
    expect(result).toEqual([]);
  });

  it('should return empty array for whitespace query', async () => {
    const result = await searchDrugs('   ');
    expect(result).toEqual([]);
  });

  it('should search drugs by name', async () => {
    // Create test drugs
    await db.insert(drugsTable).values([
      {
        ...testDrug1,
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      },
      {
        ...testDrug2,
        purchase_price: testDrug2.purchase_price.toString(),
        prescription_price: testDrug2.prescription_price.toString(),
        general_price: testDrug2.general_price.toString(),
        insurance_price: testDrug2.insurance_price.toString()
      }
    ]).execute();

    const result = await searchDrugs('Paracetamol');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Paracetamol 500mg');
    expect(result[0].active_ingredient).toBe('Paracetamol');
    expect(typeof result[0].purchase_price).toBe('number');
    expect(result[0].purchase_price).toBe(1000.50);
  });

  it('should search drugs by active ingredient', async () => {
    // Create test drugs
    await db.insert(drugsTable).values([
      {
        ...testDrug1,
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      },
      {
        ...testDrug2,
        purchase_price: testDrug2.purchase_price.toString(),
        prescription_price: testDrug2.prescription_price.toString(),
        general_price: testDrug2.general_price.toString(),
        insurance_price: testDrug2.insurance_price.toString()
      }
    ]).execute();

    const result = await searchDrugs('Amoxicillin');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Amoxicillin 250mg');
    expect(result[0].active_ingredient).toBe('Amoxicillin');
    expect(typeof result[0].prescription_price).toBe('number');
    expect(result[0].prescription_price).toBe(3000.00);
  });

  it('should search drugs by barcode', async () => {
    // Create test drugs
    await db.insert(drugsTable).values([
      {
        ...testDrug1,
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      },
      {
        ...testDrug2,
        purchase_price: testDrug2.purchase_price.toString(),
        prescription_price: testDrug2.prescription_price.toString(),
        general_price: testDrug2.general_price.toString(),
        insurance_price: testDrug2.insurance_price.toString()
      }
    ]).execute();

    const result = await searchDrugs('1234567890123');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Paracetamol 500mg');
    expect(result[0].barcode).toBe('1234567890123');
    expect(typeof result[0].general_price).toBe('number');
    expect(result[0].general_price).toBe(2000.00);
  });

  it('should perform case-insensitive search', async () => {
    // Create test drug
    await db.insert(drugsTable).values({
      ...testDrug1,
      purchase_price: testDrug1.purchase_price.toString(),
      prescription_price: testDrug1.prescription_price.toString(),
      general_price: testDrug1.general_price.toString(),
      insurance_price: testDrug1.insurance_price.toString()
    }).execute();

    const result = await searchDrugs('PARACETAMOL');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Paracetamol 500mg');
  });

  it('should perform partial matching', async () => {
    // Create test drugs - both should match "mg" in their names
    await db.insert(drugsTable).values([
      {
        ...testDrug1,
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      },
      {
        ...testDrug2,
        purchase_price: testDrug2.purchase_price.toString(),
        prescription_price: testDrug2.prescription_price.toString(),
        general_price: testDrug2.general_price.toString(),
        insurance_price: testDrug2.insurance_price.toString()
      }
    ]).execute();

    const result = await searchDrugs('mg');

    expect(result).toHaveLength(2);
    const names = result.map(drug => drug.name);
    expect(names).toContain('Paracetamol 500mg');
    expect(names).toContain('Amoxicillin 250mg');
  });

  it('should return multiple drugs when multiple matches found', async () => {
    // Create test drugs with similar names
    await db.insert(drugsTable).values([
      {
        ...testDrug1,
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      },
      {
        ...testDrug1,
        name: 'Paracetamol 250mg',
        purchase_price: testDrug1.purchase_price.toString(),
        prescription_price: testDrug1.prescription_price.toString(),
        general_price: testDrug1.general_price.toString(),
        insurance_price: testDrug1.insurance_price.toString()
      }
    ]).execute();

    const result = await searchDrugs('Paracetamol');

    expect(result).toHaveLength(2);
    const names = result.map(drug => drug.name);
    expect(names).toContain('Paracetamol 500mg');
    expect(names).toContain('Paracetamol 250mg');
  });

  it('should return empty array when no matches found', async () => {
    // Create test drug
    await db.insert(drugsTable).values({
      ...testDrug1,
      purchase_price: testDrug1.purchase_price.toString(),
      prescription_price: testDrug1.prescription_price.toString(),
      general_price: testDrug1.general_price.toString(),
      insurance_price: testDrug1.insurance_price.toString()
    }).execute();

    const result = await searchDrugs('Nonexistent Drug');

    expect(result).toEqual([]);
  });

  it('should convert all numeric fields correctly', async () => {
    // Create test drug
    await db.insert(drugsTable).values({
      ...testDrug1,
      purchase_price: testDrug1.purchase_price.toString(),
      prescription_price: testDrug1.prescription_price.toString(),
      general_price: testDrug1.general_price.toString(),
      insurance_price: testDrug1.insurance_price.toString()
    }).execute();

    const result = await searchDrugs('Paracetamol');

    expect(result).toHaveLength(1);
    const drug = result[0];
    
    // Verify all numeric fields are converted to numbers
    expect(typeof drug.purchase_price).toBe('number');
    expect(typeof drug.prescription_price).toBe('number');
    expect(typeof drug.general_price).toBe('number');
    expect(typeof drug.insurance_price).toBe('number');
    
    // Verify the actual values
    expect(drug.purchase_price).toBe(1000.50);
    expect(drug.prescription_price).toBe(1500.75);
    expect(drug.general_price).toBe(2000.00);
    expect(drug.insurance_price).toBe(1200.25);
  });
});
