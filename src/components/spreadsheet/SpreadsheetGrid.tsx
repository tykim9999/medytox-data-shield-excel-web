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

// Initial table data (10x10)
const initialTableData: TableData = {
  rows: Array(10).fill(null).map(() =>
    Array(10).fill({ value: null, locked: false })
  ),
};

const SpreadsheetGrid = ({ tableId }: { tableId: string }) => {
  const [tableData, setTableData] = useState<TableData>(initialTableData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [currentValue, setCurrentValue] = useState<CellValue | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTab, setSelectedTab] = useState("data");

  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateTableData, getTableData, confirmTableData } = useData();
  const { user } = useAuth();
  const { addLog } = useAudit();
  const { toast } = useToast();

  useEffect(() => {
    const storedData = getTableData(tableId);
    if (storedData) {
      setTableData(storedData);
    } else {
      setTableData(initialTableData);
    }
  }, [tableId, getTableData]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (isLocked || tableData.rows[rowIndex][colIndex].locked) return;
    setEditingCell({ row: rowIndex, col: colIndex });
    setCurrentValue(tableData.rows[rowIndex][colIndex].value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      handleCellBlur(rowIndex, colIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setCurrentValue(tableData.rows[rowIndex][colIndex].value);
    }
  };

  const handleCellBlur = (rowIndex: number, colIndex: number) => {
    if (editingCell && currentValue !== null) {
      const parsedNumber = parseNumber(currentValue);
      if (parsedNumber === null && typeof currentValue === 'string' && currentValue.trim() !== '' && isNaN(Number(currentValue))) {
        toast({
          title: "Invalid input",
          description: "Only numbers are allowed",
          variant: "destructive",
        });
        setEditingCell(null);
        return;
      }

      const updatedTableData = {
        ...tableData,
        rows: tableData.rows.map((row, i) =>
          i === rowIndex
            ? row.map((cell, j) => (j === colIndex ? { ...cell, value: parsedNumber !== null ? parsedNumber : currentValue } : cell))
            : row
        ),
      };

      setTableData(updatedTableData);
      updateTableData(tableId, updatedTableData);
      addLog('update', 'spreadsheet', `Cell [${rowIndex + 1}, ${String.fromCharCode(65 + colIndex)}] updated to ${currentValue}`);
      
      toast({
        title: "Cell updated",
        description: `Cell [${rowIndex + 1}, ${String.fromCharCode(65 + colIndex)}] updated to ${currentValue}`,
      });
    }
    
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow: Cell[] = Array(tableData.rows[0].length).fill({ value: null, locked: false });
    const updatedTableData: TableData = {
      ...tableData,
      rows: [...tableData.rows, newRow],
    };
    setTableData(updatedTableData);
    updateTableData(tableId, updatedTableData);
    addLog('create', 'spreadsheet', 'New row added');
  };

  const handleAddColumn = () => {
    const updatedTableData: TableData = {
      ...tableData,
      rows: tableData.rows.map(row => [...row, { value: null, locked: false }]),
    };
    setTableData(updatedTableData);
    updateTableData(tableId, updatedTableData);
    addLog('create', 'spreadsheet', 'New column added');
  };

  const handleLockCell = (rowIndex: number, colIndex: number) => {
    const updatedTableData: TableData = {
      ...tableData,
      rows: tableData.rows.map((row, i) =>
        i === rowIndex
          ? row.map((cell, j) => (j === colIndex ? { ...cell, locked: !cell.locked } : cell))
          : row
      ),
    };
    setTableData(updatedTableData);
    updateTableData(tableId, updatedTableData);
    addLog('update', 'spreadsheet', `Cell [${rowIndex + 1}, ${String.fromCharCode(65 + colIndex)}] locked/unlocked`);
  };

  const handleExportToCSV = () => {
    const csvRows = tableData.rows.map(row =>
      row.map(cell => cell.value).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spreadsheet_data.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    addLog('export', 'spreadsheet', 'Table exported to CSV');
  };

  const handleExportToReport = () => {
    const reportContent = `
      <h1>Spreadsheet Report</h1>
      <p>Table ID: ${tableId}</p>
      <table>
        <thead>
          <tr>
            ${tableData.rows[0].map((_, index) => `<th>${getColumnName(index)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableData.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell.value === null ? '' : cell.value}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spreadsheet_report_${tableId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Report generated",
      description: "The report has been successfully generated",
    });
    
    addLog('export', 'spreadsheet', 'Table exported to HTML report');
  };

  const saveChanges = () => {
    updateTableData(tableId, tableData);
    addLog('update', 'spreadsheet', 'Table saved');
  };

  const confirmChanges = () => {
    confirmTableData(tableId);
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
          <CardTitle>Spreadsheet</CardTitle>
          <CardDescription>Manage and analyze your data</CardDescription>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportToReport}>
              <Share2 className="mr-2 h-4 w-4" />
              Export Report
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
                  <Tabs defaultvalue="statistics" className="w-full">
                    <TabsList>
                      <TabsTrigger value="statistics">Statistics</TabsTrigger>
                      <TabsTrigger value="controlChart">Control Chart</TabsTrigger>
                    </TabsList>
                    <TabsContent value="statistics">
                      <StatisticsPanel tableData={tableData} />
                    </TabsContent>
                    <TabsContent value="controlChart">
                      <ControlChartPanel tableData={tableData} />
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
                    {tableData.rows[0].map((_, colIndex) => (
                      <TableHead key={colIndex}>{getColumnName(colIndex)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                      {row.map((cell, colIndex) => (
                        <TableCell key={colIndex}>
                          {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                            <Input
                              ref={inputRef}
                              type="text"
                              value={currentValue === null ? '' : currentValue.toString()}
                              onChange={handleInputChange}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                              onBlur={() => handleCellBlur(rowIndex, colIndex)}
                            />
                          ) : (
                            <div className="flex items-center">
                              {cell.value === null ? '' : cell.value}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="ml-2 h-4 w-4 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleLockCell(rowIndex, colIndex)}>
                                    <Lock className="mr-2 h-4 w-4" />
                                    {cell.locked ? 'Unlock' : 'Lock'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
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
            <div>
              <p>Customize your spreadsheet settings here.</p>
              <Button onClick={handleAddRow}>Add Row</Button>
              <Button onClick={handleAddColumn}>Add Column</Button>
              <Button onClick={saveChanges}>Save Changes</Button>
              <Button disabled={isLocked} onClick={confirmChanges}>
                {isLocked ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Confirmed
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetGrid;
