
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, UserCheck } from "lucide-react";
import { toast } from 'sonner';

const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@medytox.com',
    role: 'admin',
    lastActive: '2 minutes ago'
  },
  {
    id: '2',
    name: 'DP Team Member',
    email: 'dp@medytox.com',
    role: 'dp_team',
    lastActive: '4 hours ago'
  },
  {
    id: '3',
    name: 'QA Team Member',
    email: 'qa@medytox.com',
    role: 'qa_team',
    lastActive: '1 day ago'
  },
  {
    id: '4',
    name: 'Viewer',
    email: 'viewer@medytox.com',
    role: 'viewer',
    lastActive: '3 days ago'
  }
];

const rolePermissions = {
  admin: ['manage_users', 'edit_all', 'view_all', 'confirm_data', 'export_data'],
  dp_team: ['edit_data', 'view_all', 'confirm_data', 'export_data'],
  qa_team: ['view_all', 'confirm_data', 'export_data'],
  viewer: ['view_all']
};

const Settings = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-500">
            You don't have permission to access settings. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and access permissions
                </CardDescription>
              </div>
              <Button onClick={() => toast.info("User management functionality would be implemented here")} size="sm">
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.lastActive}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toast.info(`Edit user: ${user.name}`)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Role Permissions
              </CardTitle>
              <CardDescription>
                Default permissions for each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="space-y-2">
                    <h3 className="font-semibold capitalize">
                      {role.replace('_', ' ')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(perm => (
                        <Badge key={perm} variant="outline">
                          {perm.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd>Medytox DataShield 1.0.0</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Backup</dt>
                  <dd>Today, 03:00 AM</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Storage</dt>
                  <dd>12 MB used (of 5 GB)</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
