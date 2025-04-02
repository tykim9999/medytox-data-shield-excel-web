
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileSpreadsheet } from 'lucide-react';

const TableList = () => {
  const { tables, selectTable, createTable } = useData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [columnInputs, setColumnInputs] = useState<string[]>(['']);

  const handleAddColumn = () => {
    setColumnInputs([...columnInputs, '']);
  };

  const handleColumnChange = (index: number, value: string) => {
    const updatedInputs = [...columnInputs];
    updatedInputs[index] = value;
    setColumnInputs(updatedInputs);
  };

  const handleRemoveColumn = (index: number) => {
    const updatedInputs = [...columnInputs];
    updatedInputs.splice(index, 1);
    setColumnInputs(updatedInputs);
  };

  const handleCreateTable = () => {
    // Filter out empty column names
    const validColumns = columnInputs.filter(col => col.trim() !== '');
    
    if (newTableName.trim() === '') {
      return;
    }

    if (validColumns.length === 0) {
      return;
    }

    createTable(newTableName, validColumns);
    
    // Reset form
    setNewTableName('');
    setColumnInputs(['']);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Spreadsheets</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Spreadsheet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Spreadsheet</DialogTitle>
              <DialogDescription>
                Enter a name and define the columns for your new spreadsheet
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="table-name" className="text-sm font-medium">
                  Spreadsheet Name
                </label>
                <Input
                  id="table-name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="My Spreadsheet"
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Columns (at least one is required)
                </label>
                
                {columnInputs.map((col, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={col}
                      onChange={(e) => handleColumnChange(index, e.target.value)}
                      placeholder={`Column ${index + 1}`}
                    />
                    {columnInputs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveColumn(index)}
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleAddColumn}
                  className="mt-2"
                >
                  Add Another Column
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleCreateTable}>
                Create Spreadsheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.length === 0 ? (
          <Card className="col-span-full bg-gray-50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center h-40">
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500 mb-4">No spreadsheets yet</p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Spreadsheet
              </Button>
            </CardContent>
          </Card>
        ) : (
          tables.map((table) => (
            <Card 
              key={table.id} 
              className="cursor-pointer hover:border-medytox-blue transition-all"
              onClick={() => selectTable(table.id)}
            >
              <CardHeader>
                <CardTitle>{table.name}</CardTitle>
                <CardDescription>
                  Version {table.version} • {table.headers.length} columns • {table.rows.length} rows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    {table.confirmed ? (
                      <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TableList;
