
import SpreadsheetGrid from "@/components/spreadsheet/SpreadsheetGrid";
import TableList from "@/components/spreadsheet/TableList";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FilePlus } from "lucide-react";

const Spreadsheet = () => {
  const { currentTable } = useData();

  return (
    <div className="container mx-auto p-4">
      {currentTable ? (
        <>
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Spreadsheet List
            </Button>
          </div>
          <SpreadsheetGrid />
        </>
      ) : (
        <TableList />
      )}
    </div>
  );
};

export default Spreadsheet;
