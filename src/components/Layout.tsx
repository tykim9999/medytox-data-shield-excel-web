
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet,
  LogOut,
  Settings,
  User,
  FileDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return children;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-medytox-red text-white transition-all duration-300 ease-in-out flex flex-col z-20 shadow-lg fixed h-full`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center">
          <div className={`${sidebarOpen ? "text-xl" : "text-sm"} font-bold text-white`}>
            {sidebarOpen ? "Medytox DataShield" : "MDX"}
          </div>
        </div>

        <Separator className="bg-white/20" />

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-2">
          <TooltipProvider>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-white hover:bg-white/10"
                    >
                      <FileSpreadsheet className="mr-2 h-5 w-5" />
                      {sidebarOpen && <span>Spreadsheets</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    Spreadsheets
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/audit">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-white hover:bg-white/10"
                    >
                      <AlertCircle className="mr-2 h-5 w-5" />
                      {sidebarOpen && <span>Audit Trail</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    Audit Trail
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/export">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-white hover:bg-white/10"
                    >
                      <FileDown className="mr-2 h-5 w-5" />
                      {sidebarOpen && <span>Export</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    Export
                  </TooltipContent>
                )}
              </Tooltip>

              {user.role === 'admin' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/settings">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-white/10"
                      >
                        <Settings className="mr-2 h-5 w-5" />
                        {sidebarOpen && <span>Settings</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      Settings
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </nav>

        <div className="p-4">
          <Separator className="bg-white/20 mb-4" />
          <div className="flex items-center justify-between">
            <div className={`${!sidebarOpen && "hidden"} flex items-center`}>
              <User className="h-5 w-5 mr-2" />
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs opacity-70 capitalize">{user.role}</p>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={logout}
                    className="text-white hover:bg-white/10"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Log out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Toggle button */}
        <div className="p-4">
          <Button 
            variant="outline" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            {sidebarOpen ? (
              <div className="flex items-center justify-center w-full">
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </div>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div 
        className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
