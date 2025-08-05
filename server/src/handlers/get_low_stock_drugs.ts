
import { db } from '../db';
import { drugsTable, batchesTable } from '../db/schema';
import { type Drug } from '../schema';
import { sql, lt } from 'drizzle-orm';

export const getLowStockDrugs = async (): Promise<Drug[]> => {
  try {
    // Query to get drugs where total batch quantity is less than minimum_stock
    // Using a subquery to calculate total stock per drug
    const results = await db
      .select({
        id: drugsTable.id,
        name: drugsTable.name,
        active_ingredient: drugsTable.active_ingredient,
        producer: drugsTable.producer,
        category: drugsTable.category,
        unit: drugsTable.unit,
        purchase_price: drugsTable.purchase_price,
        prescription_price: drugsTable.prescription_price,
        general_price: drugsTable.general_price,
        insurance_price: drugsTable.insurance_price,
        barcode: drugsTable.barcode,
        minimum_stock: drugsTable.minimum_stock,
        storage_location: drugsTable.storage_location,
        created_at: drugsTable.created_at,
        updated_at: drugsTable.updated_at,
        total_stock: sql<string>`COALESCE(SUM(${batchesTable.quantity}), 0)`
      })
      .from(drugsTable)
      .leftJoin(batchesTable, sql`${drugsTable.id} = ${batchesTable.drug_id}`)
      .groupBy(
        drugsTable.id,
        drugsTable.name,
        drugsTable.active_ingredient,
        drugsTable.producer,
        drugsTable.category,
        drugsTable.unit,
        drugsTable.purchase_price,
        drugsTable.prescription_price,
        drugsTable.general_price,
        drugsTable.insurance_price,
        drugsTable.barcode,
        drugsTable.minimum_stock,
        drugsTable.storage_location,
        drugsTable.created_at,
        drugsTable.updated_at
      )
      .having(sql`COALESCE(SUM(${batchesTable.quantity}), 0) < ${drugsTable.minimum_stock}`)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(drug => ({
      id: drug.id,
      name: drug.name,
      active_ingredient: drug.active_ingredient,
      producer: drug.producer,
      category: drug.category,
      unit: drug.unit,
      purchase_price: parseFloat(drug.purchase_price),
      prescription_price: parseFloat(drug.prescription_price),
      general_price: parseFloat(drug.general_price),
      insurance_price: parseFloat(drug.insurance_price),
      barcode: drug.barcode,
      minimum_stock: drug.minimum_stock,
      storage_location: drug.storage_location,
      created_at: drug.created_at,
      updated_at: drug.updated_at
    }));
  } catch (error) {
    console.error('Failed to get low stock drugs:', error);
    throw error;
  }
};
