
import { db } from '../db';
import { drugsTable } from '../db/schema';
import { type Drug } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchDrugs = async (query: string): Promise<Drug[]> => {
  try {
    // Return empty array if query is empty or only whitespace
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    const results = await db.select()
      .from(drugsTable)
      .where(
        or(
          ilike(drugsTable.name, searchTerm),
          ilike(drugsTable.active_ingredient, searchTerm),
          ilike(drugsTable.barcode, searchTerm)
        )
      )
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
    console.error('Drug search failed:', error);
    throw error;
  }
};
