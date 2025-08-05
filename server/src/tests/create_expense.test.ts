
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

describe('createExpense', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        full_name: 'Test User',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateExpenseInput = {
    type: 'salary',
    description: 'Monthly salary payment',
    amount: 5000000.50,
    expense_date: new Date('2024-01-15'),
    created_by: 0 // Will be set to testUserId in tests
  };

  it('should create an expense', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createExpense(input);

    // Basic field validation
    expect(result.type).toEqual('salary');
    expect(result.description).toEqual('Monthly salary payment');
    expect(result.amount).toEqual(5000000.50);
    expect(typeof result.amount).toBe('number');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createExpense(input);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].type).toEqual('salary');
    expect(expenses[0].description).toEqual('Monthly salary payment');
    expect(parseFloat(expenses[0].amount)).toEqual(5000000.50);
    expect(new Date(expenses[0].expense_date)).toEqual(new Date('2024-01-15'));
    expect(expenses[0].created_by).toEqual(testUserId);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different expense types', async () => {
    const electricityInput: CreateExpenseInput = {
      type: 'electricity',
      description: 'Monthly electricity bill',
      amount: 750000,
      expense_date: new Date('2024-01-10'),
      created_by: testUserId
    };

    const result = await createExpense(electricityInput);

    expect(result.type).toEqual('electricity');
    expect(result.description).toEqual('Monthly electricity bill');
    expect(result.amount).toEqual(750000);
    expect(typeof result.amount).toBe('number');
  });

  it('should handle rent expense type', async () => {
    const rentInput: CreateExpenseInput = {
      type: 'rent',
      description: 'Monthly store rent',
      amount: 2500000,
      expense_date: new Date('2024-01-01'),
      created_by: testUserId
    };

    const result = await createExpense(rentInput);

    expect(result.type).toEqual('rent');
    expect(result.description).toEqual('Monthly store rent');
    expect(result.amount).toEqual(2500000);
  });

  it('should handle other operational expense type', async () => {
    const otherInput: CreateExpenseInput = {
      type: 'other_operational',
      description: 'Office supplies and maintenance',
      amount: 150000.75,
      expense_date: new Date('2024-01-20'),
      created_by: testUserId
    };

    const result = await createExpense(otherInput);

    expect(result.type).toEqual('other_operational');
    expect(result.description).toEqual('Office supplies and maintenance');
    expect(result.amount).toEqual(150000.75);
    expect(typeof result.amount).toBe('number');
  });
});
