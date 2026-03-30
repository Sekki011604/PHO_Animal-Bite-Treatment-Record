import React, { useState } from 'react';
import {
  StatGroup,
  Stat,
  SearchInput,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataTable,
} from '@blinkdotnew/ui';
import { BarChart3, LineChart, Filter, Search, RefreshCcw, Download, Printer, Users, Calendar } from 'lucide-react';
import { AreaChart, BarChart, ResponsiveContainer } from 'recharts'; // Using Recharts as per instructions

// Mock data for charts and tables - replace with actual data props
const mockKpiData = [
  { title: 'Total Records', value: '15,234', trend: 12.5, trendLabel: 'vs last month', icon: <Users />, description: 'Total number of health records processed.' },
  { title: 'New Cases Today', value: '115', trend: -2.1, trendLabel: 'vs yesterday', icon: <BarChart3 />, description: 'Number of new cases reported today.' },
  { title: 'Active Outbreaks', value: '3', trend: 0, trendLabel: 'vs last week', icon: <Filter />, description: 'Currently active public health outbreaks.' },
];

const mockMonthlySalesData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
  { month: 'Jul', sales: 7000 },
  { month: 'Aug', sales: 6800 },
  { month: 'Sep', sales: 7500 },
  { month: 'Oct', sales: 8000 },
  { month: 'Nov', sales: 7800 },
  { month: 'Dec', sales: 9000 },
];

const mockCategoryBreakdownData = [
  { name: 'Infectious Diseases', value: 45 },
  { name: 'Chronic Diseases', value: 30 },
  { name: 'Vaccinations', value: 15 },
  { name: 'Maternal Health', value: 10 },
];

const mockAnimalTypeData = [
  { name: 'Poultry', value: 60 },
  { name: 'Swine', value: 25 },
  { name: 'Cattle', value: 10 },
  { name: 'Others', value: 5 },
];

const mockAgeGroupData = [
  { name: '0-18', value: 25 },
  { name: '19-40', value: 35 },
  { name: '41-65', value: 30 },
  { name: '65+', value: 10 },
];

const mockTopBarangaysData = [
  { name: 'Barangay 1', value: 1200 },
  { name: 'Barangay 2', value: 1150 },
  { name: 'Barangay 3', value: 1000 },
  { name: 'Barangay 4', value: 950 },
  { name: 'Barangay 5', value: 800 },
];

const barangayColumns = [
  { accessorKey: 'name', header: 'Barangay Name' },
  { accessorKey: 'value', header: 'Record Count' },
];

interface AnalyticsProps {
  kpiData: { title: string; value: string; trend?: number; trendLabel?: string; icon?: React.ReactNode; description?: string; }[];
  monthlySalesData: { month: string; sales: number; }[];
  categoryBreakdownData: { name: string; value: number; }[];
  animalTypeData: { name: string; value: number; }[];
  ageGroupData: { name: string; value: number; }[];
  topBarangaysData: { name: string; value: number; }[];
  onFilterChange: (filters: { month?: string; search?: string }) => void;
  onResetFilters: () => void;
  onExportReport: () => void;
  onPrintReport: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({
  kpiData,
  monthlySalesData,
  categoryBreakdownData,
  animalTypeData,
  ageGroupData,
  topBarangaysData,
  onFilterChange,
  onResetFilters,
  onExportReport,
  onPrintReport,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    onFilterChange({ month, search: searchTerm });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    onFilterChange({ month: selectedMonth, search: event.target.value });
  };

  const handleReset = () => {
    setSelectedMonth(undefined);
    setSearchTerm('');
    onResetFilters();
  };

  const renderChart = (data: any[], dataKey: string, xAxisKey?: string, ChartComponent: any = AreaChart) => {
    if (!data || data.length === 0) {
      return <EmptyState title="No data available" description="Data for this chart is currently unavailable." />;
    }
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          {xAxisKey && <XAxis dataKey={xAxisKey} />}
          <YAxis />
          <Tooltip />
          <Legend />
          <ChartComponent.XAxis dataKey={xAxisKey} />
          <ChartComponent.YAxis />
          <ChartComponent.Tooltip />
          <ChartComponent.Legend />
          <ChartComponent.CartesianGrid strokeDasharray="3 3" />
          <ChartComponent
            data={data}
            dataKey={dataKey}
            fill="var(--chart-1)" // Using primary chart color
            stroke="var(--chart-1)"
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (data: any[], dataKey: string | string[], xAxisKey: string, ChartComponent: any = BarChart) => {
    if (!data || data.length === 0) {
      return <EmptyState title="No data available" description="Data for this chart is currently unavailable." />;
    }
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <CartesianGrid strokeDasharray="3 3" />
          {Array.isArray(dataKey) ? (
            dataKey.map((key, index) => (
              <ChartComponent.Bar key={key} dataKey={key} fill={`var(--chart-${index + 1})`} stackId="a" />
            ))
          ) : (
            <ChartComponent.Bar dataKey={dataKey} fill="var(--chart-1)" stackId="a" />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="January">January</SelectItem>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="June">June</SelectItem>
              <SelectItem value="July">July</SelectItem>
              <SelectItem value="August">August</SelectItem>
              <SelectItem value="September">September</SelectItem>
              <SelectItem value="October">October</SelectItem>
              <SelectItem value="November">November</SelectItem>
              <SelectItem value="December">December</SelectItem>
            </SelectContent>
          </Select>
          <SearchInput placeholder="Search records..." value={searchTerm} onChange={handleSearchChange} />
          <Button variant="outline" onClick={handleReset}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onExportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button onClick={onPrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGroup>
        {kpiData && kpiData.length > 0 ? (
          kpiData.map((stat, index) => (
            <Stat
              key={index}
              label={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
              icon={stat.icon}
              description={stat.description}
            />
          ))
        ) : (
          <EmptyState title="No KPI data available" description="KPI data will appear here once available." />
        )}
      </StatGroup>

      <Separator />

      {/* Charts Section */}
      <Tabs defaultValue="monthlyTrend">
        <TabsList>
          <TabsTrigger value="monthlyTrend">Monthly Trend</TabsTrigger>
          <TabsTrigger value="categoryBreakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="animalType">Animal Type</TabsTrigger>
          <TabsTrigger value="ageGroup">Age Group</TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TabsContent value="monthlyTrend" className="p-0">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Health Records Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(monthlySalesData, 'sales', 'month', LineChart)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categoryBreakdown" className="p-0">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(categoryBreakdownData, 'value', 'name', BarChart)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="animalType" className="p-0">
            <Card>
              <CardHeader>
                <CardTitle>Animal Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(animalTypeData, 'value', 'name', BarChart)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ageGroup" className="p-0">
            <Card>
              <CardHeader>
                <CardTitle>Age Group Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(ageGroupData, 'value', 'name', BarChart)}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Separator />

      {/* Top Barangays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Barangays by Record Count</CardTitle>
        </CardHeader>
        <CardContent>
          {topBarangaysData && topBarangaysData.length > 0 ? (
            <DataTable columns={barangayColumns} data={topBarangaysData} />
          ) : (
            <EmptyState title="No barangay data available" description="Barangay data will appear here once available." />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Recharts components that need to be explicitly imported for renderChart helper
const { XAxis, YAxis, Tooltip, Legend, CartesianGrid } = require('recharts');

export default Analytics;
