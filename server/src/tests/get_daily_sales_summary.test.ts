
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable, customersTable } from '../db/schema';
import { getDailySalesSummary } from '../handlers/get_daily_sales_summary';

describe('getDailySalesSummary', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty summary for date with no transactions', async () => {
        const testDate = new Date('2024-01-01');
        const result = await getDailySalesSummary(testDate);

        expect(result.date).toEqual(testDate);
        expect(result.total_transactions).toEqual(0);
        expect(result.total_revenue).toEqual(0);
        expect(result.cash_sales).toEqual(0);
        expect(result.card_sales).toEqual(0);
        expect(result.qris_sales).toEqual(0);
        expect(result.receivable_sales).toEqual(0);
    });

    it('should calculate sales summary correctly for single day', async () => {
        // Create test user (cashier)
        const cashier = await db.insert(usersTable)
            .values({
                username: 'cashier1',
                full_name: 'Test Cashier',
                password_hash: 'hash123',
                role: 'cashier',
                is_active: true
            })
            .returning()
            .execute();

        // Create test customer
        const customer = await db.insert(customersTable)
            .values({
                name: 'Test Customer',
                phone: '123456789',
                email: 'test@example.com',
                address: 'Test Address',
                insurance_info: null
            })
            .returning()
            .execute();

        const testDate = new Date('2024-01-15');
        const transactionDate = new Date('2024-01-15T10:30:00Z');

        // Create test transactions with different payment methods
        await db.insert(transactionsTable)
            .values([
                {
                    transaction_number: 'TXN001',
                    type: 'prescription',
                    customer_id: customer[0].id,
                    doctor_name: 'Dr. Smith',
                    patient_name: 'John Doe',
                    subtotal: '100.00',
                    discount_amount: '10.00',
                    total_amount: '90.00',
                    payment_method: 'cash',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                },
                {
                    transaction_number: 'TXN002',
                    type: 'non_prescription',
                    customer_id: customer[0].id,
                    doctor_name: null,
                    patient_name: 'Jane Doe',
                    subtotal: '50.00',
                    discount_amount: '0.00',
                    total_amount: '50.00',
                    payment_method: 'debit_card',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                },
                {
                    transaction_number: 'TXN003',
                    type: 'prescription',
                    customer_id: customer[0].id,
                    doctor_name: 'Dr. Johnson',
                    patient_name: 'Bob Smith',
                    subtotal: '75.00',
                    discount_amount: '5.00',
                    total_amount: '70.00',
                    payment_method: 'qris',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                },
                {
                    transaction_number: 'TXN004',
                    type: 'non_prescription',
                    customer_id: null,
                    doctor_name: null,
                    patient_name: 'Alice Johnson',
                    subtotal: '30.00',
                    discount_amount: '0.00',
                    total_amount: '30.00',
                    payment_method: 'receivable',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                }
            ])
            .execute();

        const result = await getDailySalesSummary(testDate);

        expect(result.date).toEqual(testDate);
        expect(result.total_transactions).toEqual(4);
        expect(result.total_revenue).toEqual(240.00); // 90 + 50 + 70 + 30
        expect(result.cash_sales).toEqual(90.00);
        expect(result.card_sales).toEqual(50.00); // debit_card only
        expect(result.qris_sales).toEqual(70.00);
        expect(result.receivable_sales).toEqual(30.00);
    });

    it('should group credit and debit cards together in card_sales', async () => {
        // Create test user (cashier)
        const cashier = await db.insert(usersTable)
            .values({
                username: 'cashier2',
                full_name: 'Test Cashier 2',
                password_hash: 'hash456',
                role: 'cashier',
                is_active: true
            })
            .returning()
            .execute();

        const testDate = new Date('2024-02-01');
        const transactionDate = new Date('2024-02-01T14:00:00Z');

        // Create transactions with both credit and debit cards
        await db.insert(transactionsTable)
            .values([
                {
                    transaction_number: 'TXN005',
                    type: 'prescription',
                    customer_id: null,
                    doctor_name: 'Dr. Brown',
                    patient_name: 'Patient A',
                    subtotal: '100.00',
                    discount_amount: '0.00',
                    total_amount: '100.00',
                    payment_method: 'credit_card',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                },
                {
                    transaction_number: 'TXN006',
                    type: 'non_prescription',
                    customer_id: null,
                    doctor_name: null,
                    patient_name: 'Patient B',
                    subtotal: '80.00',
                    discount_amount: '0.00',
                    total_amount: '80.00',
                    payment_method: 'debit_card',
                    cashier_id: cashier[0].id,
                    transaction_date: transactionDate
                }
            ])
            .execute();

        const result = await getDailySalesSummary(testDate);

        expect(result.total_transactions).toEqual(2);
        expect(result.total_revenue).toEqual(180.00);
        expect(result.card_sales).toEqual(180.00); // 100 + 80 (both credit and debit)
        expect(result.cash_sales).toEqual(0);
        expect(result.qris_sales).toEqual(0);
        expect(result.receivable_sales).toEqual(0);
    });

    it('should only include transactions from specified date', async () => {
        // Create test user (cashier)
        const cashier = await db.insert(usersTable)
            .values({
                username: 'cashier3',
                full_name: 'Test Cashier 3',
                password_hash: 'hash789',
                role: 'cashier',
                is_active: true
            })
            .returning()
            .execute();

        const targetDate = new Date('2024-03-15');
        const otherDate = new Date('2024-03-16');

        // Create transactions on different dates
        await db.insert(transactionsTable)
            .values([
                {
                    transaction_number: 'TXN007',
                    type: 'prescription',
                    customer_id: null,
                    doctor_name: 'Dr. White',
                    patient_name: 'Target Date Patient',
                    subtotal: '200.00',
                    discount_amount: '0.00',
                    total_amount: '200.00',
                    payment_method: 'cash',
                    cashier_id: cashier[0].id,
                    transaction_date: new Date('2024-03-15T10:00:00Z')
                },
                {
                    transaction_number: 'TXN008',
                    type: 'non_prescription',
                    customer_id: null,
                    doctor_name: null,
                    patient_name: 'Other Date Patient',
                    subtotal: '100.00',
                    discount_amount: '0.00',
                    total_amount: '100.00',
                    payment_method: 'cash',
                    cashier_id: cashier[0].id,
                    transaction_date: new Date('2024-03-16T10:00:00Z')
                }
            ])
            .execute();

        const result = await getDailySalesSummary(targetDate);

        expect(result.date).toEqual(targetDate);
        expect(result.total_transactions).toEqual(1);
        expect(result.total_revenue).toEqual(200.00);
        expect(result.cash_sales).toEqual(200.00);
    });

    it('should handle different times within the same date', async () => {
        // Create test user (cashier)
        const cashier = await db.insert(usersTable)
            .values({
                username: 'cashier4',
                full_name: 'Test Cashier 4',
                password_hash: 'hash000',
                role: 'cashier',
                is_active: true
            })
            .returning()
            .execute();

        const testDate = new Date('2024-04-01');

        // Create transactions at different times of the same day
        await db.insert(transactionsTable)
            .values([
                {
                    transaction_number: 'TXN009',
                    type: 'prescription',
                    customer_id: null,
                    doctor_name: 'Dr. Early',
                    patient_name: 'Early Patient',
                    subtotal: '50.00',
                    discount_amount: '0.00',
                    total_amount: '50.00',
                    payment_method: 'cash',
                    cashier_id: cashier[0].id,
                    transaction_date: new Date('2024-04-01T08:00:00Z') // Early morning
                },
                {
                    transaction_number: 'TXN010',
                    type: 'non_prescription',
                    customer_id: null,
                    doctor_name: null,
                    patient_name: 'Late Patient',
                    subtotal: '75.00',
                    discount_amount: '0.00',
                    total_amount: '75.00',
                    payment_method: 'qris',
                    cashier_id: cashier[0].id,
                    transaction_date: new Date('2024-04-01T22:30:00Z') // Late evening
                }
            ])
            .execute();

        const result = await getDailySalesSummary(testDate);

        expect(result.total_transactions).toEqual(2);
        expect(result.total_revenue).toEqual(125.00);
        expect(result.cash_sales).toEqual(50.00);
        expect(result.qris_sales).toEqual(75.00);
    });
});
