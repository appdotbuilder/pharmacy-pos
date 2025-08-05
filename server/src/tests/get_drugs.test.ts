
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drugsTable } from '../db/schema';
import { type CreateDrugInput } from '../schema';
import { getDrugs } from '../handlers/get_drugs';

// Test data
const testDrug1: CreateDrugInput = {
  name: 'Paracetamol',
  active_ingredient: 'Acetaminophen',
  producer: 'Pharma Corp',
  category: 'free',
  unit: 'tablet',
  purchase_price: 1000.50,
  prescription_price: 1500.75,
  general_price: 2000.00,
  insurance_price: 1200.25,
  barcode: '1234567890123',
  minimum_stock: 50,
  storage_location: 'A1-B2'
};

const testDrug2: CreateDrugInput = {
  name: 'Aspirin',
  active_ingredient: 'Acetylsalicylic acid',
  producer: 'MedCo',
  category: 'limited_free',
  unit: 'tablet',
  purchase_price: 800.00,
  prescription_price: 1200.00,
  general_price: 1500.00,
  insurance_price: 1000.00,
  barcode: null,
  minimum_stock: 25,
  storage_location: null
};

describe('getDrugs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no drugs exist', async () => {
    const result = await getDrugs();
    expect(result).toEqual([]);
  });

  it('should return all drugs with correct field types', async () => {
    // Insert test drugs
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

    const result = await getDrugs();

    expect(result).toHaveLength(2);

    // Verify first drug
    const drug1 = result.find(d => d.name === 'Paracetamol');
    expect(drug1).toBeDefined();
    expect(drug1!.name).toEqual('Paracetamol');
    expect(drug1!.active_ingredient).toEqual('Acetaminophen');
    expect(drug1!.category).toEqual('free');
    expect(drug1!.purchase_price).toEqual(1000.50);
    expect(typeof drug1!.purchase_price).toBe('number');
    expect(drug1!.prescription_price).toEqual(1500.75);
    expect(typeof drug1!.prescription_price).toBe('number');
    expect(drug1!.general_price).toEqual(2000.00);
    expect(typeof drug1!.general_price).toBe('number');
    expect(drug1!.insurance_price).toEqual(1200.25);
    expect(typeof drug1!.insurance_price).toBe('number');
    expect(drug1!.barcode).toEqual('1234567890123');
    expect(drug1!.minimum_stock).toEqual(50);
    expect(drug1!.storage_location).toEqual('A1-B2');
    expect(drug1!.id).toBeDefined();
    expect(drug1!.created_at).toBeInstanceOf(Date);
    expect(drug1!.updated_at).toBeInstanceOf(Date);

    // Verify second drug
    const drug2 = result.find(d => d.name === 'Aspirin');
    expect(drug2).toBeDefined();
    expect(drug2!.name).toEqual('Aspirin');
    expect(drug2!.category).toEqual('limited_free');
    expect(drug2!.purchase_price).toEqual(800.00);
    expect(typeof drug2!.purchase_price).toBe('number');
    expect(drug2!.barcode).toBeNull();
    expect(drug2!.storage_location).toBeNull();
  });

  it('should handle drugs with different categories', async () => {
    // Insert drugs with different categories
    await db.insert(drugsTable).values([
      {
        name: 'Morphine',
        active_ingredient: 'Morphine sulfate',
        producer: 'NarcoCorp',
        category: 'narcotics_psychotropics',
        unit: 'vial',
        purchase_price: '5000.00',
        prescription_price: '8000.00',
        general_price: '10000.00',
        insurance_price: '6000.00',
        barcode: null,
        minimum_stock: 5,
        storage_location: 'SECURE-A1'
      },
      {
        name: 'Antibiotics',
        active_ingredient: 'Amoxicillin',
        producer: 'MedSupply',
        category: 'hard',
        unit: 'capsule',
        purchase_price: '2500.00',
        prescription_price: '4000.00',
        general_price: '5000.00',
        insurance_price: '3000.00',
        barcode: '9876543210987',
        minimum_stock: 100,
        storage_location: 'B3-C4'
      }
    ]).execute();

    const result = await getDrugs();

    expect(result).toHaveLength(2);
    
    const morphine = result.find(d => d.name === 'Morphine');
    expect(morphine!.category).toEqual('narcotics_psychotropics');
    expect(morphine!.purchase_price).toEqual(5000.00);
    
    const antibiotics = result.find(d => d.name === 'Antibiotics');
    expect(antibiotics!.category).toEqual('hard');
    expect(antibiotics!.purchase_price).toEqual(2500.00);
  });
});
