
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  date,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const drugCategoryEnum = pgEnum('drug_category', ['hard', 'free', 'limited_free', 'narcotics_psychotropics']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'debit_card', 'credit_card', 'qris', 'receivable']);
export const transactionTypeEnum = pgEnum('transaction_type', ['prescription', 'non_prescription']);
export const expenseTypeEnum = pgEnum('expense_type', ['salary', 'electricity', 'rent', 'other_operational']);
export const poStatusEnum = pgEnum('po_status', ['pending', 'received', 'cancelled']);

// Tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  full_name: text('full_name').notNull(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const suppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_person: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  insurance_info: text('insurance_info'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const drugsTable = pgTable('drugs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  active_ingredient: text('active_ingredient').notNull(),
  producer: text('producer').notNull(),
  category: drugCategoryEnum('category').notNull(),
  unit: text('unit').notNull(),
  purchase_price: numeric('purchase_price', { precision: 10, scale: 2 }).notNull(),
  prescription_price: numeric('prescription_price', { precision: 10, scale: 2 }).notNull(),
  general_price: numeric('general_price', { precision: 10, scale: 2 }).notNull(),
  insurance_price: numeric('insurance_price', { precision: 10, scale: 2 }).notNull(),
  barcode: text('barcode'),
  minimum_stock: integer('minimum_stock').notNull().default(0),
  storage_location: text('storage_location'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const batchesTable = pgTable('batches', {
  id: serial('id').primaryKey(),
  drug_id: integer('drug_id').notNull().references(() => drugsTable.id),
  batch_number: text('batch_number').notNull(),
  expiration_date: date('expiration_date').notNull(),
  quantity: integer('quantity').notNull(),
  purchase_price: numeric('purchase_price', { precision: 10, scale: 2 }).notNull(),
  supplier_id: integer('supplier_id').notNull().references(() => suppliersTable.id),
  received_date: date('received_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transaction_number: text('transaction_number').notNull().unique(),
  type: transactionTypeEnum('type').notNull(),
  customer_id: integer('customer_id').references(() => customersTable.id),
  doctor_name: text('doctor_name'),
  patient_name: text('patient_name'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  cashier_id: integer('cashier_id').notNull().references(() => usersTable.id),
  transaction_date: timestamp('transaction_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const transactionItemsTable = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transaction_id: integer('transaction_id').notNull().references(() => transactionsTable.id),
  drug_id: integer('drug_id').notNull().references(() => drugsTable.id),
  batch_id: integer('batch_id').notNull().references(() => batchesTable.id),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  type: expenseTypeEnum('type').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  expense_date: date('expense_date').notNull(),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const purchaseOrdersTable = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  po_number: text('po_number').notNull().unique(),
  supplier_id: integer('supplier_id').notNull().references(() => suppliersTable.id),
  status: poStatusEnum('status').notNull().default('pending'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  order_date: date('order_date').notNull(),
  expected_delivery: date('expected_delivery'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const drugsRelations = relations(drugsTable, ({ many }) => ({
  batches: many(batchesTable),
  transactionItems: many(transactionItemsTable),
}));

export const batchesRelations = relations(batchesTable, ({ one, many }) => ({
  drug: one(drugsTable, {
    fields: [batchesTable.drug_id],
    references: [drugsTable.id],
  }),
  supplier: one(suppliersTable, {
    fields: [batchesTable.supplier_id],
    references: [suppliersTable.id],
  }),
  transactionItems: many(transactionItemsTable),
}));

export const suppliersRelations = relations(suppliersTable, ({ many }) => ({
  batches: many(batchesTable),
  purchaseOrders: many(purchaseOrdersTable),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  transactions: many(transactionsTable),
  expenses: many(expensesTable),
  purchaseOrders: many(purchaseOrdersTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [transactionsTable.customer_id],
    references: [customersTable.id],
  }),
  cashier: one(usersTable, {
    fields: [transactionsTable.cashier_id],
    references: [usersTable.id],
  }),
  items: many(transactionItemsTable),
}));

export const transactionItemsRelations = relations(transactionItemsTable, ({ one }) => ({
  transaction: one(transactionsTable, {
    fields: [transactionItemsTable.transaction_id],
    references: [transactionsTable.id],
  }),
  drug: one(drugsTable, {
    fields: [transactionItemsTable.drug_id],
    references: [drugsTable.id],
  }),
  batch: one(batchesTable, {
    fields: [transactionItemsTable.batch_id],
    references: [batchesTable.id],
  }),
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [expensesTable.created_by],
    references: [usersTable.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrdersTable, ({ one }) => ({
  supplier: one(suppliersTable, {
    fields: [purchaseOrdersTable.supplier_id],
    references: [suppliersTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [purchaseOrdersTable.created_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  suppliers: suppliersTable,
  customers: customersTable,
  drugs: drugsTable,
  batches: batchesTable,
  transactions: transactionsTable,
  transactionItems: transactionItemsTable,
  expenses: expensesTable,
  purchaseOrders: purchaseOrdersTable,
};
