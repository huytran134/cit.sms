import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SystemRole } from "@prisma/client";
import { purgeAllBusinessData } from "@/lib/actions/system";

// GET để Admin có thể truy cập trực tiếp qua trình duyệt (protected by session auth).
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const roles = (session.user as { roles?: SystemRole[] }).roles ?? [];
  if (!roles.includes(SystemRole.ADMIN)) {
    return NextResponse.json(
      { error: "Chỉ Admin mới có quyền thực hiện thao tác này." },
      { status: 403 }
    );
  }

  const result = await purgeAllBusinessData();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
