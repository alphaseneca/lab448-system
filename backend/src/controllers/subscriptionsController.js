import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { SUBSCRIPTION_STATUSES } from "../utils/constants.js";

// =====================================
// Subscriptions API (Domain 10)
// =====================================

export const listPlans = async (req, res) => {
  try {
    const plans = await models.SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [["price", "ASC"]],
    });
    res.json(plans);
  } catch (err) {
    console.error("List subscription plans error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCustomerSubscriptions = async (req, res) => {
  const { customerId } = req.params;
  try {
    const subs = await models.CustomerSubscription.findAll({
      where: { customerId },
      include: [
        { model: models.SubscriptionPlan, as: "plan" },
        { model: models.CustomerDevice, as: "device" }
      ],
      order: [["createdAt", "DESC"]]
    });
    res.json(subs);
  } catch (err) {
    console.error("Get customer subscriptions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const subscribeCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { planId, cycleStartAt, cycleEndAt, status } = req.body;

  if (!planId || !cycleStartAt || !cycleEndAt) {
    return res.status(400).json({ message: "Plan ID, start and end cycle dates are required" });
  }

  const t = await models.sequelize.transaction();
  try {
    const sub = await models.CustomerSubscription.create({
      customerId,
      planId,
      cycleStartAt,
      cycleEndAt,
      status: status || SUBSCRIPTION_STATUSES.ACTIVE,
      subscribedById: req.user.id,
      autoRenew: true
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "CUSTOMER_SUBSCRIBED",
      entityType: "CustomerSubscription",
      entityId: sub.id,
      afterSnapshot: sub.toJSON(),
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.status(201).json(sub);
  } catch (err) {
    await t.rollback();
    console.error("Subscribe customer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCustomerSubscription = async (req, res) => {
  const { subscriptionId } = req.params;
  const { planId, cycleStartAt, cycleEndAt, status, autoRenew } = req.body;

  try {
    const sub = await models.CustomerSubscription.findByPk(subscriptionId);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const beforeSnapshot = sub.toJSON();

    await sub.update({
      planId: planId !== undefined ? planId : sub.planId,
      cycleStartAt: cycleStartAt !== undefined ? cycleStartAt : sub.cycleStartAt,
      cycleEndAt: cycleEndAt !== undefined ? cycleEndAt : sub.cycleEndAt,
      status: status !== undefined ? status : sub.status,
      autoRenew: autoRenew !== undefined ? autoRenew : sub.autoRenew,
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "SUBSCRIPTION_UPDATED",
      entityType: "CustomerSubscription",
      entityId: sub.id,
      beforeSnapshot,
      afterSnapshot: sub.toJSON(),
      ipAddress: req.ip,
    });

    res.json(sub);
  } catch (err) {
    console.error("Update subscription error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelCustomerSubscription = async (req, res) => {
  try {
    const sub = await models.CustomerSubscription.findByPk(req.params.subscriptionId);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const beforeSnapshot = sub.toJSON();

    // Cancellation typically means setting status to CANCELLED and dropping autoRenew
    await sub.update({
      status: SUBSCRIPTION_STATUSES.CANCELLED,
      autoRenew: false
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "SUBSCRIPTION_CANCELLED",
      entityType: "CustomerSubscription",
      entityId: sub.id,
      beforeSnapshot,
      afterSnapshot: sub.toJSON(),
      ipAddress: req.ip,
    });

    res.json({ message: "Subscription successfully cancelled", subscription: sub });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
