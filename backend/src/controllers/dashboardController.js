import { Op } from "sequelize";
import models from "../models/index.js";
import { ROLES, REPAIR_STATUSES, PERMISSIONS } from "../utils/constants.js";
import { QR_LABEL } from "../config.js";

// =====================================
// V2 Dashboard API
// Built on V2 models (RepairOrder, StaffMember, Invoice, Payment, TechnicianWorkLog)
// =====================================

// ----------- Helpers -----------
const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const todayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// =====================================
// GET /api/v2/dashboard/technician
// Role: TECHNICIAN, ADMIN
// =====================================
export const technicianDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const mStart = monthStart();
    const now = new Date();

    // ── Assigned Repairs ──
    const assignedRepairs = await models.RepairOrder.findAll({
      where: { assignedToId: userId },
      include: [
        { model: models.Customer, as: "customer", attributes: ["id", "name", "phonePrimary"] },
        { model: models.CustomerDevice, as: "device", attributes: ["id", "brand", "modelName"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const inProgress = assignedRepairs.filter(r =>
      [REPAIR_STATUSES.IN_REPAIR, REPAIR_STATUSES.IN_DIAGNOSTICS, REPAIR_STATUSES.QUALITY_CONTROL].includes(r.status)
    );

    const completedThisMonth = assignedRepairs.filter(r => {
      const isComplete = [REPAIR_STATUSES.READY_FOR_DELIVERY, REPAIR_STATUSES.DELIVERED].includes(r.status);
      const dt = r.completedAt || r.updatedAt;
      return isComplete && dt && new Date(dt) >= mStart;
    });

    // ── Work Logs (the real technician stats — V1 was missing this entirely) ──
    const workLogs = await models.TechnicianWorkLog.findAll({
      where: {
        technicianId: userId,
        createdAt: { [Op.gte]: mStart },
      },
    });

    const totalLoggedMinutes = workLogs.reduce((sum, wl) => sum + (wl.durationMinutes || 0), 0);
    const approvedLogs = workLogs.filter(wl => wl.isApproved);
    const totalCommissionEarned = approvedLogs.reduce((sum, wl) => sum + Number(wl.commissionAmount || 0), 0);

    // Average completion time from work logs
    const logsWithDuration = workLogs.filter(wl => wl.durationMinutes > 0);
    const avgCompletionMinutes = logsWithDuration.length > 0
      ? Math.round(logsWithDuration.reduce((s, wl) => s + wl.durationMinutes, 0) / logsWithDuration.length)
      : 0;

    // ── 6-month Performance Trend ──
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendLogs = await models.TechnicianWorkLog.findAll({
      where: {
        technicianId: userId,
        isApproved: true,
        createdAt: { [Op.gte]: sixMonthsAgo },
      },
    });

    const byMonth = {};
    trendLogs.forEach(wl => {
      const d = new Date(wl.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { count: 0, minutes: 0, earnings: 0 };
      byMonth[key].count++;
      byMonth[key].minutes += wl.durationMinutes || 0;
      byMonth[key].earnings += Number(wl.commissionAmount || 0);
    });

    const performanceTrend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // ── Pending unassigned repairs ──
    const pendingRepairs = await models.RepairOrder.findAll({
      where: {
        assignedToId: null,
        status: { [Op.in]: [REPAIR_STATUSES.PENDING, REPAIR_STATUSES.IN_DIAGNOSTICS] },
      },
      include: [
        { model: models.Customer, as: "customer", attributes: ["id", "name", "phonePrimary"] },
        { model: models.CustomerDevice, as: "device", attributes: ["id", "brand", "modelName"] },
      ],
      limit: 20,
      order: [["createdAt", "ASC"]],
    });

    res.json({
      current_month_stats: {
        repairs_completed: completedThisMonth.length,
        repairs_in_progress: inProgress.length,
        total_logged_minutes: totalLoggedMinutes,
        total_work_logs: workLogs.length,
        approved_work_logs: approvedLogs.length,
        total_commission_earned: Number(totalCommissionEarned.toFixed(2)),
        avg_completion_minutes: avgCompletionMinutes,
      },
      my_active_repairs: inProgress.slice(0, 20),
      pending_repairs: pendingRepairs,
      performance_trend: performanceTrend,
    });
  } catch (err) {
    console.error("V2 Technician dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/front-desk
// Role: FRONT_DESK, ADMIN
// =====================================
export const frontDeskDashboard = async (req, res) => {
  try {
    const mStart = monthStart();
    const tStart = todayStart();

    const [newIntakesToday, activeRepairs, monthPayments, recentRepairs] = await Promise.all([
      models.RepairOrder.count({
        where: { intakeAt: { [Op.gte]: tStart } },
      }),
      models.RepairOrder.findAll({
        where: { status: { [Op.notIn]: [REPAIR_STATUSES.DELIVERED, REPAIR_STATUSES.CANCELLED] } },
        include: [
          { model: models.Customer, as: "customer", attributes: ["id", "name", "phonePrimary"] },
          { model: models.CustomerDevice, as: "device", attributes: ["id", "brand", "modelName"] },
        ],
      }),
      models.Payment.sum("amount", {
        where: { receivedAt: { [Op.gte]: mStart } },
      }),
      models.RepairOrder.findAll({
        include: [
          { model: models.Customer, as: "customer", attributes: ["id", "name", "phonePrimary"] },
          { model: models.CustomerDevice, as: "device", attributes: ["id", "brand", "modelName"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: 20,
      }),
    ]);

    const pendingDeliveries = activeRepairs.filter(r =>
      r.status === REPAIR_STATUSES.READY_FOR_DELIVERY
    );

    const statusBreakdown = {};
    activeRepairs.forEach(r => {
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    });

    res.json({
      today_stats: {
        new_intakes: newIntakesToday,
        pending_deliveries: pendingDeliveries.length,
        active_repairs: activeRepairs.length,
      },
      current_month: {
        revenue_collected: Number(monthPayments || 0),
      },
      status_breakdown: statusBreakdown,
      recent_repairs: recentRepairs,
    });
  } catch (err) {
    console.error("V2 Front-desk dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/logistics
// Role: LOGISTICS, ADMIN
// =====================================
export const logisticsDashboard = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const LOW_STOCK_THRESHOLD = 5;

    const [parts, recentMovements] = await Promise.all([
      models.RepairPartCatalog.findAll({
        where: { isActive: true },
        include: [
          { model: models.PartLocation, as: "location", attributes: ["id", "code", "name"], required: false },
        ],
        order: [["name", "ASC"]],
      }),
      models.StockMovement.findAll({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        include: [
          { model: models.RepairPartCatalog, as: "part", attributes: ["id", "name", "sku"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: 30,
      }),
    ]);

    const lowStockItems = parts.filter(p => p.availableQuantity <= (p.reorderThreshold || LOW_STOCK_THRESHOLD));
    const totalInventoryValue = parts.reduce(
      (s, p) => s + (Number(p.availableQuantity) * Number(p.unitCostPrice || 0)), 0
    );

    res.json({
      inventory_overview: {
        total_parts: parts.length,
        low_stock_count: lowStockItems.length,
        low_stock_items: lowStockItems.map(p => ({
          id: p.id, sku: p.sku, name: p.name,
          available: p.availableQuantity,
          reorderThreshold: p.reorderThreshold,
          location: p.location?.name || null,
        })),
        total_inventory_value: Number(totalInventoryValue.toFixed(2)),
      },
      recent_stock_movements: recentMovements,
    });
  } catch (err) {
    console.error("V2 Logistics dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/finance
// Role: FINANCE, ADMIN
// =====================================
export const financeDashboard = async (req, res) => {
  try {
    const mStart = monthStart();
    const tStart = todayStart();

    const [todayRevenue, monthPayments, recentPayments, unpaidInvoices] = await Promise.all([
      models.Payment.sum("amount", {
        where: { receivedAt: { [Op.gte]: tStart } },
      }),
      models.Payment.findAll({
        where: { receivedAt: { [Op.gte]: mStart } },
      }),
      models.Payment.findAll({
        include: [
          {
            model: models.Invoice, as: "invoice",
            attributes: ["id", "invoiceNumber", "totalAmount", "totalPaidAmount", "status"],
            include: [
              { model: models.Customer, as: "customer", attributes: ["id", "name"] },
            ],
          },
        ],
        order: [["receivedAt", "DESC"]],
        limit: 30,
      }),
      models.Invoice.findAll({
        where: {
          status: { [Op.notIn]: ["PAID", "VOID"] },
          totalAmount: { [Op.gt]: 0 },
        },
        include: [
          { model: models.Customer, as: "customer", attributes: ["id", "name", "phonePrimary"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: 30,
      }),
    ]);

    // Payment method breakdown
    const methodBreakdown = {};
    const totalMonthRevenue = monthPayments.reduce((s, p) => {
      const method = p.paymentMethod || "OTHER";
      methodBreakdown[method] = (methodBreakdown[method] || 0) + Number(p.amount);
      return s + Number(p.amount);
    }, 0);

    // Outstanding totals
    const totalOutstanding = unpaidInvoices.reduce(
      (s, inv) => s + (Number(inv.totalAmount) - Number(inv.totalPaidAmount)), 0
    );

    res.json({
      today_collections: Number(todayRevenue || 0),
      current_month: {
        total_revenue: Number(totalMonthRevenue.toFixed(2)),
        outstanding_amount: Number(totalOutstanding.toFixed(2)),
        payment_method_breakdown: methodBreakdown,
      },
      recent_payments: recentPayments,
      unpaid_invoices: unpaidInvoices.map(inv => ({
        ...inv.toJSON(),
        outstanding: Number(inv.totalAmount) - Number(inv.totalPaidAmount),
      })),
    });
  } catch (err) {
    console.error("V2 Finance dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/manager
// Role: MANAGER, ADMIN
// =====================================
export const managerDashboard = async (req, res) => {
  try {
    const now = new Date();
    const mStart = monthStart();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [activeRepairs, technicians, monthCompleted] = await Promise.all([
      models.RepairOrder.findAll({
        where: { status: { [Op.notIn]: [REPAIR_STATUSES.DELIVERED, REPAIR_STATUSES.CANCELLED] } },
        include: [
          { model: models.StaffMember, as: "assignedTo", attributes: ["id", "fullName"] },
          { model: models.Customer, as: "customer", attributes: ["id", "name"] },
        ],
      }),
      models.StaffMember.findAll({
        include: [{
          model: models.Role, as: "role",
          where: { code: ROLES.TECHNICIAN },
          required: true,
        }],
        where: { isActive: true },
        attributes: ["id", "fullName", "technicianRank"],
      }),
      models.RepairOrder.count({
        where: {
          status: { [Op.in]: [REPAIR_STATUSES.READY_FOR_DELIVERY, REPAIR_STATUSES.DELIVERED] },
          completedAt: { [Op.gte]: mStart },
        },
      }),
    ]);

    // Status distribution
    const statusDistribution = {};
    activeRepairs.forEach(r => {
      statusDistribution[r.status] = (statusDistribution[r.status] || 0) + 1;
    });

    // Staff utilization — how many jobs each tech has
    const staffUtilization = technicians.map(t => {
      const assigned = activeRepairs.filter(r => r.assignedToId === t.id);
      const inRepair = assigned.filter(r => r.status === REPAIR_STATUSES.IN_REPAIR);
      return {
        technicianId: t.id,
        name: t.fullName,
        rank: t.technicianRank,
        assignedCount: assigned.length,
        inRepairCount: inRepair.length,
      };
    });

    // Bottleneck detection — repairs not updated in 48 hours
    const bottlenecks = activeRepairs
      .filter(r => {
        const lastUpdate = r.updatedAt || r.createdAt;
        return new Date(lastUpdate) < fortyEightHoursAgo && r.status !== REPAIR_STATUSES.PENDING;
      })
      .slice(0, 20);

    res.json({
      operations_overview: {
        active_repairs: activeRepairs.length,
        month_completed: monthCompleted,
        status_distribution: statusDistribution,
      },
      staff_utilization: staffUtilization,
      bottlenecks: bottlenecks.map(r => ({
        id: r.id,
        ticketNumber: r.ticketNumber,
        status: r.status,
        customer: r.customer?.name,
        technician: r.assignedTo?.fullName || "Unassigned",
        lastUpdated: r.updatedAt,
        hoursSinceUpdate: Math.round((now - new Date(r.updatedAt)) / (1000 * 60 * 60)),
      })),
    });
  } catch (err) {
    console.error("V2 Manager dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/admin
// Role: ADMIN only
// =====================================
export const adminDashboard = async (req, res) => {
  try {
    const [staffMembers, roles, repairCount, totalRevenue] = await Promise.all([
      models.StaffMember.findAll({
        where: { isActive: true },
        include: [{ model: models.Role, as: "role", attributes: ["code", "name"] }],
        attributes: ["id", "fullName"],
      }),
      models.Role.findAll({ order: [["code", "ASC"]] }),
      models.RepairOrder.count(),
      models.Payment.sum("amount"),
    ]);

    const rolesDistribution = {};
    staffMembers.forEach(s => {
      const code = s.role?.code || "unknown";
      rolesDistribution[code] = (rolesDistribution[code] || 0) + 1;
    });

    res.json({
      system_overview: {
        total_repairs: repairCount,
        total_revenue: Number(totalRevenue || 0),
        active_staff: staffMembers.length,
      },
      roles_distribution: rolesDistribution,
      configuration: {
        roles_configured: roles.length,
        roles: roles.map(r => ({ code: r.code, name: r.name })),
      },
    });
  } catch (err) {
    console.error("V2 Admin dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// GET /api/v2/dashboard/summary
// Permission: view:dashboard (any role)
// =====================================
export const dashboardSummary = async (req, res) => {
  try {
    const tStart = todayStart();

    const [totalRepairs, openRepairs, totalRevenue, todayRevenue] = await Promise.all([
      models.RepairOrder.count(),
      models.RepairOrder.count({
        where: {
          status: {
            [Op.in]: [
              REPAIR_STATUSES.PENDING,
              REPAIR_STATUSES.IN_DIAGNOSTICS,
              REPAIR_STATUSES.IN_REPAIR,
              REPAIR_STATUSES.WAITING_FOR_PARTS,
              REPAIR_STATUSES.QUALITY_CONTROL,
            ],
          },
        },
      }),
      models.Payment.sum("amount"),
      models.Payment.sum("amount", {
        where: { receivedAt: { [Op.gte]: tStart } },
      }),
    ]);

    res.json({
      totalRepairs,
      openRepairs,
      totalRevenue: Number(totalRevenue || 0),
      todayRevenue: Number(todayRevenue || 0),
    });
  } catch (err) {
    console.error("V2 Dashboard summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

