"use server";

import { prisma } from "@/lib/db";
import {
  ReceiptStatus, DebtStatus, LeadStatus,
  StudentStatus, ClassStatus, AttendanceStatus
} from "@prisma/client";
import { getSessionForAction } from "@/lib/auth/session";
import { startOfWeek, endOfWeek } from "date-fns";

export async function fetchStaffDashboardData() {
  const session = await getSessionForAction();
  if (!session) return null;

  const userId = session.user.id;

  const [leadStats, staffClasses] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { assignedToId: userId },
      _count: { _all: true },
    }),
    prisma.class.findMany({
      where: { staff: { some: { userId } } },
      select: {
        id: true,
        classCode: true,
        name: true,
        status: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const statsMap = leadStats.reduce((acc: Record<string, number>, curr) => {
    acc[curr.status] = curr._count._all;
    return acc;
  }, {});

  const totalLeads = leadStats.reduce((sum, curr) => sum + curr._count._all, 0);

  return {
    user: { fullName: session.user.fullName },
    leads: {
      total: totalLeads,
      NEW: statsMap[LeadStatus.NEW] ?? 0,
      POTENTIAL: statsMap[LeadStatus.POTENTIAL] ?? 0,
      CONVERTED: statsMap[LeadStatus.CONVERTED] ?? 0,
    },
    classes: staffClasses.map((cls) => ({
      id: cls.id,
      classCode: cls.classCode,
      name: cls.name,
      status: cls.status,
      memberCount: cls._count.members,
    })),
    totalClasses: staffClasses.length,
  };
}

export async function fetchDashboardDataAction() {
  const session = await getSessionForAction();
  if (!session) return null;

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [
      revenueResult,
      debtMembers,
      badDebtMembers,
      pendingApprovals,
      totalStudying,
      activeClasses,
      sessionsThisWeek,
      absentThisWeek,
      leadsStats
    ] = await Promise.all([
      prisma.paymentReceipt.aggregate({
        where: { status: ReceiptStatus.CONFIRMED },
        _sum: { amount: true },
      }),
      prisma.classMember.findMany({
        where: { debtStatus: { in: [DebtStatus.OWING, DebtStatus.OVERDUE] } },
        select: {
          tuitionFeeActual: true,
          paymentReceipts: {
            where: { status: ReceiptStatus.CONFIRMED },
            select: { amount: true }
          }
        }
      }),
      prisma.classMember.findMany({
        where: { debtStatus: DebtStatus.BAD_DEBT },
        select: {
          tuitionFeeActual: true,
          paymentReceipts: {
            where: { status: ReceiptStatus.CONFIRMED },
            select: { amount: true }
          }
        }
      }),
      prisma.paymentReceipt.count({ where: { status: ReceiptStatus.PENDING_APPROVAL } }),
      prisma.student.count({ where: { status: StudentStatus.STUDYING } }),
      prisma.class.count({ where: { status: ClassStatus.IN_PROGRESS } }),
      prisma.classSession.count({ where: { sessionDate: { gte: weekStart, lte: weekEnd } } }),
      prisma.attendance.count({
        where: {
          status: AttendanceStatus.ABSENT,
          session: { sessionDate: { gte: weekStart, lte: weekEnd } }
        }
      }),
      prisma.lead.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

    const totalRevenue = revenueResult._sum.amount?.toNumber() ?? 0;
    const totalDebt = debtMembers.reduce((acc, m) => {
      const paid = m.paymentReceipts.reduce((sum, r) => sum + r.amount.toNumber(), 0);
      return acc + Math.max(0, m.tuitionFeeActual.toNumber() - paid);
    }, 0);
    const totalBadDebt = badDebtMembers.reduce((acc, m) => {
      const paid = m.paymentReceipts.reduce((sum, r) => sum + r.amount.toNumber(), 0);
      return acc + Math.max(0, m.tuitionFeeActual.toNumber() - paid);
    }, 0);

    const statsMap = leadsStats.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {});

    const totalLeads = leadsStats.reduce((sum, curr) => sum + curr._count._all, 0);
    const unconsultedLeads = statsMap[LeadStatus.NEW] || 0;
    const consultedLeads = statsMap[LeadStatus.CONSULTED] || 0;
    const convertedCount = statsMap[LeadStatus.CONVERTED] || 0;
    const conversionRate = totalLeads > 0 ? Number(((convertedCount / totalLeads) * 100).toFixed(1)) : 0;

    return {
      finance: { totalRevenue, totalDebt, totalBadDebt, pendingApprovals },
      operations: { totalStudying, activeClasses, sessionsThisWeek, absentThisWeek },
      admissions: { totalLeads, unconsultedLeads, consultedLeads, convertedCount, conversionRate }
    };
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    throw new Error("Lỗi tải dữ liệu dashboard.");
  }
}
