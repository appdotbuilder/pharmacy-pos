
import { db } from '../db';
import { drugsTable } from '../db/schema';
import { type CreateDrugInput, type Drug } from '../schema';

export const createDrug = async (input: CreateDrugInput): Promise<Drug> => {
  try {
    // Insert drug record
    const result = await db.insert(drugsTable)
      .values({
        name: input.name,
        active_ingredient: input.active_ingredient,
        producer: input.producer,
        category: input.category,
        unit: input.unit,
        purchase_price: input.purchase_price.toString(),
        prescription_price: input.prescription_price.toString(),
        general_price: input.general_price.toString(),
        insurance_price: input.insurance_price.toString(),
        barcode: input.barcode,
        minimum_stock: input.minimum_stock,
        storage_location: input.storage_location
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const drug = result[0];
    return {
      ...drug,
      purchase_price: parseFloat(drug.purchase_price),
      prescription_price: parseFloat(drug.prescription_price),
      general_price: parseFloat(drug.general_price),
      insurance_price: parseFloat(drug.insurance_price)
    };
  } catch (error) {
    console.error('Drug creation failed:', error);
    throw error;
  }
};
