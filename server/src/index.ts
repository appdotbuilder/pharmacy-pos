
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createDrugInputSchema, 
  createBatchInputSchema,
  createTransactionInputSchema,
  createTransactionItemInputSchema,
  createSupplierInputSchema,
  createCustomerInputSchema,
  createExpenseInputSchema,
  createPurchaseOrderInputSchema
} from './schema';

// Import handlers
import { createDrug } from './handlers/create_drug';
import { getDrugs } from './handlers/get_drugs';
import { createBatch } from './handlers/create_batch';
import { getBatchesByDrug } from './handlers/get_batches_by_drug';
import { getBatchById } from './handlers/get_batch_by_id';
import { createTransaction } from './handlers/create_transaction';
import { createTransactionItem } from './handlers/create_transaction_item';
import { getLowStockDrugs } from './handlers/get_low_stock_drugs';
import { getExpiringBatches } from './handlers/get_expiring_batches';
import { createSupplier } from './handlers/create_supplier';
import { getSuppliers } from './handlers/get_suppliers';
import { createCustomer } from './handlers/create_customer';
import { searchDrugs } from './handlers/search_drugs';
import { createExpense } from './handlers/create_expense';
import { getDailySalesSummary } from './handlers/get_daily_sales_summary';
import { createPurchaseOrder } from './handlers/create_purchase_order';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Drug/Inventory Management
  createDrug: publicProcedure
    .input(createDrugInputSchema)
    .mutation(({ input }) => createDrug(input)),
  
  getDrugs: publicProcedure
    .query(() => getDrugs()),
  
  searchDrugs: publicProcedure
    .input(z.string())
    .query(({ input }) => searchDrugs(input)),
  
  getLowStockDrugs: publicProcedure
    .query(() => getLowStockDrugs()),

  // Batch Management
  createBatch: publicProcedure
    .input(createBatchInputSchema)
    .mutation(({ input }) => createBatch(input)),
  
  getBatchesByDrug: publicProcedure
    .input(z.number())
    .query(({ input }) => getBatchesByDrug(input)),
  
  getBatchById: publicProcedure
    .input(z.number())
    .query(({ input }) => getBatchById(input)),
  
  getExpiringBatches: publicProcedure
    .input(z.number().optional().default(6))
    .query(({ input }) => getExpiringBatches(input)),

  // Transaction Management
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  
  createTransactionItem: publicProcedure
    .input(createTransactionItemInputSchema)
    .mutation(({ input }) => createTransactionItem(input)),

  // Supplier Management
  createSupplier: publicProcedure
    .input(createSupplierInputSchema)
    .mutation(({ input }) => createSupplier(input)),
  
  getSuppliers: publicProcedure
    .query(() => getSuppliers()),

  // Customer Management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),

  // Expense Management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),

  // Purchase Order Management
  createPurchaseOrder: publicProcedure
    .input(createPurchaseOrderInputSchema)
    .mutation(({ input }) => createPurchaseOrder(input)),

  // Reporting
  getDailySalesSummary: publicProcedure
    .input(z.coerce.date())
    .query(({ input }) => getDailySalesSummary(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Pharmacy POS TRPC server listening at port: ${port}`);
}

start();
