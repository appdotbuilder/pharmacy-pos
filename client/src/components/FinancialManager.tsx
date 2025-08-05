
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Receipt,
  CreditCard,
  TrendingUp,
  Users
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  CreateExpenseInput,
  ExpenseType,
  CreateCustomerInput
} from '../../../server/src/schema';

interface FinancialManagerProps {
  onRefreshData: () => void;
}

export function FinancialManager({ onRefreshData }: FinancialManagerProps) {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState<CreateExpenseInput>({
    type: 'other_operational',
    description: '',
    amount: 0,
    expense_date: new Date(),
    created_by: 1 // Hardcoded for now
  });

  // Customer form state  
  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: '',
    phone: null,
    email: null,
    address: null,
    insurance_info: null
  });

  // Create expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingExpense(true);
    try {
      await trpc.createExpense.mutate(expenseForm);
      setExpenseForm({
        type: 'other_operational',
        description: '',
        amount: 0,
        expense_date: new Date(),
        created_by: 1
      });
      onRefreshData();
      alert('Expense recorded successfully!');
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to record expense. Please try again.');
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Create customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCustomer(true);
    try {
      await trpc.createCustomer.mutate(customerForm);
      setCustomerForm({
        name: '',
        phone: null,
        email: null,
        address: null,
        insurance_info: null
      });
      onRefreshData();
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to add customer. Please try again.');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  return (
    <Tabs defaultValue="expenses" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-gray-200">
        <TabsTrigger value="expenses" className="flex items-center space-x-2">
          <Receipt className="h-4 w-4" />
          <span>Expenses</span>
        </TabsTrigger>
        <TabsTrigger value="receivables" className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span>Receivables</span>
        </TabsTrigger>
        <TabsTrigger value="customers" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Customers</span>
        </TabsTrigger>
        <TabsTrigger value="profit-loss" className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>P&L</span>
        </TabsTrigger>
      </TabsList>

      {/* Expenses Tab */}
      <TabsContent value="expenses" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Expense Management</h3>
            <p className="text-gray-600">Track operational expenses and costs</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>
                  Add an operational expense to track costs
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense-type">Expense Type *</Label>
                    <Select 
                      value={expenseForm.type || 'other_operational'}
                      onValueChange={(value: ExpenseType) => setExpenseForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">👥 Salary</SelectItem>
                        <SelectItem value="electricity">⚡ Electricity</SelectItem>
                        <SelectItem value="rent">🏠 Rent</SelectItem>
                        <SelectItem value="other_operational">📋 Other Operational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expense-date">Expense Date *</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={expenseForm.expense_date.toISOString().split('T')[0]}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: new Date(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expense-amount">Amount *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expense-description">Description *</Label>
                  <Textarea
                    id="expense-description"
                    placeholder="Describe the expense..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingExpense}>
                    {isAddingExpense ? 'Recording...' : 'Record Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expense Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Today's Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">Rp 0</div>
              <p className="text-xs text-red-500">0 transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Rp 0</div>
              <p className="text-xs text-orange-500">Monthly total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Salary Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Rp 0</div>
              <p className="text-xs text-purple-500">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Other Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">Rp 0</div>
              <p className="text-xs text-gray-500">Operational</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              📊 No expenses recorded yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Receivables Tab */}
      <TabsContent value="receivables" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Outstanding Receivables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Rp 0</div>
              <p className="text-xs text-blue-500">0 accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Collected Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rp 0</div>
              <p className="text-xs text-green-500">0 payments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Rp 0</div>
              <p className="text-xs text-orange-500">0 accounts</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receivables Management</CardTitle>
            <CardDescription>Track customer and insurance receivables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              💳 Receivables tracking functionality coming soon
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Customers Tab */}
      <TabsContent value="customers" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Customer Management</h3>
            <p className="text-gray-600">Manage customer information and insurance details</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Register a new customer with insurance information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      value={customerForm.phone || ''}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value || null }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerForm.email || ''}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value || null }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer-address">Address</Label>
                  <Textarea
                    id="customer-address"
                    value={customerForm.address || ''}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value || null }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="insurance-info">Insurance Information</Label>
                  <Input
                    id="insurance-info"
                    placeholder="e.g., BPJS, Private Insurance"
                    value={customerForm.insurance_info || ''}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, insurance_info: e.target.value || null }))}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingCustomer}>
                    {isAddingCustomer ? 'Adding...' : 'Add Customer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Database</CardTitle>
            <CardDescription>Registered customers and their information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              👥 No customers registered yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Profit & Loss Tab */}
      <TabsContent value="profit-loss" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Gross Profit (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rp 0</div>
              <p className="text-xs text-green-500">Revenue - COGS</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Net Profit (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Rp 0</div>
              <p className="text-xs text-blue-500">After expenses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0%</div>
              <p className="text-xs text-purple-500">Net profit ratio</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Financial performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">Total Revenue</span>
                <span className="text-xl font-bold text-green-600">Rp 0</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <span className="font-medium text-red-800">Cost of Goods Sold</span>
                <span className="text-xl font-bold text-red-600">Rp 0</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Gross Profit</span>
                <span className="text-xl font-bold text-blue-600">Rp 0</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-800">Operating Expenses</span>
                <span className="text-xl font-bold text-orange-600">Rp 0</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <span className="font-bold text-purple-800">Net Profit</span>
                <span className="text-2xl font-bold text-purple-600">Rp 0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
