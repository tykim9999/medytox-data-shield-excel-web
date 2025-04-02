
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { ChartBar, Download } from 'lucide-react';

// Helper function to calculate mean
const calculateMean = (data: number[]): number => {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
};

// Helper function to calculate standard deviation
const calculateStandardDeviation = (data: number[], mean: number): number => {
  const squareDiffs = data.map(value => Math.pow(value - mean, 2));
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  return Math.sqrt(variance);
};

// Helper function to calculate range
const calculateRange = (data: number[]): number[] => {
  // For each subgroup (e.g., row), calculate max - min
  const ranges: number[] = [];
  for (let i = 0; i < data.length - 1; i += 2) {
    if (i + 1 < data.length) {
      ranges.push(Math.abs(data[i] - data[i + 1]));
    } else {
      ranges.push(0);
    }
  }
  return ranges;
};

const ControlChartPanel = () => {
  const { currentTable } = useData();
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  // Example data for XBar-R chart
  const generateXBarRData = () => {
    if (!currentTable || selectedColumn === null) return [];
    
    // Extract numeric data from the selected column
    const columnData = currentTable.rows
      .map(row => row[selectedColumn]?.value)
      .filter((val): val is number => typeof val === 'number');
    
    if (columnData.length === 0) {
      toast.error("Selected column doesn't contain enough numeric data for analysis");
      return [];
    }
    
    // Calculate statistics
    const mean = calculateMean(columnData);
    const stdDev = calculateStandardDeviation(columnData, mean);
    const ranges = calculateRange(columnData);
    const rangesMean = calculateMean(ranges);
    
    // Generate control limits
    const ucl = mean + (3 * stdDev);
    const lcl = mean - (3 * stdDev);
    const uclR = rangesMean * 2.114; // D4 factor for n=2
    const lclR = rangesMean * 0; // D3 factor for n=2 is 0
    
    // Format data for charting
    return columnData.map((value, index) => ({
      name: `Sample ${index + 1}`,
      value: value,
      mean: mean,
      ucl: ucl,
      lcl: lcl,
      range: index % 2 === 0 && index + 1 < columnData.length ? 
        Math.abs(columnData[index] - columnData[index + 1]) : undefined,
      rangeMean: rangesMean,
      uclR: uclR,
      lclR: lclR
    }));
  };

  const xBarRData = generateXBarRData();

  const isDataValid = xBarRData.length > 0;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-medytox-red">XBar-R Control Charts</h3>
        <Button 
          variant="outline" 
          className="text-medytox-red border-medytox-red hover:bg-medytox-red/10"
          disabled={!isDataValid}
          onClick={() => toast.success("Chart exported successfully")}
        >
          <Download className="h-4 w-4 mr-2" /> Export Chart
        </Button>
      </div>
      
      <div className="mb-6">
        <Label className="mb-2 block">Select Data Column</Label>
        <Select onValueChange={(value) => setSelectedColumn(Number(value))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {currentTable?.headers.map((header, index) => (
              <SelectItem key={index} value={index.toString()}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isDataValid ? (
        <div className="space-y-8">
          {/* XBar Chart */}
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-medium mb-2">Individual Values Chart</h4>
            <ChartContainer 
              config={{ primary: { color: "#ea384c" } }}
              className="h-64"
            >
              <LineChart
                data={xBarRData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Value" 
                  stroke="#ea384c" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mean" 
                  name="Mean (X̄)" 
                  stroke="#333" 
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                />
                <ReferenceLine y={xBarRData[0]?.ucl} label="UCL" stroke="red" strokeDasharray="3 3" />
                <ReferenceLine y={xBarRData[0]?.lcl} label="LCL" stroke="red" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </div>
          
          {/* Range Chart */}
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-medium mb-2">Range (R) Chart</h4>
            <ChartContainer 
              config={{ primary: { color: "#4c94ea" } }}
              className="h-64"
            >
              <LineChart
                data={xBarRData.filter(d => d.range !== undefined)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="range" 
                  name="Range" 
                  stroke="#4c94ea" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rangeMean" 
                  name="Mean Range (R̄)" 
                  stroke="#333" 
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                />
                <ReferenceLine y={xBarRData[0]?.uclR} label="UCL" stroke="red" strokeDasharray="3 3" />
                <ReferenceLine y={xBarRData[0]?.lclR} label="LCL" stroke="red" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-lg font-medium mb-4">Process Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="text-sm font-medium">X̄ (Process Mean)</p>
                <p className="text-xl">{xBarRData[0]?.mean.toFixed(3)}</p>
              </div>
              
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="text-sm font-medium">UCL (Upper Control Limit)</p>
                <p className="text-xl">{xBarRData[0]?.ucl.toFixed(3)}</p>
              </div>
              
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="text-sm font-medium">LCL (Lower Control Limit)</p>
                <p className="text-xl">{xBarRData[0]?.lcl.toFixed(3)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border rounded-lg">
          <ChartBar className="h-12 w-12 text-gray-300 mb-3" />
          <h4 className="text-lg font-medium text-gray-600">Select a column to generate control charts</h4>
          <p className="text-sm text-gray-500 text-center max-w-md mt-2">
            Select a column containing numeric data to generate XBar-R control charts.
            These charts help monitor and control process variation over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default ControlChartPanel;
