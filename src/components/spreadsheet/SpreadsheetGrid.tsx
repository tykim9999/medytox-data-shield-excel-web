
import { useState, useEffect } from 'react';
import { useData, type Cell, type CellValue } from '@/contexts/DataContext';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, MoreHorizontal, Plus, Shield, History, Lock } from 'lucide-react';
import { toast } from 'sonner';

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

const SpreadsheetGrid = () => {
  const { 
    currentTable, 
    updateCell, 
    confirmCell, 
    addRow, 
    addColumn,
    canEditCell,
    canViewCell
  } = useData();
  const { user } = useAuth();
  
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newColumnName, setNewColumnName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmComment, setConfirmComment] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    // Reset editing state when table changes
    setEditingCell(null);
    setEditValue('');
  }, [currentTable?.id]);

  if (!currentTable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <h2 className="text-2xl font-bold mb-4">No Spreadsheet Selected</h2>
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
        toast.success("Cell updated successfully");
      }
      
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    }
    else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      addColumn(newColumnName);
      setNewColumnName('');
    } else {
      toast.error("Column name cannot be empty");
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

  const getCellValue = (cell: Cell | undefined) => {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }
    return String(cell.value);
  };

  const getCellHistoryEntry = (rowIndex: number, colIndex: number) => {
    return currentTable.rows[rowIndex]?.[colIndex]?.history || [];
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{currentTable.name}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={addRow}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Row
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="flex items-center gap-1"
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
                <Button onClick={handleAddColumn}>Add Column</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-medytox-blue text-white">
            <tr>
              {/* Row number header */}
              <th className="px-4 py-2 text-left w-14">#</th>
              
              {/* Column headers */}
              {currentTable.headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left">{header}</th>
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
                <td className="px-4 py-2 text-gray-500 font-medium border-r border-gray-200">
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
                      className={`px-4 py-2 border border-gray-200 relative ${
                        cell?.confirmed ? 'bg-green-50' : ''
                      } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      onClick={() => canEdit && handleCellClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <Input
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
                              <TooltipProvider>
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
                              </TooltipProvider>
                            )}
                            
                            {/* Locked indicator */}
                            {!canEdit && canView && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Lock className="h-4 w-4 text-gray-400 ml-2" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    You don't have permission to edit this cell
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
            <Button onClick={handleConfirmSubmit}>Confirm Cell</Button>
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
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpreadsheetGrid;
