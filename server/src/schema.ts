
import { z } from 'zod';

// Enum schemas
export const drugCategorySchema = z.enum(['hard', 'free', 'limited_free', 'narcotics_psychotropics']);
export type DrugCategory = z.infer<typeof drugCategorySchema>;

export const paymentMethodSchema = z.enum(['cash', 'debit_card', 'credit_card', 'qris', 'receivable']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const transactionTypeSchema = z.enum(['prescription', 'non_prescription']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const expenseTypeSchema = z.enum(['salary', 'electricity', 'rent', 'other_operational']);
export type ExpenseType = z.infer<typeof expenseTypeSchema>;

// Drug/Product schema
export const drugSchema = z.object({
  id: z.number(),
  name: z.string(),
  active_ingredient: z.string(),
  producer: z.string(),
  category: drugCategorySchema,
  unit: z.string(),
  purchase_price: z.number(),
  prescription_price: z.number(),
  general_price: z.number(),
  insurance_price: z.number(),
  barcode: z.string().nullable(),
  minimum_stock: z.number().int(),
  storage_location: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Drug = z.infer<typeof drugSchema>;

export const createDrugInputSchema = z.object({
  name: z.string(),
  active_ingredient: z.string(),
  producer: z.string(),
  category: drugCategorySchema,
  unit: z.string(),
  purchase_price: z.number().positive(),
  prescription_price: z.number().positive(),
  general_price: z.number().positive(),
  insurance_price: z.number().positive(),
  barcode: z.string().nullable(),
  minimum_stock: z.number().int().nonnegative(),
  storage_location: z.string().nullable()
});

export type CreateDrugInput = z.infer<typeof createDrugInputSchema>;

// Batch schema for inventory tracking
export const batchSchema = z.object({
  id: z.number(),
  drug_id: z.number(),
  batch_number: z.string(),
  expiration_date: z.coerce.date(),
  quantity: z.number().int(),
  purchase_price: z.number(),
  supplier_id: z.number(),
  received_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Batch = z.infer<typeof batchSchema>;

export const createBatchInputSchema = z.object({
  drug_id: z.number(),
  batch_number: z.string(),
  expiration_date: z.coerce.date(),
  quantity: z.number().int().positive(),
  purchase_price: z.number().positive(),
  supplier_id: z.number(),
  received_date: z.coerce.date()
});

export type CreateBatchInput = z.infer<typeof createBatchInputSchema>;

// Supplier schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_person: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

export const createSupplierInputSchema = z.object({
  name: z.string(),
  contact_person: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  insurance_info: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  insurance_info: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  transaction_number: z.string(),
  type: transactionTypeSchema,
  customer_id: z.number().nullable(),
  doctor_name: z.string().nullable(),
  patient_name: z.string().nullable(),
  subtotal: z.number(),
  discount_amount: z.number(),
  total_amount: z.number(),
  payment_method: paymentMethodSchema,
  cashier_id: z.number(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  type: transactionTypeSchema,
  customer_id: z.number().nullable(),
  doctor_name: z.string().nullable(),
  patient_name: z.string().nullable(),
  subtotal: z.number().positive(),
  discount_amount: z.number().nonnegative(),
  total_amount: z.number().positive(),
  payment_method: paymentMethodSchema,
  cashier_id: z.number()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Transaction item schema
export const transactionItemSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  drug_id: z.number(),
  batch_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  discount_amount: z.number(),
  subtotal: z.number(),
  created_at: z.coerce.date()
});

export type TransactionItem = z.infer<typeof transactionItemSchema>;

export const createTransactionItemInputSchema = z.object({
  transaction_id: z.number(),
  drug_id: z.number(),
  batch_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  discount_amount: z.number().nonnegative(),
  subtotal: z.number().positive()
});

export type CreateTransactionItemInput = z.infer<typeof createTransactionItemInputSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  type: expenseTypeSchema,
  description: z.string(),
  amount: z.number(),
  expense_date: z.coerce.date(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  type: expenseTypeSchema,
  description: z.string(),
  amount: z.number().positive(),
  expense_date: z.coerce.date(),
  created_by: z.number()
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// User/Cashier schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  full_name: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string(),
  full_name: z.string(),
  role: z.string(),
  password: z.string(),
  is_active: z.boolean()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Purchase Order schema
export const purchaseOrderSchema = z.object({
  id: z.number(),
  po_number: z.string(),
  supplier_id: z.number(),
  status: z.enum(['pending', 'received', 'cancelled']),
  total_amount: z.number(),
  order_date: z.coerce.date(),
  expected_delivery: z.coerce.date().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export const createPurchaseOrderInputSchema = z.object({
  supplier_id: z.number(),
  total_amount: z.number().positive(),
  order_date: z.coerce.date(),
  expected_delivery: z.coerce.date().nullable(),
  created_by: z.number()
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderInputSchema>;
