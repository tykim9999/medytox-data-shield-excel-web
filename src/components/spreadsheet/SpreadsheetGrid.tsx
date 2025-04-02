import { useState, useEffect, useRef } from 'react';
import { useData, type Cell, type CellValue, type TableData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  FileSpreadsheet,
  Edit,
  Lock,
  Eye,
  MoreVertical,
  ChevronDown,
  Download,
  Share2,
  Save,
  Calculator
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StatisticsPanel from '@/components/analysis/StatisticsPanel';
import ControlChartPanel from '@/components/analysis/ControlChartPanel';

// Helper function to generate a column name from a column index
const getColumnName = (colIndex: number): string => {
  let columnName = '';
  let base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let num = colIndex;

  while (num >= 0) {
    columnName = base[num % 26] + columnName;
    num = Math.floor(num / 26) - 1;
  }

  return columnName;
};

// Function to convert a cell value to a number, or return null if not a number
const parseNumber = (value: CellValue): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  return null;
};

const SpreadsheetGrid = () => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [currentValue, setCurrentValue] = useState<CellValue | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTab, setSelectedTab] = useState("data");

  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    currentTable, 
    updateCell, 
    confirmCell, 
    confirmTable, 
    addRow, 
    addColumn,
    exportTableToPDF,
    canEditCell
  } = useData();
  const { user } = useAuth();
  const { addLog } = useAudit();
  const { toast } = useToast();

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Make sure currentTable is available
  if (!currentTable) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <p className="text-lg text-gray-500">No table selected.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    // Check cell permissions using canEditCell from context
    if (!canEditCell(rowIndex, colIndex)) {
      toast({
        title: "Cannot edit cell",
        description: "You don't have permission to edit this cell",
        variant: "destructive",
      });
      return;
    }
    
    // Get the current cell value
    const cell = currentTable.rows[rowIndex]?.[colIndex];
    
    // Set editing state
    setEditingCell({ row: rowIndex, col: colIndex });
    setCurrentValue(cell?.value ?? null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      handleCellBlur(rowIndex, colIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setCurrentValue(null);
    }
  };

  const handleCellBlur = (rowIndex: number, colIndex: number) => {
    if (editingCell) {
      // Update the cell value in the data context
      const success = updateCell(rowIndex, colIndex, currentValue);
      
      if (success) {
        toast({
          title: "Cell updated",
          description: `Cell [${rowIndex + 1}, ${getColumnName(colIndex)}] updated to ${currentValue}`,
        });
      }
    }
    
    // Reset editing state
    setEditingCell(null);
  };

  const handleAddRow = () => {
    addRow();
    addLog('create', 'spreadsheet', 'New row added');
    toast({
      title: "Row added",
      description: "A new row has been added to the table",
    });
  };

  const handleAddColumn = () => {
    // Show a dialog to enter the column name
    const columnName = prompt("Enter column name:", "");
    if (columnName) {
      addColumn(columnName);
      addLog('create', 'spreadsheet', 'New column added');
      toast({
        title: "Column added",
        description: `New column "${columnName}" has been added to the table`,
      });
    }
  };

  const handleConfirmCell = (rowIndex: number, colIndex: number) => {
    confirmCell(rowIndex, colIndex);
    addLog('update', 'spreadsheet', `Cell [${rowIndex + 1}, ${getColumnName(colIndex)}] confirmed`);
    toast({
      title: "Cell confirmed",
      description: `Cell [${rowIndex + 1}, ${getColumnName(colIndex)}] has been confirmed`,
    });
  };

  const handleExportToCSV = () => {
    // Create a CSV string from the current table data
    const csvRows = currentTable.rows.map(row =>
      row.map(cell => cell.value === null ? '' : cell.value).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + currentTable.headers.join(',') + '\n' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentTable.name}.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    addLog('export', 'spreadsheet', 'Table exported to CSV');
    toast({
      title: "CSV exported",
      description: "Your spreadsheet has been exported as a CSV file",
    });
  };

  const handleExportToReport = () => {
    // Use the context method instead
    exportTableToPDF();
    toast({
      title: "Report generated",
      description: "The PDF report has been successfully generated",
    });
  };

  const handleConfirmTable = () => {
    confirmTable();
    setIsLocked(true);
    addLog('confirm', 'spreadsheet', 'Table confirmed and locked');
    
    toast({
      title: "Changes confirmed",
      description: "Your changes have been confirmed and locked",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{currentTable.name}</CardTitle>
            <CardDescription>Manage and analyze your data</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportToReport}>
              <Share2 className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            {user?.role === 'admin' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calculator className="mr-2 h-4 w-4" />
                    Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Analysis Tools</DialogTitle>
                    <DialogDescription>
                      Explore various analysis options for your spreadsheet data.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="statistics" className="w-full">
                    <TabsList>
                      <TabsTrigger value="statistics">Statistics</TabsTrigger>
                      <TabsTrigger value="controlChart">Control Chart</TabsTrigger>
                    </TabsList>
                    <TabsContent value="statistics">
                      <div className="p-4 bg-gray-50 rounded-md">
                        <p>Statistics analysis would be shown here</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="controlChart">
                      <div className="p-4 bg-gray-50 rounded-md">
                        <p>Control chart analysis would be shown here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter>
                    <Button type="button">Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <div className="overflow-x-auto">
              <Table ref={tableRef} className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    {currentTable.headers.map((header, colIndex) => (
                      <TableHead key={colIndex}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTable.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                      {row.map((cell, colIndex) => (
                        <TableCell 
                          key={colIndex} 
                          className={cell.confirmed ? "bg-green-50" : ""}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                            <Input
                              ref={inputRef}
                              type="text"
                              value={currentValue === null ? '' : String(currentValue)}
                              onChange={handleInputChange}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                              onBlur={() => handleCellBlur(rowIndex, colIndex)}
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className={cell.confirmed ? "font-medium" : ""}>
                                {cell.value === null ? '' : String(cell.value)}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="ml-2 h-4 w-4 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  {canEditCell(rowIndex, colIndex) && !cell.confirmed && (
                                    <DropdownMenuItem onClick={() => handleConfirmCell(rowIndex, colIndex)}>
                                      <Lock className="mr-2 h-4 w-4" />
                                      Confirm
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View History
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-medium">Spreadsheet Settings</h3>
              <div className="flex space-x-4">
                <Button onClick={handleAddRow}>Add Row</Button>
                <Button onClick={handleAddColumn}>Add Column</Button>
                <Button 
                  onClick={handleConfirmTable} 
                  disabled={currentTable.confirmed} 
                  className="ml-auto"
                >
                  {currentTable.confirmed ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Confirmed
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Confirm Table
                    </>
                  )}
                </Button>
              </div>
              
              {currentTable.confirmed && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                  <p className="text-green-800">
                    This table was confirmed by {currentTable.confirmedBy || "a user"} 
                    {currentTable.confirmedAt && ` on ${new Date(currentTable.confirmedAt).toLocaleString()}`}
                  </p>
                  {currentTable.confirmedComments && (
                    <p className="text-green-700 mt-2">
                      Comments: {currentTable.confirmedComments}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetGrid;
