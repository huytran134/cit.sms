import { PrismaClient, FeeCycle, ClassType, SystemRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── 1. User Admin ────────────────────────────────────────────────────────
  const adminEmail = "admin@citedu.vn";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser: { id: string };

  const adminPasswordHash = await bcrypt.hash("CitEdu@2026", 10);
  console.log("Seeded Admin - Hash length:", adminPasswordHash.length);

  if (!existingAdmin) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        fullName: "Quản lý Hệ thống",
        phone: "0977879508",
        isActive: true,
      },
    });
    console.log("✅ Tạo Admin user:", adminEmail);
  } else {
    // Force update password hash để đảm bảo 100% đúng
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: adminPasswordHash, isActive: true },
    });
    console.log("✅ Reset mật khẩu Admin user:", adminEmail);
  }

  // ─── 2. UserSystemRole: gán ADMIN ─────────────────────────────────────────
  await prisma.userSystemRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: SystemRole.ADMIN,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: SystemRole.ADMIN,
      role: SystemRole.ADMIN,
    },
  });
  console.log("✅ Gán role ADMIN cho user:", adminEmail);

  // ─── 3. User CNL (Chủ nhiệm lớp) ─────────────────────────────────────────
  const cnlEmail = "cnl001@citedu.vn";
  const cnlPhone = "0912345678";
  const existingCnl = await prisma.user.findFirst({
    where: { OR: [{ email: cnlEmail }, { phone: cnlPhone }] },
  });

  let cnlUser: { id: string };

  const cnlPasswordHash = await bcrypt.hash("cnl@2026", 10);
  console.log("Seeded CNL - Hash length:", cnlPasswordHash.length);

  if (!existingCnl) {
    cnlUser = await prisma.user.create({
      data: {
        email: cnlEmail,
        passwordHash: cnlPasswordHash,
        fullName: "Chủ nhiệm lớp 01",
        phone: cnlPhone,
        isActive: true,
      },
    });
    console.log("✅ Tạo CNL user:", cnlEmail);
  } else {
    // Force update password hash để đảm bảo 100% đúng
    cnlUser = await prisma.user.update({
      where: { id: existingCnl.id },
      data: { passwordHash: cnlPasswordHash, isActive: true },
    });
    console.log("✅ Reset mật khẩu CNL user:", cnlEmail);
  }

  // ─── 4. UserSystemRole: gán CLASS_LEADER ──────────────────────────────────
  await prisma.userSystemRole.upsert({
    where: {
      userId_roleId: {
        userId: cnlUser.id,
        roleId: SystemRole.CLASS_LEADER,
      },
    },
    update: {},
    create: {
      userId: cnlUser.id,
      roleId: SystemRole.CLASS_LEADER,
      role: SystemRole.CLASS_LEADER,
    },
  });
  console.log("✅ Gán role CLASS_LEADER cho user:", cnlEmail);

  // ─── 4b. User CNL002 ──────────────────────────────────────────────────────
  const cnl2Email = "cnl002@citedu.vn";
  const cnl2Phone = "0923456789";
  const existingCnl2 = await prisma.user.findFirst({
    where: { OR: [{ email: cnl2Email }, { phone: cnl2Phone }] },
  });

  let cnl2User: { id: string };

  const cnl2PasswordHash = await bcrypt.hash("cnl@2026", 10);

  if (!existingCnl2) {
    cnl2User = await prisma.user.create({
      data: {
        email: cnl2Email,
        passwordHash: cnl2PasswordHash,
        fullName: "Chủ nhiệm lớp 02",
        phone: cnl2Phone,
        isActive: true,
      },
    });
    console.log("✅ Tạo CNL002 user:", cnl2Email);
  } else {
    cnl2User = await prisma.user.update({
      where: { id: existingCnl2.id },
      data: { passwordHash: cnl2PasswordHash, isActive: true },
    });
    console.log("✅ Reset mật khẩu CNL002 user:", cnl2Email);
  }

  await prisma.userSystemRole.upsert({
    where: {
      userId_roleId: {
        userId: cnl2User.id,
        roleId: SystemRole.CLASS_LEADER,
      },
    },
    update: {},
    create: {
      userId: cnl2User.id,
      roleId: SystemRole.CLASS_LEADER,
      role: SystemRole.CLASS_LEADER,
    },
  });
  console.log("✅ Gán role CLASS_LEADER cho user:", cnl2Email);

  // ─── 5. Branches (Chi nhánh mẫu) ──────────────────────────────────────────
  const branches = [
    { name: "Cơ sở 01", address: "Hà Nội" },
    { name: "Cơ sở 02", address: "Hà Nội" },
  ];

  for (const branch of branches) {
    const existing = await prisma.branch.findFirst({
      where: { name: branch.name },
    });
    if (!existing) {
      await prisma.branch.create({ data: branch });
      console.log("✅ Tạo branch:", branch.name);
    } else {
      console.log("⏭️  Branch đã tồn tại, bỏ qua:", branch.name);
    }
  }

  // ─── 6. Programs (Chương trình mẫu) ───────────────────────────────────────
  const programs: Array<{
    code: string;
    name: string;
    branch: string;
    tuitionFee: number;
    feeCycle: FeeCycle;
    type: ClassType;
  }> = [
    {
      code: "TDTD",
      name: "Tư duy Thành Đạt",
      branch: "thinking",
      tuitionFee: 4800000,
      feeCycle: FeeCycle.COURSE,
      type: ClassType.REGULAR,
    },
    {
      code: "TDDP",
      name: "Tư duy Đột Phá",
      branch: "thinking",
      tuitionFee: 4800000,
      feeCycle: FeeCycle.COURSE,
      type: ClassType.REGULAR,
    },
    {
      code: "MAT_THAT",
      name: "Mật Thất",
      branch: "mentoring",
      tuitionFee: 20000000,
      feeCycle: FeeCycle.YEAR,
      type: ClassType.MENTORING,
    },
  ];

  for (const program of programs) {
    await prisma.program.upsert({
      where: { code: program.code },
      update: {},
      create: program,
    });
    console.log("✅ Upsert program:", program.code, "-", program.name);
  }

  // ─── 7. Lớp học mẫu (Class) ───────────────────────────────────────────────
  const tdtdProgram = await prisma.program.findUnique({ where: { code: "TDTD" } });
  const branch01 = await prisma.branch.findFirst({ where: { name: "Cơ sở 01" } });

  if (!tdtdProgram || !branch01) {
    console.error("❌ Không tìm thấy Program TDTD hoặc Branch 'Cơ sở 01'");
    process.exit(1);
  }

  // YearCode: 2026 - 2009 = 17 → "17"
  const sampleClassCode = "TDTD_17.1";
  const existingClass = await prisma.class.findUnique({
    where: { classCode: sampleClassCode },
  });

  let sampleClass: { id: string };

  if (!existingClass) {
    sampleClass = await prisma.class.create({
      data: {
        classCode: sampleClassCode,
        name: "Tư duy Thành Đạt 17.1",
        programId: tdtdProgram.id,
        branchId: branch01.id,
        tuitionFee: tdtdProgram.tuitionFee,
        capacityMax: 30,
      },
    });
    console.log("✅ Tạo lớp mẫu:", sampleClassCode);
  } else {
    sampleClass = existingClass;
    console.log("⏭️  Lớp mẫu đã tồn tại, bỏ qua:", sampleClassCode);
  }

  // ─── 8. ClassStaff: gán CNL vào lớp mẫu ──────────────────────────────────
  const existingStaff = await prisma.classStaff.findFirst({
    where: {
      classId: sampleClass.id,
      userId: cnlUser.id,
      role: "class_leader",
    },
  });

  if (!existingStaff) {
    await prisma.classStaff.create({
      data: {
        classId: sampleClass.id,
        userId: cnlUser.id,
        role: "class_leader",
      },
    });
    console.log("✅ Gán CNL vào lớp:", sampleClassCode);
  } else {
    console.log("⏭️  CNL đã trong lớp, bỏ qua:", sampleClassCode);
  }

  console.log("\n✅ Seed data completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
