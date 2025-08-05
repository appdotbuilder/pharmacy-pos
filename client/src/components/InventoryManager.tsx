
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search, 
  Truck,
  Building2,
  Archive
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Drug, 
  CreateDrugInput, 
  Supplier,
  CreateSupplierInput,
  CreateBatchInput,
  DrugCategory
} from '../../../server/src/schema';

interface InventoryManagerProps {
  drugs: Drug[];
  suppliers: Supplier[];
  onRefreshData: () => void;
}

export function InventoryManager({ drugs, suppliers, onRefreshData }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddingDrug, setIsAddingDrug] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // Drug form state
  const [drugForm, setDrugForm] = useState<CreateDrugInput>({
    name: '',
    active_ingredient: '',
    producer: '',
    category: 'free',
    unit: '',
    purchase_price: 0,
    prescription_price: 0,
    general_price: 0,
    insurance_price: 0,
    barcode: null,
    minimum_stock: 0,
    storage_location: null
  });

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState<CreateSupplierInput>({
    name: '',
    contact_person: null,
    phone: null,
    email: null,
    address: null
  });

  // Batch form state
  const [batchForm, setBatchForm] = useState<CreateBatchInput>({
    drug_id: 0,
    batch_number: '',
    expiration_date: new Date(),
    quantity: 0,
    purchase_price: 0,
    supplier_id: 0,
    received_date: new Date()
  });

  // Filter drugs
  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.active_ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.producer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Create drug
  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDrug(true);
    try {
      await trpc.createDrug.mutate(drugForm);
      setDrugForm({
        name: '',
        active_ingredient: '',
        producer: '',
        category: 'free',
        unit: '',
        purchase_price: 0,
        prescription_price: 0,
        general_price: 0,
        insurance_price: 0,
        barcode: null,
        minimum_stock: 0,
        storage_location: null
      });
      onRefreshData();
      alert('Drug added successfully!');
    } catch (error) {
      console.error('Failed to create drug:', error);
      alert('Failed to add drug. Please try again.');
    } finally {
      setIsAddingDrug(false);
    }
  };

  // Create supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSupplier(true);
    try {
      await trpc.createSupplier.mutate(supplierForm);
      setSupplierForm({
        name: '',
        contact_person: null,
        phone: null,
        email: null,
        address: null
      });
      onRefreshData();
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Failed to create supplier:', error);
      alert('Failed to add supplier. Please try again.');
    } finally {
      setIsAddingSupplier(false);
    }
  };

  // Create batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBatch(true);
    try {
      await trpc.createBatch.mutate(batchForm);
      setBatchForm({
        drug_id: 0,
        batch_number: '',
        expiration_date: new Date(),
        quantity: 0,
        purchase_price: 0,
        supplier_id: 0,
        received_date: new Date()
      });
      onRefreshData();
      alert('Batch added successfully!');
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert('Failed to add batch. Please try again.');
    } finally {
      setIsAddingBatch(false);
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
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      case 'narcotics_psychotropics': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'limited_free': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Tabs defaultValue="drugs" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-gray-200">
        <TabsTrigger value="drugs" className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <span>Drugs</span>
        </TabsTrigger>
        <TabsTrigger value="batches" className="flex items-center space-x-2">
          <Archive className="h-4 w-4" />
          <span>Batches</span>
        </TabsTrigger>
        <TabsTrigger value="suppliers" className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span>Suppliers</span>
        </TabsTrigger>
        <TabsTrigger value="purchase-orders" className="flex items-center space-x-2">
          <Truck className="h-4 w-4" />
          <span>Purchase Orders</span>
        </TabsTrigger>
      </TabsList>

      {/* Drugs Tab */}
      <TabsContent value="drugs" className="space-y-6">
        {/* Header with Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="limited_free">Limited Free</SelectItem>
                <SelectItem value="narcotics_psychotropics">Narcotics/Psychotropics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Drug
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Drug</DialogTitle>
                <DialogDescription>
                  Enter drug information for inventory management
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDrug} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="drug-name">Drug Name *</Label>
                    <Input
                      id="drug-name"
                      value={drugForm.name}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="active-ingredient">Active Ingredient *</Label>
                    <Input
                      id="active-ingredient"
                      value={drugForm.active_ingredient}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, active_ingredient: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="producer">Producer *</Label>
                    <Input
                      id="producer"
                      value={drugForm.producer}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, producer: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={drugForm.category}
                      onValueChange={(value: DrugCategory) => setDrugForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="limited_free">Limited Free</SelectItem>
                        <SelectItem value="narcotics_psychotropics">Narcotics/Psychotropics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      placeholder="e.g., tablet, bottle, box"
                      value={drugForm.unit}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, unit: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum-stock">Minimum Stock *</Label>
                    <Input
                      id="minimum-stock"
                      type="number"
                      min="0"
                      value={drugForm.minimum_stock}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase-price">Purchase Price *</Label>
                    <Input
                      id="purchase-price"
                      type="number"
                      min="0"
                      step="100"
                      value={drugForm.purchase_price}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="general-price">General Price *</Label>
                    <Input
                      id="general-price"
                      type="number"
                      min="0"
                      step="100"
                      value={drugForm.general_price}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, general_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prescription-price">Prescription Price *</Label>
                    <Input
                      id="prescription-price"
                      type="number"
                      min="0"
                      step="100"
                      value={drugForm.prescription_price}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, prescription_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance-price">Insurance Price *</Label>
                    <Input
                      id="insurance-price"
                      type="number"
                      min="0"
                      step="100"
                      value={drugForm.insurance_price}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, insurance_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={drugForm.barcode || ''}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, barcode: e.target.value || null }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="storage-location">Storage Location</Label>
                    <Input
                      id="storage-location"
                      placeholder="e.g., Rack A-1, Cabinet B-2"
                      value={drugForm.storage_location || ''}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, storage_location: e.target.value || null }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingDrug}>
                    {isAddingDrug ? 'Adding...' : 'Add Drug'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Drugs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Drug Inventory ({filteredDrugs.length} items)</CardTitle>
            <CardDescription>
              Manage your pharmaceutical inventory with pricing and stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Active Ingredient</TableHead>
                    <TableHead>Producer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>General Price</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Storage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {drugs.length === 0 ? '📦 No drugs in inventory yet' : '🔍 No drugs match your search'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrugs.map((drug) => (
                      <TableRow key={drug.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{drug.name}</TableCell>
                        <TableCell className="text-gray-600">{drug.active_ingredient}</TableCell>
                        <TableCell className="text-gray-600">{drug.producer}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadgeColor(drug.category)}>
                            {formatCategoryName(drug.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>{drug.unit}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(drug.general_price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {drug.minimum_stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {drug.storage_location || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Batches Tab */}
      <TabsContent value="batches" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Batch Management</h3>
            <p className="text-gray-600">Track expiration dates and inventory batches</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Batch</DialogTitle>
                <DialogDescription>
                  Record a new batch of inventory with expiration tracking
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <Label htmlFor="batch-drug">Drug *</Label>
                  <Select 
                    value={batchForm.drug_id > 0 ? batchForm.drug_id.toString() : ''}
                    onValueChange={(value) => setBatchForm(prev => ({ ...prev, drug_id: parseInt(value) || 0 }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select drug" />
                    </SelectTrigger>
                    <SelectContent>
                      {drugs.map((drug) => (
                        <SelectItem key={drug.id} value={drug.id.toString()}>
                          {drug.name} - {drug.producer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch-number">Batch Number *</Label>
                    <Input
                      id="batch-number"
                      value={batchForm.batch_number}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, batch_number: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-quantity">Quantity *</Label>
                    <Input
                      id="batch-quantity"
                      type="number"
                      min="1"
                      value={batchForm.quantity}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiration-date">Expiration Date *</Label>
                    <Input
                      id="expiration-date"
                      type="date"
                      value={batchForm.expiration_date.toISOString().split('T')[0]}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, expiration_date: new Date(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="received-date">Received Date *</Label>
                    <Input
                      id="received-date"
                      type="date"
                      value={batchForm.received_date.toISOString().split('T')[0]}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, received_date: new Date(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch-purchase-price">Purchase Price *</Label>
                    <Input
                      id="batch-purchase-price"
                      type="number"
                      min="0"
                      step="100"
                      value={batchForm.purchase_price}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-supplier">Supplier *</Label>
                    <Select 
                      value={batchForm.supplier_id > 0 ? batchForm.supplier_id.toString() : ''}
                      onValueChange={(value) => setBatchForm(prev => ({ ...prev, supplier_id: parseInt(value) || 0 }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingBatch}>
                    {isAddingBatch ? 'Adding...' : 'Add Batch'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              🔄 Batch tracking functionality coming soon
            </p>
            <p className="text-center text-sm text-gray-400 mt-2">
              This feature will show all batches with expiration tracking
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Suppliers Tab */}
      <TabsContent value="suppliers" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Supplier Management</h3>
            <p className="text-gray-600">Manage your pharmaceutical suppliers</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>
                  Register a new pharmaceutical supplier
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-person">Contact Person</Label>
                    <Input
                      id="contact-person"
                      value={supplierForm.contact_person || ''}
                      onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value || null }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input
                      id="supplier-phone"
                      value={supplierForm.phone || ''}
                      onChange={(e)=> setSupplierForm(prev => ({ ...prev, phone: e.target.value || null }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier-email">Email</Label>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={supplierForm.email || ''}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value || null }))}
                  />
                </div>

                <div>
                  <Label htmlFor="supplier-address">Address</Label>
                  <Textarea
                    id="supplier-address"
                    value={supplierForm.address || ''}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value || null }))}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingSupplier}>
                    {isAddingSupplier ? 'Adding...' : 'Add Supplier'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        🏢 No suppliers registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          {supplier.created_at.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Purchase Orders Tab */}
      <TabsContent value="purchase-orders" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">🚚 Purchase Orders functionality coming soon</p>
              <p className="text-sm text-gray-400 mt-2">
                This feature will handle procurement and supplier orders
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
