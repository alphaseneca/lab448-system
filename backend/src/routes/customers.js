import express from "express";
import { Op } from "sequelize";
import db, { sequelize } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config.js";
import { logAudit } from "../middleware/audit.js";

const router = express.Router();

router.use(authenticate);

/** Allow if user has any of the given permissions (for list/search and get customer). */
const authorizeAny = (perms) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const userPerms = req.user.permissions || [];
  // Allow wildcard admin permission
  if (userPerms.includes("*:*")) return next();
  if (!perms.some((p) => userPerms.includes(p)))
    return res.status(403).json({ message: "Forbidden" });
  next();
};

/**
 * List/search customers. Efficient: only runs filtered query with limit.
 * GET /api/customers?q=search&limit=20
 * - q: optional search string; filters by name, phone, or email (case-insensitive, contains).
 * - limit: max results (default 20, max 50).
 */
router.get(
  "/",
  authorizeAny([PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.INTAKE_REPAIR]),
  async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

      const where = {};
      if (q.length > 0) {
        const pattern = `%${q}%`;
        where[Op.or] = [
          { name: { [Op.iLike]: pattern } },
          { phone: { [Op.iLike]: pattern } },
          { phone2: { [Op.iLike]: pattern } },
          { email: { [Op.iLike]: pattern } },
        ];
      }

      const customers = await db.Customer.findAll({
        where,
        limit,
        order: [["name", "ASC"]],
        attributes: ["id", "name", "phone", "phone2", "email", "address", "createdAt"],
      });

      res.json(customers);
    } catch (err) {
      console.error("List customers error", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

const BILLABLE_STATUSES = ["REPAIRED", "UNREPAIRABLE"];

/**
 * Get combined billing for a customer: only repairs that are Repaired or Unrepairable (billable).
 */
router.get(
  "/:id/billing",
  authorizeAny([PERMISSIONS.MANAGE_BILLING, PERMISSIONS.TAKE_PAYMENT]),
  async (req, res) => {
    try {
      const customer = await db.Customer.findByPk(req.params.id, {
        include: [
          {
            model: db.Repair,
            as: "repairs",
            where: { status: { [Op.in]: BILLABLE_STATUSES } },
            required: false,
            include: [
              { model: db.Device, as: "device" },
              { model: db.RepairCharge, as: "charges" },
              { model: db.Payment, as: "payments" },
            ],
            order: [["createdAt", "ASC"]],
          },
        ],
      });
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const repairs = (customer.repairs || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const items = repairs.map((r) => {
        const total = Number(r.totalCharges);
        const paid = (r.payments || []).reduce((s, p) => s + Number(p.amount), 0);
        const due = total - paid;
        return {
          repairId: r.id,
          qrToken: r.qrToken,
          device: r.device,
          status: r.status,
          isLocked: r.isLocked,
          total,
          paid,
          due,
          charges: r.charges || [],
          payments: r.payments || [],
        };
      });
      const combinedTotal = items.reduce((s, i) => s + i.total, 0);
      const combinedPaid = items.reduce((s, i) => s + i.paid, 0);
      const combinedDue = items.reduce((s, i) => s + i.due, 0);
      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          phone2: customer.phone2,
          email: customer.email,
          address: customer.address,
        },
        items,
        combinedTotal,
        combinedPaid,
        combinedDue,
      });
    } catch (err) {
      console.error("Customer billing error", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * Record a payment for a customer and allocate across repairs with due balance (oldest first).
 * Body: { amount, method }. Creates one Payment per repair that receives a portion.
 */
router.post(
  "/:id/pay",
  authorize([PERMISSIONS.TAKE_PAYMENT]),
  async (req, res) => {
    const customerId = req.params.id;
    const { amount, method } = req.body;
    if (!amount || amount <= 0 || !method) {
      return res
        .status(400)
        .json({ message: "Positive amount and method are required" });
    }
    const validMethods = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    try {
      const result = await sequelize.transaction(async (t) => {
        const customer = await db.Customer.findByPk(customerId, {
          include: [
            {
              model: db.Repair,
              as: "repairs",
              include: [{ model: db.Payment, as: "payments" }],
              order: [["createdAt", "ASC"]],
            },
          ],
          transaction: t,
        });
        if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
        const repairs = (customer.repairs || []).filter((r) => {
          if (!BILLABLE_STATUSES.includes(r.status)) return false;
          const total = Number(r.totalCharges);
          const paid = (r.payments || []).reduce((s, p) => s + Number(p.amount), 0);
          return total - paid > 0;
        });
        const totalDue = repairs.reduce((s, r) => {
          const total = Number(r.totalCharges);
          const paid = (r.payments || []).reduce((s, p) => s + Number(p.amount), 0);
          return s + (total - paid);
        }, 0);
        if (Number(amount) > totalDue) throw new Error("OVERPAYMENT");
        let remaining = Number(amount);
        const createdPayments = [];
        for (const repair of repairs) {
          if (remaining <= 0) break;
          const total = Number(repair.totalCharges);
          const paidSoFar = (repair.payments || []).reduce((s, p) => s + Number(p.amount), 0);
          const due = total - paidSoFar;
          const payThis = Math.min(remaining, due);
          if (payThis <= 0) continue;
          const payment = await db.Payment.create(
            {
              repairId: repair.id,
              amount: payThis,
              method,
              receivedByUserId: req.user.id,
            },
            { transaction: t }
          );
          createdPayments.push({ payment, repairId: repair.id, amount: payThis });
          remaining -= payThis;
          const newPaid = paidSoFar + payThis;
          const shouldLock = newPaid >= total;
          let staffShareAmount = repair.staffShareAmount;
          let shopShareAmount = repair.shopShareAmount;
          if (shouldLock) {
            let staffRate = 0;
            if (repair.assignedToUserId) {
              const technician = await db.User.findByPk(repair.assignedToUserId, {
                include: [{ model: db.Role, as: "role" }],
                transaction: t,
              });
              if (
                technician?.role?.code === "TECHNICIAN" &&
                technician.commissionRate != null
              ) {
                staffRate = Number(technician.commissionRate);
              }
            }
            staffShareAmount = total * staffRate;
            shopShareAmount = total - staffShareAmount;
          }
          await repair.update(
            {
              isLocked: shouldLock,
              staffShareAmount,
              shopShareAmount,
            },
            { transaction: t }
          );
          await logAudit(
            {
              userId: req.user.id,
              repairId: repair.id,
              entityType: "Repair",
              entityId: repair.id,
              action: "PAYMENT_RECEIVED",
              metadata: {
                amount: payThis,
                method,
                newPaid,
                total,
                locked: shouldLock,
                customerBill: true,
              },
            },
            t
          );
        }
        return { createdPayments };
      });
      res.status(201).json(result);
    } catch (err) {
      console.error("Customer pay error", err);
      if (err.message === "CUSTOMER_NOT_FOUND") {
        return res.status(404).json({ message: "Customer not found" });
      }
      if (err.message === "OVERPAYMENT") {
        return res
          .status(400)
          .json({ message: "Payment exceeds total due across all items" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * Get one customer with their repairs (for customer dashboard detail).
 * Repairs include device info for display.
 */
router.get(
  "/:id",
  authorizeAny([PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.INTAKE_REPAIR]),
  async (req, res) => {
    try {
      const customer = await db.Customer.findByPk(req.params.id, {
        include: [
          {
            model: db.Repair,
            as: "repairs",
            include: [{ model: db.Device, as: "device" }],
          },
        ],
        order: [["repairs", "createdAt", "DESC"]],
      });
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (err) {
      console.error("Get customer error", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * Update customer details (name, phone, phone2, email, address).
 */
router.put(
  "/:id",
  authorizeAny([PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.INTAKE_REPAIR]),
  async (req, res) => {
    try {
      const customer = await db.Customer.findByPk(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const { name, phone, phone2, email, address } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (phone !== undefined) updates.phone = phone == null || phone === "" ? null : String(phone).trim();
      if (phone2 !== undefined) updates.phone2 = phone2 == null || phone2 === "" ? null : String(phone2).trim();
      if (email !== undefined) updates.email = email == null || email === "" ? null : String(email).trim();
      if (address !== undefined) updates.address = address == null || address === "" ? null : String(address).trim();
      if (updates.name !== undefined && !updates.name) {
        return res.status(400).json({ message: "Customer name is required" });
      }
      const finalPhone = updates.phone !== undefined ? updates.phone : customer.phone;
      const hasPrimaryPhone = finalPhone != null && String(finalPhone).trim() !== "";
      if (!hasPrimaryPhone) {
        return res.status(400).json({ message: "Please fill your primary phone number" });
      }
      if (Object.keys(updates).length === 0) {
        return res.json(customer);
      }
      await customer.update(updates);
      res.json(customer);
    } catch (err) {
      console.error("Update customer error", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
