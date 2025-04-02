import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAudit } from './AuditContext';
import { toast } from 'sonner';

// Define cell data types
export type CellValue = string | number | boolean | null;

export type CellHistoryEntry = {
  value: CellValue;
  timestamp: Date;
  userId: string;
};

export type CellPermissions = {
  roles: string[];
  editable: boolean;
  viewable: boolean;
};

export type Cell = {
  value: CellValue;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;
  confirmedComments?: string;
  permissions?: CellPermissions;
  history: CellHistoryEntry[];
};

// Define table data type
export type TableData = {
  id: string;
  name: string;
  headers: string[];
  rows: Cell[][];
  confirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;
  confirmedComments?: string;
  version: number;
};

// Define the Data context type
interface DataContextType {
  tables: TableData[];
  currentTable: TableData | null;
  createTable: (name: string, headers: string[], initialRows?: number) => void;
  selectTable: (id: string) => void;
  updateCell: (rowIndex: number, colIndex: number, value: CellValue) => boolean;
  confirmCell: (rowIndex: number, colIndex: number, comments?: string) => void;
  confirmTable: (comments?: string) => void;
  exportTableToPDF: () => void;
  addRow: () => void;
  addColumn: (header: string) => void;
  setCellPermissions: (rowIndex: number, colIndex: number, permissions: CellPermissions) => void;
  canEditCell: (rowIndex: number, colIndex: number) => boolean;
  canViewCell: (rowIndex: number, colIndex: number) => boolean;
}

