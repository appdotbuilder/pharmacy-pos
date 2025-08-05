
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

export function ReportsManager() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('sales');

  const handleGenerateReport = () => {
    alert(`Generating ${reportType} report from ${dateFrom} to ${dateTo}...`);
  };

  const handleExportReport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <Tabs defaultValue="sales" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-gray-200">
        <TabsTrigger value="sales" className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Sales Reports</span>
        </TabsTrigger>
        <TabsTrigger value="inventory" className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <span>Inventory Reports</span>
        </TabsTrigger>
        <TabsTrigger value="financial" className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>Financial Reports</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </TabsTrigger>
      </TabsList>

      {/* Sales Reports Tab */}
      <TabsContent value="sales" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sales Reports</span>
            </CardTitle>
            <CardDescription>
              Generate detailed sales reports and transaction summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Daily Sales</SelectItem>
                    <SelectItem value="cashier">Sales by Cashier</SelectItem>
                    <SelectItem value="payment">Payment Methods</SelectItem>
                    <SelectItem value="products">Product Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            {/* Quick Reports */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Daily Sales Summary</h4>
                      <p className="text-sm text-gray-600">Today's transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Monthly Revenue</h4>
                      <p className="text-sm text-gray-600">This month's earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <PieChart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Payment Breakdown</h4>
                      <p className="text-sm text-gray-600">Payment methods usage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <LineChart className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Top Products</h4>
                      <p className="text-sm text-gray-600">Best selling items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Sales Trends</h4>
                      <p className="text-sm text-gray-600">Performance over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Custom Report</h4>
                      <p className="text-sm text-gray-600">Build your own report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Options */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExportReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExportReport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => handleExportReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Inventory Reports Tab */}
      <TabsContent value="inventory" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Inventory Reports</span>
            </CardTitle>
            <CardDescription>
              Monitor stock levels, movements, and inventory valuation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Stock Card</h4>
                      <p className="text-sm text-gray-600">Item movement history</p>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Low Stock Alert</h4>
                      <p className="text-sm text-gray-600">Items below minimum</p>
                    </div>
                    <Badge variant="destructive">0 items</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Expiring Items</h4>
                      <p className="text-sm text-gray-600">Near expiration dates</p>
                    </div>
                    <Badge variant="outline">0 batches</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Fast Moving Items</h4>
                      <p className="text-sm text-gray-600">High turnover products</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Slow Moving Items</h4>
                      <p className="text-sm text-gray-600">Low turnover products</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Inventory Valuation</h4>
                      <p className="text-sm text-gray-600">Stock value calculation</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Financial Reports Tab */}
      <TabsContent value="financial" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Reports</span>
            </CardTitle>
            <CardDescription>
              Comprehensive financial analysis and profit tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Profit & Loss Statement</h4>
                      <p className="text-sm text-gray-600">Revenue, costs, and profit analysis</p>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Cash Flow Statement</h4>
                      <p className="text-sm text-gray-600">Money in and out tracking</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Expense Analysis</h4>
                      <p className="text-sm text-gray-600">Operational cost breakdown</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Receivables Report</h4>
                      <p className="text-sm text-gray-600">Outstanding customer payments</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Business Analytics</span>
            </CardTitle>
            <CardDescription>
              Advanced insights and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Advanced Analytics Coming Soon</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We're working on powerful analytics features including sales forecasting, 
                customer behavior analysis, and business intelligence insights.
              </p>
              <div className="grid gap-4 md:grid-cols-3 mt-8 max-w-2xl mx-auto">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <PieChart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">Sales Analytics</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <LineChart className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Trend Analysis</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">Performance Metrics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
