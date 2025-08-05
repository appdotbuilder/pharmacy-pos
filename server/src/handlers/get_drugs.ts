
import { db } from '../db';
import { drugsTable } from '../db/schema';
import { type Drug } from '../schema';

export const getDrugs = async (): Promise<Drug[]> => {
  try {
    const results = await db.select()
      .from(drugsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(drug => ({
      ...drug,
      purchase_price: parseFloat(drug.purchase_price),
      prescription_price: parseFloat(drug.prescription_price),
      general_price: parseFloat(drug.general_price),
      insurance_price: parseFloat(drug.insurance_price)
    }));
  } catch (error) {
    console.error('Failed to fetch drugs:', error);
    throw error;
  }
};