// Create the Data context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Data provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const { user } = useAuth();
  const { addLog } = useAudit();

  // Get the currently selected table
  const currentTable = tables.find(table => table.id === currentTableId) || null;

  // Create a new table
  const createTable = (name: string, headers: string[], initialRows: number = 10) => {
    if (!user) return;

    // Create empty rows with the specified number of initial rows
    const emptyRows: Cell[][] = Array.from({ length: initialRows }, () => 
      headers.map(() => ({
        value: null,
        confirmed: false,
        history: []
      }))
    );

    // Assign some default permissions based on column for demo purposes
    // This simulates a scenario where different columns have different access roles in Medytox
    const rows = emptyRows.map(row => 
      row.map((cell, colIndex) => ({
        ...cell,
        permissions: colIndex % 3 === 0 ? 
          { roles: ['admin', 'dp_team'], editable: true, viewable: true } : 
          colIndex % 3 === 1 ?
            { roles: ['admin', 'dp_team', 'qa_team'], editable: true, viewable: true } :
            { roles: ['admin', 'qa_team'], editable: false, viewable: true }
      }))
    );

    const newTable: TableData = {
      id: crypto.randomUUID(),
      name,
      headers,
      rows,
      confirmed: false,
      version: 1
    };

    setTables([...tables, newTable]);
    setCurrentTableId(newTable.id);

    addLog('create', 'table', `Created new table: ${name}`);
    toast.success(`Table "${name}" created successfully with ${initialRows} empty rows`);
  };
  
  // Select a table
  const selectTable = (id: string) => {
    const table = tables.find(table => table.id === id);
    if (table) {
      setCurrentTableId(id);
      addLog('read', 'table', `Selected table: ${table.name}`);
    }
  };

  // Update a cell's value
  const updateCell = (rowIndex: number, colIndex: number, value: CellValue): boolean => {
    if (!currentTable || !user) return false;

    // Check if user can edit this cell
    if (!canEditCell(rowIndex, colIndex)) {
      toast.error("You don't have permission to edit this cell");
      return false;
    }

    // Check if the cell is confirmed and not allowed to be edited
    const cell = currentTable.rows[rowIndex]?.[colIndex];
    if (cell?.confirmed) {
      toast.error("This cell is confirmed and cannot be edited");
      return false;
    }

    // Create a new rows array with the updated cell
    const updatedRows = [...currentTable.rows];
    
    // Ensure the row exists
    if (!updatedRows[rowIndex]) {
      // Initialize empty rows up to rowIndex
      while (updatedRows.length <= rowIndex) {
        updatedRows.push(Array(currentTable.headers.length).fill(null).map(() => ({
          value: null,
          confirmed: false,
          history: []
        })));
      }
    }
    
    // Get the current cell or create a new one
    const currentCell = updatedRows[rowIndex][colIndex] || {
      value: null,
      confirmed: false,
      history: []
    };
    
    // Create history entry for the previous value
    const historyEntry: CellHistoryEntry = {
      value: currentCell.value,
      timestamp: new Date(),
      userId: user.id
    };
    
    // Update the cell
    updatedRows[rowIndex][colIndex] = {
      ...currentCell,
      value,
      history: [...(currentCell.history || []), historyEntry]
    };
    
    // Update the tables state
    setTables(
      tables.map(table => 
        table.id === currentTableId 
          ? { ...table, rows: updatedRows }
          : table
      )
    );
    
    // Add audit log
    addLog(
      'update',
      'cell',
      `Updated cell at [${rowIndex},${colIndex}] in table "${currentTable.name}" from ${JSON.stringify(currentCell.value)} to ${JSON.stringify(value)}`
    );
    
    return true;
  };

  // Confirm a cell
  const confirmCell = (rowIndex: number, colIndex: number, comments?: string) => {
    if (!currentTable || !user) return;
    
    // Check if user has permission to confirm data
    if (!user.permissions.includes('confirm_data')) {
      toast.error("You don't have permission to confirm data");
      return;
    }
    
    // Update the cell's confirmed status
    const updatedRows = [...currentTable.rows];
    const currentCell = updatedRows[rowIndex][colIndex];
    
    if (currentCell) {
      updatedRows[rowIndex][colIndex] = {
        ...currentCell,
        confirmed: true,
        confirmedBy: user.id,
        confirmedAt: new Date(),
        confirmedComments: comments
      };
      
      // Update the tables state
      setTables(
        tables.map(table => 
          table.id === currentTableId 
            ? { ...table, rows: updatedRows }
            : table
        )
      );
      
      // Add audit log
      addLog(
        'confirm',
        'cell',
        `Confirmed cell at [${rowIndex},${colIndex}] in table "${currentTable.name}"`
      );
      
      toast.success("Cell confirmed successfully");
    }
  };

  // Confirm an entire table
  const confirmTable = (comments?: string) => {
    if (!currentTable || !user) return;
    
    // Check if user has permission to confirm data
    if (!user.permissions.includes('confirm_data')) {
      toast.error("You don't have permission to confirm data");
      return;
    }
    
    // Update the table's confirmed status and increment version
    const updatedTable: TableData = {
      ...currentTable,
      confirmed: true,
      confirmedBy: user.id,
      confirmedAt: new Date(),
      confirmedComments: comments,
      version: currentTable.version + 1
    };
    
    // Update the tables state
    setTables(
      tables.map(table => 
        table.id === currentTableId ? updatedTable : table
      )
    );
    
    // Add audit log
    addLog(
      'confirm',
      'table',
      `Confirmed table "${currentTable.name}" (version ${updatedTable.version})`
    );
    
    toast.success(`Table confirmed successfully (version ${updatedTable.version})`);
  };

  // Export the current table to PDF
  const exportTableToPDF = () => {
    if (!currentTable) return;
    
    // In a real implementation, this would generate a PDF file
    // For now, we'll just add an audit log and display a toast
    
    addLog(
      'export',
      'pdf',
      `Exported table "${currentTable.name}" to PDF`
    );
    
    toast.success("PDF export initiated. Check downloads folder.");
    toast.info("In a real app, this would generate a PDF with proper headers, footers, and signatures.");
  };

  // Add a new row to the current table
  const addRow = () => {
    if (!currentTable || !user) return;
    
    // Create a new empty row
    const newRow: Cell[] = Array(currentTable.headers.length).fill(null).map(() => ({
      value: null,
      confirmed: false,
      history: []
    }));
    
    // Add the row to the table
    const updatedRows = [...currentTable.rows, newRow];
    
    // Update the tables state
    setTables(
      tables.map(table => 
        table.id === currentTableId 
          ? { ...table, rows: updatedRows }
          : table
      )
    );
    
    // Add audit log
    addLog(
      'create',
      'row',
      `Added new row to table "${currentTable.name}"`
    );
  };

  // Add a new column to the current table
  const addColumn = (header: string) => {
    if (!currentTable || !user) return;
    
    // Add the header
    const updatedHeaders = [...currentTable.headers, header];
    
    // Add a null cell to each row
    const updatedRows = currentTable.rows.map(row => [
      ...row,
      {
        value: null,
        confirmed: false,
        history: []
      }
    ]);
    
    // Update the tables state
    setTables(
      tables.map(table => 
        table.id === currentTableId 
          ? { ...table, headers: updatedHeaders, rows: updatedRows }
          : table
      )
    );
    
    // Add audit log
    addLog(
      'create',
      'column',
      `Added new column "${header}" to table "${currentTable.name}"`
    );
    
    toast.success(`Column "${header}" added successfully`);
  };

  // Set permissions for a cell
  const setCellPermissions = (rowIndex: number, colIndex: number, permissions: CellPermissions) => {
    if (!currentTable || !user) return;
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      toast.error("Only admins can set cell permissions");
      return;
    }
    
    // Update the cell's permissions
    const updatedRows = [...currentTable.rows];
    const currentCell = updatedRows[rowIndex][colIndex];
    
    if (currentCell) {
      updatedRows[rowIndex][colIndex] = {
        ...currentCell,
        permissions
      };
      
      // Update the tables state
      setTables(
        tables.map(table => 
          table.id === currentTableId 
            ? { ...table, rows: updatedRows }
            : table
        )
      );
      
      // Add audit log
      addLog(
        'update',
        'permissions',
        `Updated permissions for cell at [${rowIndex},${colIndex}] in table "${currentTable.name}"`
      );
      
      toast.success("Cell permissions updated successfully");
    }
  };

  // Check if the current user can edit a specific cell
  const canEditCell = (rowIndex: number, colIndex: number): boolean => {
    if (!currentTable || !user) return false;
    
    // Admins can edit anything
    if (user.role === 'admin') return true;
    
    // Get the cell
    const cell = currentTable.rows[rowIndex]?.[colIndex];
    if (!cell) return true; // New cells can be edited
    
    // If the cell has specific permissions, check them
    if (cell.permissions) {
      // Check if user's role is in the allowed roles and if editable is true
      return cell.permissions.roles.includes(user.role) && cell.permissions.editable;
    }
    
    // Default: DP team can edit, QA team can only view
    return user.role === 'dp_team';
  };

  // Check if the current user can view a specific cell
  const canViewCell = (rowIndex: number, colIndex: number): boolean => {
    if (!currentTable || !user) return false;
    
    // Admins can view anything
    if (user.role === 'admin') return true;
    
    // Get the cell
    const cell = currentTable.rows[rowIndex]?.[colIndex];
    if (!cell) return true;
    
    // If the cell has specific permissions, check them
    if (cell.permissions) {
      // Check if user's role is in the allowed roles and if viewable is true
      return cell.permissions.roles.includes(user.role) && cell.permissions.viewable;
    }
    
    // Default: all authenticated users can view
    return true;
  };

  return (
    <DataContext.Provider value={{ 
      tables, 
      currentTable, 
      createTable, 
      selectTable, 
      updateCell,
      confirmCell,
      confirmTable,
      exportTableToPDF,
      addRow,
      addColumn,
      setCellPermissions,
      canEditCell,
      canViewCell
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using the Data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
