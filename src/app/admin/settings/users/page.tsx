import React from "react";
import { fetchStaffUsersAction } from "@/lib/actions/user";
import { CreateStaffForm } from "@/components/settings/create-staff-form";
import { UserManagementTable } from "@/components/settings/user-management-table";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

export default async function UsersSettingsPage() {
  const users = await fetchStaffUsersAction();
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary rounded-xl shadow-sm shadow-primary/25">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Quản lý nhân sự</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tạo và quản lý tài khoản cho đội ngũ nhân sự CiT EDU.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tổng tài khoản</p>
                <p className="text-xl font-black text-foreground">{users.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950/40 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Đang hoạt động</p>
                <p className="text-xl font-black text-green-600 dark:text-green-400">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border col-span-2 md:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <UserX className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vô hiệu hóa</p>
                <p className="text-xl font-black text-destructive">{users.length - activeCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Form */}
        <CreateStaffForm />

        {/* Staff List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Danh sách tài khoản ({users.length})
          </h2>
          <UserManagementTable users={users} />
        </div>

      </div>
    </main>
  );
}
