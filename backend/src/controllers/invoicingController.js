import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { CHARGE_TYPES, INVOICE_STATUSES, INVOICE_TYPES, PAYMENT_METHODS } from "../utils/constants.js";
import { createId } from "@paralleldrive/cuid2";

import { Op } from 'sequelize';

// =====================================
// Invoicing API
// =====================================

export const listChargeTypes = async (req, res) => {
    try {
        const chargeTypes = await models.ChargeType.findAll({
            where: { isActive: true },
            order: [["sortOrder", "ASC"], ["name", "ASC"]],
            attributes: ["id", "code", "name"],
        });
        res.json(chargeTypes);
    } catch (err) {
        console.error("List charge types error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const resolveDefaultChargeTypeId = async (transaction) => {
    const existing = await models.ChargeType.findOne({
        where: { code: CHARGE_TYPES.GENERAL_SERVICE.CODE },
        transaction,
    });
    if (existing) return existing.id;

    const created = await models.ChargeType.create({
        code: CHARGE_TYPES.GENERAL_SERVICE.CODE,
        name: CHARGE_TYPES.GENERAL_SERVICE.NAME,
        isDiscount: false,
        isTax: false,
        sortOrder: 0,
        isActive: true,
    }, { transaction });
    return created.id;
};

export const getInvoiceForRepair = async (req, res) => {
    const { repairId } = req.params;

    try {
        const invoice = await models.Invoice.findOne({
            where: { repairOrderId: repairId },
            include: [
                { model: models.InvoiceItem, as: "items" },
                { model: models.Payment, as: "payments" }
            ]
        });

        // If no invoice exists yet, return 404 cleanly so frontend knows to create one
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not generated for this repair yet" });
        }

        res.json(invoice);
    } catch (err) {
        console.error("Get invoice error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const generateInvoice = async (req, res) => {
    const { repairId } = req.params;
    const { items, taxRate, taxAmount, discountAmount, discountReason, notes, issuedAt, dueAt, invoiceType, subscriptionId } = req.body;
    // items should be an array: [{ chargeTypeId, description, quantity, unitPrice }]

    const t = await models.sequelize.transaction();
    try {
        let invoice = await models.Invoice.findOne({ where: { repairOrderId: repairId }, transaction: t });

        if (invoice) {
            await t.rollback();
            return res.status(400).json({ message: "Invoice already exists for this repair" });
        }

        const repair = await models.RepairOrder.findByPk(repairId, { transaction: t });
        if (!repair) {
            await t.rollback();
            return res.status(404).json({ message: "Repair not found" });
        }

        // Calculate total
        const subTotal = (items || []).reduce((acc, current) => acc + (current.quantity * current.unitPrice), 0);
        const finalTax = taxAmount || (subTotal * (taxRate || 0));
        const finalTotal = subTotal + finalTax - (discountAmount || 0);

        const invoiceNumber = `INV-${new Date().getFullYear()}-${createId().slice(0, 8).toUpperCase()}`;

        invoice = await models.Invoice.create({
            invoiceNumber,
            repairOrderId: repairId,
            customerId: repair.customerId,
            totalAmount: finalTotal,
            subtotalAmount: subTotal,
            taxRate: taxRate || 0,
            taxAmount: finalTax,
            discountAmount: discountAmount || 0,
            discountReason: discountReason || null,
            status: INVOICE_STATUSES.DRAFT,
            notes: notes || null,
            issuedAt: issuedAt || null,
            dueAt: dueAt || null,
            isLocked: false,
            createdById: req.user.id,
            invoiceType: invoiceType || INVOICE_TYPES.REPAIR,
            subscriptionId: subscriptionId || null
        }, { transaction: t });

        // Add items
        if (items && items.length > 0) {
            const fallbackChargeTypeId = await resolveDefaultChargeTypeId(t);
            const invoiceItemsData = items.map(item => ({
                invoiceId: invoice.id,
                repairOrderId: repairId,
                chargeTypeId: item.chargeTypeId || fallbackChargeTypeId,
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                amount: (item.quantity || 1) * (item.unitPrice || 0),
                addedById: req.user.id
            }));
            await models.InvoiceItem.bulkCreate(invoiceItemsData, { transaction: t });
        }

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "INVOICE_GENERATED",
            entityType: "Invoice",
            entityId: invoice.id,
            repairOrderId: repairId,
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.status(201).json(invoice);

    } catch (err) {
        await t.rollback();
        console.error("Generate invoice error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const applyPayment = async (req, res) => {
    const { invoiceId } = req.params;
    const { amount, paymentMethod, referenceNumber, qrProvider } = req.body;

    if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Amount and payment method are required" });
    }

    const t = await models.sequelize.transaction();
    try {
        const invoice = await models.Invoice.findByPk(invoiceId, {
            include: [{ model: models.Payment, as: 'payments' }],
            transaction: t
        });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        const payment = await models.Payment.create({
            invoiceId,
            amount,
            paymentMethod,
            referenceNumber: referenceNumber || null,
            qrProvider: qrProvider || null,
            receivedAt: new Date(),
            receivedById: req.user.id
        }, { transaction: t });

        // Recalculate invoice status based on paid amounts
        const totalPaidPreviously = invoice.payments.reduce((acc, p) => Number(acc) + Number(p.amount), 0);
        const newTotalPaid = totalPaidPreviously + Number(amount);

        const newStatus = newTotalPaid >= invoice.totalAmount ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL;

        await invoice.update({
            status: newStatus,
            totalPaidAmount: newTotalPaid
        }, { transaction: t });

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "PAYMENT_COLLECTED",
            entityType: "Payment",
            entityId: payment.id,
            repairOrderId: invoice.repairOrderId,
            afterSnapshot: payment.toJSON(),
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.json({ invoice, newPayment: payment });
    } catch (err) {
        await t.rollback();
        console.error("Apply payment error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateInvoice = async (req, res) => {
    const { invoiceId } = req.params;
    const { taxRate, taxAmount, discountAmount, discountReason, notes, issuedAt, dueAt, isLocked } = req.body;

    const t = await models.sequelize.transaction();
    try {
        const invoice = await models.Invoice.findByPk(invoiceId, { transaction: t });
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.isLocked) {
            await t.rollback();
            return res.status(403).json({ message: "Cannot edit a finalized/locked invoice" });
        }

        const beforeSnapshot = invoice.toJSON();

        // Calculate fresh totals if any financial values are passed
        const newTaxRate = taxRate !== undefined ? taxRate : invoice.taxRate;
        const newDiscount = discountAmount !== undefined ? discountAmount : invoice.discountAmount;

        const subTotal = Number(invoice.subtotalAmount);
        const finalTax = taxAmount !== undefined ? taxAmount : (subTotal * newTaxRate);
        const finalTotal = subTotal + finalTax - newDiscount;

        await invoice.update({
            taxRate: newTaxRate,
            taxAmount: finalTax,
            discountAmount: newDiscount,
            discountReason: discountReason !== undefined ? discountReason : invoice.discountReason,
            totalAmount: finalTotal,
            notes: notes !== undefined ? notes : invoice.notes,
            issuedAt: issuedAt !== undefined ? issuedAt : invoice.issuedAt,
            dueAt: dueAt !== undefined ? dueAt : invoice.dueAt,
            isLocked: isLocked !== undefined ? isLocked : invoice.isLocked
        }, { transaction: t });

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "INVOICE_UPDATED",
            entityType: "Invoice",
            entityId: invoice.id,
            repairOrderId: invoice.repairOrderId,
            beforeSnapshot,
            afterSnapshot: invoice.toJSON(),
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.json(invoice);
    } catch (err) {
        await t.rollback();
        console.error("Update invoice error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteInvoice = async (req, res) => {
    const t = await models.sequelize.transaction();
    try {
        const invoice = await models.Invoice.findByPk(req.params.invoiceId, { transaction: t });
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.isLocked || invoice.status === INVOICE_STATUSES.PAID) {
            await t.rollback();
            return res.status(403).json({ message: "Cannot delete a paid or locked invoice" });
        }

        // Drop related items first
        await models.InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction: t });
        await invoice.destroy({ transaction: t });

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "INVOICE_DELETED",
            entityType: "Invoice",
            entityId: invoice.id,
            repairOrderId: invoice.repairOrderId,
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.json({ message: "Invoice successfully deleted" });
    } catch (err) {
        await t.rollback();
        console.error("Delete invoice error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addInvoiceItem = async (req, res) => {
    const { invoiceId } = req.params;
    const { chargeTypeId, description, quantity, unitPrice } = req.body;

    if (!description) return res.status(400).json({ message: "Item description is required" });

    const t = await models.sequelize.transaction();
    try {
        const invoice = await models.Invoice.findByPk(invoiceId, { transaction: t });
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.isLocked) {
            await t.rollback();
            return res.status(403).json({ message: "Cannot add items to a locked invoice" });
        }

        const qty = quantity || 1;
        const price = unitPrice || 0;
        const amount = qty * price;
        const fallbackChargeTypeId = await resolveDefaultChargeTypeId(t);

        const item = await models.InvoiceItem.create({
            invoiceId,
            repairOrderId: invoice.repairOrderId,
            chargeTypeId: chargeTypeId || fallbackChargeTypeId,
            description,
            quantity: qty,
            unitPrice: price,
            amount,
            addedById: req.user.id
        }, { transaction: t });

        // Update Invoice Totals
        const newSubtotal = Number(invoice.subtotalAmount) + amount;
        const newTax = newSubtotal * Number(invoice.taxRate);
        const newTotal = newSubtotal + newTax - Number(invoice.discountAmount);

        await invoice.update({
            subtotalAmount: newSubtotal,
            taxAmount: newTax,
            totalAmount: newTotal
        }, { transaction: t });

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "INVOICE_ITEM_ADDED",
            entityType: "InvoiceItem",
            entityId: item.id,
            repairOrderId: invoice.repairOrderId,
            afterSnapshot: item.toJSON(),
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.status(201).json(item);
    } catch (err) {
        await t.rollback();
        console.error("Add invoice item error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// =====================================
// Convenience Aliases (By Repair ID)
// =====================================

/**
 * Convenience wrapper to apply a payment directly via Repair ID.
 * Finds the linked invoice and chains to applyPayment logic.
 */
export const applyPaymentByRepair = async (req, res) => {
    const { id: repairId } = req.params;
    try {
        const invoice = await models.Invoice.findOne({ where: { repairOrderId: repairId } });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found for this repair. Generate one first." });
        }
        // Redirect/Proxy to standard applyPayment logic
        req.params.invoiceId = invoice.id;
        return applyPayment(req, res);
    } catch (err) {
        console.error("Apply payment by repair error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Convenience wrapper to add a charge directly via Repair ID.
 * Finds the linked invoice and chains to addInvoiceItem logic.
 */
export const addInvoiceItemByRepair = async (req, res) => {
    const { id: repairId } = req.params;
    try {
        const invoice = await models.Invoice.findOne({ where: { repairOrderId: repairId } });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found for this repair. Generate one first." });
        }
        // Redirect/Proxy to standard addInvoiceItem logic
        req.params.invoiceId = invoice.id;
        return addInvoiceItem(req, res);
    } catch (err) {
        console.error("Add invoice item by repair error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// =====================================
// Customer-Level Billing & Ledgers
// =====================================

/**
 * Aggregates all repair orders and invoices for a customer into a single ledger.
 * This is the "Required Backend Logic" for multi-item billing.
 */
export const getCustomerLedger = async (req, res) => {
    const { customerId } = req.params;

    try {
        const customer = await models.Customer.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const repairs = await models.RepairOrder.findAll({
            where: { customerId },
            include: [
                { model: models.CustomerDevice, as: "device", attributes: ["id", "brand", "modelName", "serialNumber"] },
                {
                    model: models.Invoice,
                    as: "invoice",
                    include: [
                        { model: models.InvoiceItem, as: "items" },
                        { model: models.Payment, as: "payments" },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        const ledger = repairs.map((r) => {
            const inv = r.invoice;
            const total = Number(inv?.totalAmount || r.defaultServiceCharge || 0);
            const paid = Number(inv?.totalPaidAmount || 0);

            return {
                repairId: r.id,
                ticketNumber: r.ticketNumber,
                device: r.device,
                status: r.status,
                total,
                paid,
                due: total - paid,
                invoice: inv ? {
                    id: inv.id,
                    status: inv.status,
                    items: inv.items,
                    payments: inv.payments
                } : null
            };
        });

        const summary = {
            totalBilled: ledger.reduce((s, i) => s + i.total, 0),
            totalPaid: ledger.reduce((s, i) => s + i.paid, 0),
        };

        res.json({
            customer: { id: customer.id, name: customer.name },
            summary: {
                ...summary,
                totalDue: summary.totalBilled - summary.totalPaid
            },
            ledger
        });
    } catch (err) {
        console.error("Get customer ledger error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Atomic multi-invoice payment. Distributes a lump sum across all
 * unpaid invoices for a customer (Oldest-First).
 */
export const applyCustomerLumpSumPayment = async (req, res) => {
    const { customerId } = req.params;
    const { amount, paymentMethod, referenceNumber } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: "Valid payment amount is required" });
    }

    const t = await models.sequelize.transaction();

    try {
        const invoices = await models.Invoice.findAll({
            where: {
                customerId,
                status: { [Op.notIn]: [INVOICE_STATUSES.PAID, INVOICE_STATUSES.CANCELLED, INVOICE_STATUSES.VOID] },
            },
            order: [["createdAt", "ASC"]],
            transaction: t,
        });

        let balance = Number(amount);
        const affectedInvoices = [];

        for (const inv of invoices) {
            if (balance <= 0) break;

            const due = Number(inv.totalAmount) - Number(inv.totalPaidAmount || 0);
            if (due <= 0) continue;

            const payNow = Math.min(balance, due);

            const payment = await models.Payment.create({
                invoiceId: inv.id,
                amount: payNow,
                paymentMethod: paymentMethod || PAYMENT_METHODS.CASH,
                referenceNumber: referenceNumber || null,
                receivedAt: new Date(),
                receivedById: req.user.id,
            }, { transaction: t });

            const newPaid = Number(inv.totalPaidAmount || 0) + payNow;
            await inv.update({
                totalPaidAmount: newPaid,
                status: newPaid >= inv.totalAmount ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL,
            }, { transaction: t });

            affectedInvoices.push({ id: inv.id, amount: payNow });
            balance -= payNow;
        }

        await logAudit({
            userId: req.user.id,
            actorType: "STAFF",
            eventName: "LUMP_SUM_PAYMENT_COLLECTED",
            entityType: "Customer",
            entityId: customerId,
            afterSnapshot: { total: amount, distribution: affectedInvoices },
            ipAddress: req.ip,
        }, t);

        await t.commit();
        res.json({ message: "Payment distributed", distributed: affectedInvoices, remaining: balance });
    } catch (err) {
        await t.rollback();
        console.error("Lump sum payment error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
