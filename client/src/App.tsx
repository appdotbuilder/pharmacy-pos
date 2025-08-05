
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';

// Import types with correct path - from client/src/App.tsx to server/src/schema
import type { 
  Drug, 
  Supplier,
  Batch
} from '../../server/src/schema';

// Define DailySalesSummary type locally since it's from a handler file
interface DailySalesSummary {
  date: Date;
  total_transactions: number;
  total_revenue: number;
  cash_sales: number;
  card_sales: number;
  qris_sales: number;
  receivable_sales: number;
}

// Import components
import { InventoryManager } from '@/components/InventoryManager';
import { POSInterface } from '@/components/POSInterface';
import { FinancialManager } from '@/components/FinancialManager';
import { ReportsManager } from '@/components/ReportsManager';

function App() {
  // Dashboard data state
  const [salesSummary, setSalesSummary] = useState<DailySalesSummary | null>(null);
  const [lowStockDrugs, setLowStockDrugs] = useState<Drug[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<Batch[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      
      const [
        summaryResult,
        lowStockResult,
        expiringResult,
        drugsResult,
        suppliersResult
      ] = await Promise.all([
        trpc.getDailySalesSummary.query(today),
        trpc.getLowStockDrugs.query(),
        trpc.getExpiringBatches.query(6),
        trpc.getDrugs.query(),
        trpc.getSuppliers.query()
      ]);

      setSalesSummary(summaryResult);
      setLowStockDrugs(lowStockResult);
      setExpiringBatches(expiringResult);
      setDrugs(drugsResult);
      setSuppliers(suppliersResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🏥 PharmaPOS
              </h1>
              <p className="text-gray-600">Modern Pharmacy Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Point of Sale</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Financial</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">
                        Today's Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-blue-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {salesSummary ? formatCurrency(salesSummary.total_revenue) : 'Rp 0'}
                      </div>
                      <p className="text-xs text-blue-200">
                        {salesSummary?.total_transactions || 0} transactions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-100">
                        Total Products
                      </CardTitle>
                      <Package className="h-4 w-4 text-green-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{drugs.length}</div>
                      <p className="text-xs text-green-200">
                        Active inventory items
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-100">
                        Low Stock Alerts
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-orange-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{lowStockDrugs.length}</div>
                      <p className="text-xs text-orange-200">
                        Require attention
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">
                        Expiring Soon
                      </CardTitle>
                      <Clock className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{expiringBatches.length}</div>
                      <p className="text-xs text-purple-200">
                        Within 6 months
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Low Stock Alerts */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-800">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Low Stock Alerts</span>
                      </CardTitle>
                      <CardDescription className="text-orange-600">
                        Products below minimum stock level
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {lowStockDrugs.length === 0 ? (
                        <p className="text-sm text-orange-600">✅ All products adequately stocked</p>
                      ) : (
                        lowStockDrugs.slice(0, 5).map((drug: Drug) => (
                          <div key={drug.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                            <div>
                              <p className="font-medium text-gray-900">{drug.name}</p>
                              <p className="text-sm text-gray-600">{drug.producer}</p>
                            </div>
                            <Badge variant="destructive">
                              Min: {drug.minimum_stock}
                            </Badge>
                          </div>
                        ))
                      )}
                      {lowStockDrugs.length > 5 && (
                        <p className="text-sm text-orange-600">
                          +{lowStockDrugs.length - 5} more items need attention
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expiring Batches */}
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-purple-800">
                        <Calendar className="h-5 w-5" />
                        <span>Expiring Batches</span>
                      </CardTitle>
                      <CardDescription className="text-purple-600">
                        Batches expiring within 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {expiringBatches.length === 0 ? (
                        <p className="text-sm text-purple-600">✅ No batches expiring soon</p>
                      ) : (
                        expiringBatches.slice(0, 5).map((batch: Batch) => (
                          <div key={batch.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                            <div>
                              <p className="font-medium text-gray-900">Batch #{batch.batch_number}</p>
                              <p className="text-sm text-gray-600">Qty: {batch.quantity}</p>
                            </div>
                            <Badge variant="outline" className="text-purple-700 border-purple-300">
                              {batch.expiration_date.toLocaleDateString()}
                            </Badge>
                          </div>
                        ))
                      )}
                      {expiringBatches.length > 5 && (
                        <p className="text-sm text-purple-600">
                          +{expiringBatches.length - 5} more batches expiring
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sales Breakdown */}
                {salesSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Sales Breakdown</CardTitle>
                      <CardDescription>Revenue by payment method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Cash</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(salesSummary.cash_sales)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Card</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(salesSummary.card_sales)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">QRIS</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatCurrency(salesSummary.qris_sales)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">Receivable</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatCurrency(salesSummary.receivable_sales)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Point of Sale Tab */}
          <TabsContent value="pos">
            <POSInterface drugs={drugs} onRefreshData={loadDashboardData} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryManager 
              drugs={drugs} 
              suppliers={suppliers}
              onRefreshData={loadDashboardData} 
            />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <FinancialManager onRefreshData={loadDashboardData} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
