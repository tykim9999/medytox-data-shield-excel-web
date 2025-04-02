
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAudit } from '@/contexts/AuditContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileDown, FileText } from "lucide-react";
import { toast } from 'sonner';

const Export = () => {
  const { tables, currentTable } = useData();
  const { addLog } = useAudit();
  
  const [selectedTableId, setSelectedTableId] = useState<string>(currentTable?.id || '');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeAuditInfo, setIncludeAuditInfo] = useState(true);
  const [reportTitle, setReportTitle] = useState('Medytox Data Analysis Report');
  
  const selectedTable = tables.find(table => table.id === selectedTableId);
  
  const handleExportPDF = () => {
    if (!selectedTable) {
      toast.error("No table selected for export");
      return;
    }
    
    // In a real application, we would generate a PDF here
    // For this demo, we'll just log the action and show a toast
    
    toast.success("PDF export started");
    toast.info("Your report will be available shortly");
    
    addLog(
      'export',
      'pdf',
      `Exported table "${selectedTable.name}" to PDF with title: ${reportTitle}`
    );
    
    setTimeout(() => {
      toast.success("PDF export completed successfully");
    }, 2000);
  };
  
  const handleExportCSV = () => {
    if (!selectedTable) {
      toast.error("No table selected for export");
      return;
    }
    
    // Create CSV content
    let csvContent = '';
    
    // Add headers if selected
    if (includeHeaders) {
      csvContent += selectedTable.headers.join(',') + '\n';
    }
    
    // Add rows
    selectedTable.rows.forEach(row => {
      const rowData = row.map(cell => {
        // Handle special characters and format cell values for CSV
        const value = cell.value !== null && cell.value !== undefined ? cell.value : '';
        
        // If the value is a string and contains commas or quotes, wrap it in quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csvContent += rowData.join(',') + '\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedTable.name}_export.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    addLog(
      'export',
      'csv',
      `Exported table "${selectedTable.name}" to CSV`
    );
    
    toast.success("CSV export completed");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Export Report</CardTitle>
              <CardDescription>
                Generate PDF reports from your spreadsheets with customizable options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="table-select">Select Data Source</Label>
                <Select 
                  value={selectedTableId} 
                  onValueChange={setSelectedTableId}
                >
                  <SelectTrigger id="table-select">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {tables.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No tables available
                        </SelectItem>
                      ) : (
                        tables.map(table => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name} {table.confirmed ? "(Confirmed)" : "(Draft)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label>Export Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-headers"
                    checked={includeHeaders}
                    onCheckedChange={(checked) => 
                      setIncludeHeaders(checked === true)
                    }
                  />
                  <Label htmlFor="include-headers">Include column headers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-signature"
                    checked={includeSignature}
                    onCheckedChange={(checked) => 
                      setIncludeSignature(checked === true)
                    }
                  />
                  <Label htmlFor="include-signature">Include signature block</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-audit"
                    checked={includeAuditInfo}
                    onCheckedChange={(checked) => 
                      setIncludeAuditInfo(checked === true)
                    }
                  />
                  <Label htmlFor="include-audit">Include audit information</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                disabled={!selectedTableId}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export as CSV
              </Button>
              
              <Button 
                onClick={handleExportPDF}
                disabled={!selectedTableId}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate PDF Report
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Export Preview</CardTitle>
              <CardDescription>
                Preview of what your report will include
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center">
              {selectedTable ? (
                <div className="text-center px-4">
                  <FileText className="h-16 w-16 text-medytox-blue mx-auto mb-4 opacity-50" />
                  <p className="font-semibold text-lg">{reportTitle}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedTable.headers.length} columns × {selectedTable.rows.length} rows
                  </p>
                  <div className="mt-4 text-xs text-gray-500 space-y-1">
                    {includeHeaders && <p>✓ With column headers</p>}
                    {includeSignature && <p>✓ With signature block</p>}
                    {includeAuditInfo && <p>✓ With audit information</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">Select a table to preview</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Recent exports will appear here
              </p>
              <div className="mt-4 text-center">
                <p className="text-gray-400">No recent exports</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Export;
