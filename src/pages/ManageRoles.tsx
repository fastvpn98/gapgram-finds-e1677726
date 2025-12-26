import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Shield, Users } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface UserWithRole {
  id: string;
  user_id: string;
  role: UserRole;
  email?: string;
  display_name?: string;
  created_at: string;
}

export default function ManageRoles() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("moderator");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (!roleLoading && !isAdmin) {
      navigate("/");
      toast({
        title: "دسترسی محدود",
        description: "فقط مدیران می‌توانند نقش‌ها را مدیریت کنند",
        variant: "destructive",
      });
      return;
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for display names
      const userIds = data.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const usersWithDetails = data.map(u => ({
        ...u,
        display_name: profiles?.find(p => p.user_id === u.user_id)?.display_name || "کاربر",
        role: u.role as UserRole,
      }));

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "خطا",
        description: "خطا در دریافت لیست کاربران",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addUserRole = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      // Use the database function to get user id by email
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', { email_input: newEmail.trim() } as any);

      if (userError || !userId) {
        toast({
          title: "خطا",
          description: "کاربر با این ایمیل یافت نشد. کاربر باید ابتدا وارد سایت شود.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert([{
          user_id: userId as string,
          role: newRole,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "خطا",
            description: "این کاربر قبلاً این نقش را دارد",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "موفق",
        description: `نقش ${newRole === 'admin' ? 'مدیر' : 'ناظر'} با موفقیت اضافه شد`,
      });
      
      setNewEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "خطا",
        description: "خطا در اضافه کردن نقش. کاربر باید ابتدا وارد سایت شود.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeUserRole = async (roleId: string, userId: string) => {
    // Prevent removing own admin role
    if (userId === user?.id) {
      toast({
        title: "خطا",
        description: "نمی‌توانید نقش خود را حذف کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "نقش کاربر با موفقیت حذف شد",
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "خطا",
        description: "خطا در حذف نقش",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">مدیر</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">ناظر</Badge>;
      default:
        return <Badge variant="secondary">کاربر</Badge>;
    }
  };

  if (authLoading || roleLoading) {
    return (
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="flex-1 container py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          مدیریت نقش‌ها
        </h1>
        <p className="text-muted-foreground mt-2">
          اضافه کردن و مدیریت مدیران و ناظران سایت
        </p>
      </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Add New Role */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                افزودن نقش جدید
              </CardTitle>
              <CardDescription>
                کاربر باید قبلاً وارد سایت شده باشد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل کاربر</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>نقش</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">ناظر (تأیید آگهی)</SelectItem>
                    <SelectItem value="admin">مدیر (دسترسی کامل)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addUserRole} disabled={adding} className="w-full">
                {adding ? "در حال افزودن..." : "افزودن نقش"}
              </Button>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                لیست کاربران با نقش
              </CardTitle>
              <CardDescription>
                {users.length} کاربر با نقش ویژه
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  هیچ کاربری با نقش ویژه یافت نشد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>تاریخ افزودن</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.display_name}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          {u.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUserRole(u.id, u.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
    </main>
  );
}