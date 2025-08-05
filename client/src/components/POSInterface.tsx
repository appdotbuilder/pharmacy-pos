
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Drug, 
  CreateTransactionInput, 
  CreateTransactionItemInput,
  TransactionType,
  PaymentMethod
} from '../../../server/src/schema';

interface CartItem {
  drug: Drug;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface POSInterfaceProps {
  drugs: Drug[];
  onRefreshData: () => void;
}

export function POSInterface({ drugs, onRefreshData }: POSInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>('non_prescription');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [doctorName, setDoctorName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<Drug[]>([]);

  // Search drugs
  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length > 0) {
      try {
        const results = await trpc.searchDrugs.query(term);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to local filtering
        const filtered = drugs.filter(drug =>
          drug.name.toLowerCase().includes(term.toLowerCase()) ||
          drug.active_ingredient.toLowerCase().includes(term.toLowerCase()) ||
          drug.producer.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } else {
      setSearchResults([]);
    }
  }, [drugs]);

  // Add item to cart
  const addToCart = (drug: Drug) => {
    const existingItem = cart.find(item => item.drug.id === drug.id);
    
    if (existingItem) {
      updateCartItem(drug.id, existingItem.quantity + 1);
    } else {
      const unitPrice = transactionType === 'prescription' 
        ? drug.prescription_price 
        : drug.general_price;
      
      const newItem: CartItem = {
        drug,
        quantity: 1,
        unitPrice,
        discount: 0,
        subtotal: unitPrice
      };
      
      setCart(prev => [...prev, newItem]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  // Update cart item quantity
  const updateCartItem = (drugId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(drugId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.drug.id === drugId) {
        const subtotal = (item.unitPrice * newQuantity) - item.discount;
        return { ...item, quantity: newQuantity, subtotal };
      }
      return item;
    }));
  };

  // Update item discount
  const updateItemDiscount = (drugId: number, discountAmount: number) => {
    setCart(prev => prev.map(item => {
      if (item.drug.id === drugId) {
        const subtotal = (item.unitPrice * item.quantity) - discountAmount;
        return { ...item, discount: discountAmount, subtotal };
      }
      return item;
    }));
  };

  // Remove item from cart
  const removeFromCart = (drugId: number) => {
    setCart(prev => prev.filter(item => item.drug.id !== drugId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDoctorName('');
    setPatientName('');
    setDiscount(0);
    setTransactionType('non_prescription');
    setPaymentMethod('cash');
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalAmount = subtotal - totalItemDiscount - discount;

  // Process transaction
  const processTransaction = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      // Create transaction
      const transactionData: CreateTransactionInput = {
        type: transactionType,
        customer_id: null, // We'll implement customer lookup later
        doctor_name: transactionType === 'prescription' ? doctorName || null : null,
        patient_name: transactionType === 'prescription' ? patientName || null : null,
        subtotal,
        discount_amount: totalItemDiscount + discount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cashier_id: 1 // Hardcoded for now - implement user system later
      };

      const transaction = await trpc.createTransaction.mutate(transactionData);

      // Create transaction items
      for (const item of cart) {
        const itemData: CreateTransactionItemInput = {
          transaction_id: transaction.id,
          drug_id: item.drug.id,
          batch_id: 1, // Hardcoded for now - implement batch selection later
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discount,
          subtotal: item.subtotal
        };

        await trpc.createTransactionItem.mutate(itemData);
      }

      // Clear cart and refresh data
      clearCart();
      onRefreshData();
      
      alert(`Transaction completed successfully!\nTransaction ID: ${transaction.id}\nTotal: ${formatCurrency(totalAmount)}`);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'hard': return 'bg-red-100 text-red-800';
      case 'narcotics_psychotropics': return 'bg-purple-100 text-purple-800';
      case 'limited_free': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Product Search</span>
            </CardTitle>
            <CardDescription>
              Search by product name, active ingredient, or scan barcode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="text-lg h-12"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  {searchResults.map((drug) => (
                    <div
                      key={drug.id}
                      onClick={() => addToCart(drug)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{drug.name}</h4>
                          <p className="text-sm text-gray-600">{drug.active_ingredient}</p>
                          <p className="text-xs text-gray-500">{drug.producer}</p>
                        </div>
                        <div className="text-right ml-4">
                          <Badge className={getCategoryBadgeColor(drug.category)}>
                            {drug.category.replace('_', ' ')}
                          </Badge>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {formatCurrency(
                              transactionType === 'prescription' 
                                ? drug.prescription_price 
                                : drug.general_price
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction-type">Transaction Type</Label>
                <Select 
                  value={transactionType}
                  onValueChange={(value: TransactionType) => setTransactionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_prescription">Non-Prescription</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select 
                  value={paymentMethod}
                  onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💰 Cash</SelectItem>
                    <SelectItem value="debit_card">💳 Debit Card</SelectItem>
                    <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                    <SelectItem value="qris">📱 QRIS</SelectItem>
                    <SelectItem value="receivable">📋 Receivable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {transactionType === 'prescription' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctor-name">Doctor Name</Label>
                  <Input
                    id="doctor-name"
                    placeholder="Dr. Name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="patient-name">Patient Name</Label>
                  <Input
                    id="patient-name"
                    placeholder="Patient Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping Cart</span>
              </div>
              <Badge variant="secondary">{cart.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Search and add products above</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.drug.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.drug.name}</h4>
                          <p className="text-xs text-gray-600">{item.drug.producer}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>  removeFromCart(item.drug.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.drug.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.drug.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Discount"
                          value={item.discount || ''}
                          onChange={(e) => updateItemDiscount(item.drug.id, parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs"
                          min="0"
                          step="1000"
                        />
                        <span className="text-xs text-gray-500">discount</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Cart Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Item Discounts:</span>
                    <span className="text-red-600">-{formatCurrency(totalItemDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transaction Discount:</span>
                    <Input
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="h-6 w-20 text-xs text-right"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={processTransaction}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4 mr-2" />
                        Complete Transaction
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Clear Cart
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
