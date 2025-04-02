
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

// Define the audit log entry type
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'confirm';
  resource: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

// Define the Audit context type
interface AuditContextType {
  logs: AuditLogEntry[];
  addLog: (
    actionType: AuditLogEntry['actionType'],
    resource: string,
    details: string
  ) => void;
  getLogsByUser: (userId: string) => AuditLogEntry[];
  getLogsByAction: (actionType: AuditLogEntry['actionType']) => AuditLogEntry[];
  getLogsByResource: (resource: string) => AuditLogEntry[];
  clearLogs: () => void;
  exportLogs: () => void;
}

// Create the Audit context
const AuditContext = createContext<AuditContextType | undefined>(undefined);

// Audit provider component
export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const { user } = useAuth();

  // Add a new audit log entry
  const addLog = (
    actionType: AuditLogEntry['actionType'],
    resource: string,
    details: string
  ) => {
    if (!user) return;

    const newLog: AuditLogEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      actionType,
      resource,
      details,
      timestamp: new Date(),
      ipAddress: '127.0.0.1' // In a real app, you would get the actual IP
    };

    setLogs(prevLogs => [...prevLogs, newLog]);
    
    // In a real app, you would also send this to a backend for permanent storage
    console.log('Audit log created:', newLog);
  };

  // Get logs by user ID
  const getLogsByUser = (userId: string) => {
    return logs.filter(log => log.userId === userId);
  };

  // Get logs by action type
  const getLogsByAction = (actionType: AuditLogEntry['actionType']) => {
    return logs.filter(log => log.actionType === actionType);
  };

  // Get logs by resource
  const getLogsByResource = (resource: string) => {
    return logs.filter(log => log.resource === resource);
  };

  // Clear all logs (for admin use only)
  const clearLogs = () => {
    setLogs([]);
  };

  // Export logs to CSV
  const exportLogs = () => {
    // Convert logs to CSV format
    const csvContent = [
      'ID,User ID,User Name,Role,Action Type,Resource,Details,Timestamp,IP Address',
      ...logs.map(log => 
        `${log.id},${log.userId},${log.userName},${log.userRole},${log.actionType},${log.resource},"${log.details}",${log.timestamp.toISOString()},${log.ipAddress}`
      )
    ].join('\n');

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    a.click();
  };

  return (
    <AuditContext.Provider value={{ 
      logs, 
      addLog, 
      getLogsByUser, 
      getLogsByAction, 
      getLogsByResource, 
      clearLogs,
      exportLogs
    }}>
      {children}
    </AuditContext.Provider>
  );
};

// Custom hook for using the Audit context
export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
