
import { useState, useEffect, useRef } from 'react';
import { useData, type Cell, type CellValue, type TableData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  MoreHorizontal, 
  Plus, 
  Shield, 
  History, 
  Lock, 
  ChartBar,
  Download,
  Users,
  Save,
  Calculator
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StatisticsPanel from '@/components/analysis/StatisticsPanel';
import ControlChartPanel from '@/components/analysis/ControlChartPanel';

// Helper function to format date/time
const formatDateTime = (date: Date | undefined) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

// Helper to get column letter (A, B, C, etc.)
const getColumnLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

const SpreadsheetGrid = () => {
  const { 
    currentTable, 
    updateCell, 
    confirmCell, 
    addRow, 
    addColumn,
    canEditCell,
    canViewCell,
    setCellPermissions
  } = useData();
  const { user } = useAuth();
  
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newColumnName, setNewColumnName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmComment, setConfirmComment] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({
    admin: { viewable: true, editable: true },
    dp_team: { viewable: true, editable: true },
    qa_team: { viewable: true, editable: false }
  });
  const [activeTab, setActiveTab] = useState("spreadsheet");
  
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset editing state when table changes
    setEditingCell(null);
    setEditValue('');
  }, [currentTable?.id]);

  // Auto focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  if (!currentTable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <h2 className="text-2xl font-bold mb-4 text-medytox-red">No Spreadsheet Selected</h2>
        <p className="text-gray-600 mb-4">Please select or create a spreadsheet to get started</p>
      </div>
    );
  }

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    // Only allow editing if the user has permission
    if (canEditCell(rowIndex, colIndex)) {
      const value = currentTable.rows[rowIndex]?.[colIndex]?.value;
      setEditingCell({ row: rowIndex, col: colIndex });
      setEditValue(value !== null && value !== undefined ? String(value) : '');
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { row, col } = editingCell;
      
      // Parse the value based on potential type
      let parsedValue: CellValue = editValue;
      
      // Try to convert to number if it looks like a number
      if (!isNaN(Number(editValue)) && editValue.trim() !== '') {
        parsedValue = Number(editValue);
      } 
      // Convert to boolean if "true" or "false"
      else if (editValue.toLowerCase() === 'true') {
        parsedValue = true;
      } 
      else if (editValue.toLowerCase() === 'false') {
        parsedValue = false;
      }
      // Empty string becomes null
      else if (editValue === '') {
        parsedValue = null;
      }
      
      // Update the cell value
      const success = updateCell(row, col, parsedValue);
      
      if (success) {
        toast({
          title: "Updated",
          description: "Cell updated successfully"
        });
      }
      
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
      // Move to the next cell down
      if (editingCell && currentTable.rows.length > editingCell.row + 1) {
        handleCellClick(editingCell.row + 1, editingCell.col);
      }
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      // Move to the next cell right
      if (editingCell && currentTable.headers.length > editingCell.col + 1) {
        handleCellClick(editingCell.row, editingCell.col + 1);
      } else if (editingCell && currentTable.rows.length > editingCell.row + 1) {
        // Move to the first cell of the next row
        handleCellClick(editingCell.row + 1, 0);
      }
    }
    else if (e.key === 'Escape') {
      setEditingCell(null);
    }
    else if (e.key === 'ArrowDown') {
      if (!editingCell) return;
      handleCellBlur();
      if (currentTable.rows.length > editingCell.row + 1) {
        handleCellClick(editingCell.row + 1, editingCell.col);
      }
    }
    else if (e.key === 'ArrowUp') {
      if (!editingCell) return;
      handleCellBlur();
      if (editingCell.row > 0) {
        handleCellClick(editingCell.row - 1, editingCell.col);
      }
    }
    else if (e.key === 'ArrowRight') {
      if (!editingCell) return;
      handleCellBlur();
      if (currentTable.headers.length > editingCell.col + 1) {
        handleCellClick(editingCell.row, editingCell.col + 1);
      }
    }
    else if (e.key === 'ArrowLeft') {
      if (!editingCell) return;
      handleCellBlur();
      if (editingCell.col > 0) {
        handleCellClick(editingCell.row, editingCell.col - 1);
      }
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      addColumn(newColumnName);
      setNewColumnName('');
    } else {
      toast({
        title: "Error",
        description: "Column name cannot be empty",
        variant: "destructive"
      });
    }
  };

  const handleConfirmCell = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (selectedCell) {
      confirmCell(selectedCell.row, selectedCell.col, confirmComment);
      setConfirmOpen(false);
      setConfirmComment('');
    }
  };

  const openCellHistory = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setHistoryDialogOpen(true);
  };

  const openCellPermissions = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    
    // Get current permissions for the cell
    const cellPermissions = currentTable.rows[rowIndex]?.[colIndex]?.permissions;
    
    if (cellPermissions) {
      // Set initial state based on current permissions
      const initialRolePermissions = {
        admin: { 
          viewable: cellPermissions.roles.includes('admin') && cellPermissions.viewable, 
          editable: cellPermissions.roles.includes('admin') && cellPermissions.editable 
        },
        dp_team: { 
          viewable: cellPermissions.roles.includes('dp_team') && cellPermissions.viewable, 
          editable: cellPermissions.roles.includes('dp_team') && cellPermissions.editable 
        },
        qa_team: { 
          viewable: cellPermissions.roles.includes('qa_team') && cellPermissions.viewable, 
          editable: cellPermissions.roles.includes('qa_team') && cellPermissions.editable 
        }
      };
      
      setRolePermissions(initialRolePermissions);
    } else {
      // Default permissions
      setRolePermissions({
        admin: { viewable: true, editable: true },
        dp_team: { viewable: true, editable: true },
        qa_team: { viewable: true, editable: false }
      });
    }
    
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (selectedCell) {
      const roles: string[] = [];
      
      // Add roles that have any permission
      if (rolePermissions.admin.viewable || rolePermissions.admin.editable) {
        roles.push('admin');
      }
      if (rolePermissions.dp_team.viewable || rolePermissions.dp_team.editable) {
        roles.push('dp_team');
      }
      if (rolePermissions.qa_team.viewable || rolePermissions.qa_team.editable) {
        roles.push('qa_team');
      }
      
      // Determine overall editable/viewable status
      const editable = rolePermissions.admin.editable || 
                      rolePermissions.dp_team.editable || 
                      rolePermissions.qa_team.editable;
      
      const viewable = rolePermissions.admin.viewable || 
                       rolePermissions.dp_team.viewable || 
                       rolePermissions.qa_team.viewable;
      
      // Update cell permissions
      setCellPermissions(selectedCell.row, selectedCell.col, {
        roles,
        editable,
        viewable
      });
      
      setPermissionsDialogOpen(false);
    }
  };

  const getCellValue = (cell: Cell | undefined) => {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }
    return String(cell.value);
  };

  const getCellHistoryEntry = (rowIndex: number, colIndex: number) => {
    const cell = currentTable.rows[rowIndex]?.[colIndex];
    return cell?.history || [];
  };

  const handleExportToReport = () => {
    toast({
      title: "Success",
      description: "Generating report... Check Downloads folder"
    });
    toast({
      description: "Report includes spreadsheet data, control charts, and statistical analysis"
    });
  };

  return (
    <TooltipProvider>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2 text-medytox-red">{currentTable.name}</h2>
          
          <Tabs defaultValue="spreadsheet" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
              <TabsTrigger value="control-chart">Control Charts</TabsTrigger>
              <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
              <TabsTrigger value="report">Report Generation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spreadsheet">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">
                    {currentTable.rows.length} rows × {currentTable.headers.length} columns
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={addRow}
                    className="flex items-center gap-1 text-medytox-red border-medytox-red hover:bg-medytox-red/10"
                  >
                    <Plus className="h-4 w-4" /> Add Row
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-1 text-medytox-red border-medytox-red hover:bg-medytox-red/10"
                      >
                        <Plus className="h-4 w-4" /> Add Column
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Column</DialogTitle>
                        <DialogDescription>
                          Enter a name for the new column
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column Name"
                        className="mt-4"
                      />
                      <DialogFooter className="mt-4">
                        <Button onClick={handleAddColumn} className="bg-medytox-red hover:bg-medytox-red/80">Add Column</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="default"
                    className="flex items-center gap-1 bg-medytox-red hover:bg-medytox-red/80"
                    onClick={() => setActiveTab("report")}
                  >
                    <Save className="h-4 w-4" /> Generate Report
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-auto max-h-[70vh]" ref={gridRef}>
                <table className="w-full min-w-full divide-y divide-gray-200">
                  <thead className="bg-medytox-red text-white sticky top-0 z-10">
                    <tr>
                      {/* Corner cell */}
                      <th className="px-4 py-2 text-left w-10 border-r border-white/20"></th>
                      
                      {/* Column headers */}
                      {currentTable.headers.map((header, index) => (
                        <th key={index} className="px-4 py-2 text-left border-r border-white/20 min-w-[100px]">
                          <div className="flex items-center justify-between">
                            <div>{header}</div>
                            <div className="text-xs opacity-75">{getColumnLetter(index)}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {/* If the table has no rows, display a message */}
                    {currentTable.rows.length === 0 && (
                      <tr>
                        <td 
                          colSpan={currentTable.headers.length + 1} 
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No data yet. Click "Add Row" to get started.
                        </td>
                      </tr>
                    )}
                    
                    {/* Display the table rows */}
                    {currentTable.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {/* Row number */}
                        <td className="px-4 py-2 text-gray-500 font-medium border-r border-gray-200 sticky left-0 bg-gray-100">
                          {rowIndex + 1}
                        </td>
                        
                        {/* Row cells */}
                        {currentTable.headers.map((_, colIndex) => {
                          const cell = row[colIndex];
                          const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                          const canEdit = canEditCell(rowIndex, colIndex);
                          const canView = canViewCell(rowIndex, colIndex);
                          
                          if (!canView) {
                            return (
                              <td key={colIndex} className="px-4 py-2 border border-gray-200 bg-gray-100 text-gray-400">
                                <div className="flex items-center justify-center">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span className="ml-2">No Access</span>
                                </div>
                              </td>
                            );
                          }
                          
                          return (
                            <td 
                              key={colIndex} 
                              className={`px-4 py-2 border border-gray-200 relative min-w-[100px] ${
                                cell?.confirmed ? 'bg-green-50' : ''
                              } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                              onClick={() => handleCellClick(rowIndex, colIndex)}
                              data-row={rowIndex}
                              data-col={colIndex}
                            >
                              {isEditing ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className="border-0 p-0 focus:ring-0 h-8"
                                />
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>{getCellValue(cell)}</div>
                                  
                                  <div className="flex items-center">
                                    {/* Confirmed indicator */}
                                    {cell?.confirmed && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Confirmed by: {cell.confirmedBy}</p>
                                          <p>Date: {formatDateTime(cell.confirmedAt)}</p>
                                          {cell.confirmedComments && (
                                            <p>Comment: {cell.confirmedComments}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    
                                    {/* Locked indicator */}
                                    {!canEdit && canView && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Lock className="h-4 w-4 text-gray-400 ml-2" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          You don't have permission to edit this cell
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    
                                    {/* Cell actions menu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-gray-400">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Cell Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        
                                        {/* History action */}
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCellHistory(rowIndex, colIndex);
                                          }}
                                        >
                                          <History className="h-4 w-4 mr-2" />
                                          View History
                                        </DropdownMenuItem>
                                        
                                        {/* Permissions action (admin only) */}
                                        {user?.role === 'admin' && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openCellPermissions(rowIndex, colIndex);
                                            }}
                                          >
                                            <Users className="h-4 w-4 mr-2" />
                                            Set Permissions
                                          </DropdownMenuItem>
                                        )}
                                        
                                        {/* Confirm action (if user has permission) */}
                                        {user?.permissions.includes('confirm_data') && !cell?.confirmed && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConfirmCell(rowIndex, colIndex);
                                            }}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Confirm Cell
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="control-chart">
              <ControlChartPanel />
            </TabsContent>
            
            <TabsContent value="statistics">
              <StatisticsPanel />
            </TabsContent>
            
            <TabsContent value="report">
              <div className="p-6 border rounded-lg bg-white">
                <h3 className="text-xl font-medium mb-4">Generate Final Report</h3>
                <p className="text-gray-600 mb-6">
                  Generate a comprehensive report of all data, analysis results, and control charts. 
                  The report will include all confirmed data and analysis results.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2 flex items-center">
                      <ChartBar className="h-4 w-4 mr-2 text-medytox-red" /> Control Charts
                    </h4>
                    <p className="text-sm text-gray-600">
                      XBar-R charts and process capability analysis will be included 
                      in the report.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Calculator className="h-4 w-4 mr-2 text-medytox-red" /> Statistical Analysis
                    </h4>
                    <p className="text-sm text-gray-600">
                      Normality tests, basic statistics, and analysis results will be summarized.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleExportToReport} 
                  className="w-full bg-medytox-red hover:bg-medytox-red/80 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Generate Final FDA Audit Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Cell Confirm Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cell Data</DialogTitle>
              <DialogDescription>
                Confirming this data will lock it from future edits. This action is recorded in the audit trail.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                placeholder="Add optional comments about this confirmation"
                value={confirmComment}
                onChange={(e) => setConfirmComment(e.target.value)}
                className="w-full"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmSubmit} className="bg-medytox-red hover:bg-medytox-red/80">Confirm Cell</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Cell History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Cell Edit History</DialogTitle>
              <DialogDescription>
                View the history of changes made to this cell
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-80 overflow-y-auto">
              {selectedCell && (
                <div className="space-y-2">
                  {getCellHistoryEntry(selectedCell.row, selectedCell.col).length === 0 ? (
                    <p className="text-gray-500 py-4">No edit history available for this cell.</p>
                  ) : (
                    getCellHistoryEntry(selectedCell.row, selectedCell.col).map((entry, i) => (
                      <div key={i} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between">
                          <span className="font-medium">Previous Value:</span>
                          <span>{entry.value !== null && entry.value !== undefined ? String(entry.value) : '(empty)'}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Changed by: User ID {entry.userId} at {formatDateTime(entry.timestamp)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setHistoryDialogOpen(false)} className="bg-medytox-red hover:bg-medytox-red/80">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Cell Permissions Dialog */}
        <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cell Permissions</DialogTitle>
              <DialogDescription>
                Set which user roles can view or edit this cell
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 font-medium text-sm">
                <div>Role</div>
                <div>Can View</div>
                <div>Can Edit</div>
              </div>
              
              {/* Admin permissions */}
              <div className="grid grid-cols-3 items-center">
                <div>Admin</div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.admin.viewable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      admin: { ...rolePermissions.admin, viewable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.admin.editable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      admin: { ...rolePermissions.admin, editable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
              
              {/* DP Team permissions */}
              <div className="grid grid-cols-3 items-center">
                <div>DP Team</div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.dp_team.viewable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      dp_team: { ...rolePermissions.dp_team, viewable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.dp_team.editable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      dp_team: { ...rolePermissions.dp_team, editable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
              
              {/* QA Team permissions */}
              <div className="grid grid-cols-3 items-center">
                <div>QA Team</div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.qa_team.viewable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      qa_team: { ...rolePermissions.qa_team, viewable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={rolePermissions.qa_team.editable} 
                    onChange={(e) => setRolePermissions({
                      ...rolePermissions,
                      qa_team: { ...rolePermissions.qa_team, editable: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePermissions} className="bg-medytox-red hover:bg-medytox-red/80">Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default SpreadsheetGrid;
