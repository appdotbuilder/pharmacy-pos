
import { z } from 'zod';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq, sql, and, gte, lt } from 'drizzle-orm';

export const dailySalesSummarySchema = z.object({
    date: z.coerce.date(),
    total_transactions: z.number().int(),
    total_revenue: z.number(),
    cash_sales: z.number(),
    card_sales: z.number(),
    qris_sales: z.number(),
    receivable_sales: z.number()
});

export type DailySalesSummary = z.infer<typeof dailySalesSummarySchema>;

export const getDailySalesSummary = async (date: Date): Promise<DailySalesSummary> => {
    try {
        // Set up date range for the given day (start and end of day)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Query transactions for the specified date with payment method breakdown
        const results = await db.select({
            total_transactions: sql<number>`count(*)::int`,
            total_revenue: sql<string>`coalesce(sum(${transactionsTable.total_amount}), 0)`,
            cash_sales: sql<string>`coalesce(sum(case when ${transactionsTable.payment_method} = 'cash' then ${transactionsTable.total_amount} else 0 end), 0)`,
            card_sales: sql<string>`coalesce(sum(case when ${transactionsTable.payment_method} in ('debit_card', 'credit_card') then ${transactionsTable.total_amount} else 0 end), 0)`,
            qris_sales: sql<string>`coalesce(sum(case when ${transactionsTable.payment_method} = 'qris' then ${transactionsTable.total_amount} else 0 end), 0)`,
            receivable_sales: sql<string>`coalesce(sum(case when ${transactionsTable.payment_method} = 'receivable' then ${transactionsTable.total_amount} else 0 end), 0)`
        })
        .from(transactionsTable)
        .where(
            and(
                gte(transactionsTable.transaction_date, startOfDay),
                lt(transactionsTable.transaction_date, endOfDay)
            )
        )
        .execute();

        const result = results[0];

        return {
            date: date,
            total_transactions: result.total_transactions,
            total_revenue: parseFloat(result.total_revenue),
            cash_sales: parseFloat(result.cash_sales),
            card_sales: parseFloat(result.card_sales),
            qris_sales: parseFloat(result.qris_sales),
            receivable_sales: parseFloat(result.receivable_sales)
        };
    } catch (error) {
        console.error('Daily sales summary generation failed:', error);
        throw error;
    }
};
