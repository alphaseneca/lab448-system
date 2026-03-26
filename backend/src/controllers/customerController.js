import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { CUSTOMER_PREFERRED_CHANNELS, INTAKE_SOURCES } from "../utils/constants.js";

// =====================================
// Customers
// =====================================

export const listCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const customers = await models.Customer.findAndCountAll({
      include: [
        { model: models.CustomerAddress, as: "addresses" },
        { model: models.CustomerDevice, as: "devices" }
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total: customers.count,
      data: customers.rows,
    });
  } catch (err) {
    console.error("List customers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await models.Customer.findByPk(req.params.id, {
      include: [
        { model: models.CustomerAddress, as: "addresses" },
        { model: models.CustomerDevice, as: "devices" }
      ],
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (err) {
    console.error("Get customer by ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCustomer = async (req, res) => {
  const {
    name, isCompany, companyContactPerson, panNumber,
    phonePrimary, phoneSecondary, email,
    preferredChannel, intakeSource, notes, primaryAddress
  } = req.body;

  if (!name || (!phonePrimary && !phoneSecondary)) {
    return res.status(400).json({ message: "Name and at least one phone number are required" });
  }

  try {
    const customer = await models.Customer.create({
      name,
      isCompany: isCompany || false,
      companyContactPerson: companyContactPerson || null,
      panNumber: panNumber || null,
      phonePrimary: phonePrimary || null,
      phoneSecondary: phoneSecondary || null,
      email: email || null,
      preferredChannel: preferredChannel || CUSTOMER_PREFERRED_CHANNELS.SMS,
      intakeSource: intakeSource || INTAKE_SOURCES.WALK_IN,
      notes: notes || null
    });

    if (primaryAddress && (primaryAddress.addressLine || primaryAddress.latitude || primaryAddress.longitude)) {
      await models.CustomerAddress.create({
        customerId: customer.id,
        label: primaryAddress.label || "Primary",
        addressLine: primaryAddress.addressLine || null,
        cityDistrict: primaryAddress.cityDistrict || null,
        nearestBranch: primaryAddress.nearestBranch || null,
        latitude: primaryAddress.latitude || null,
        longitude: primaryAddress.longitude || null,
        isDefault: true,
      });
    }

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: customer.id,
      afterSnapshot: customer.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json(customer);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email or phone already exists" });
    }
    console.error("Create customer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await models.Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const beforeSnapshot = customer.toJSON();

    const {
      name, isCompany, companyContactPerson, panNumber,
      phonePrimary, phoneSecondary, email,
      preferredChannel, intakeSource, notes
    } = req.body;

    await customer.update({
      name: name !== undefined ? name : customer.name,
      isCompany: isCompany !== undefined ? isCompany : customer.isCompany,
      companyContactPerson: companyContactPerson !== undefined ? companyContactPerson : customer.companyContactPerson,
      panNumber: panNumber !== undefined ? panNumber : customer.panNumber,
      phonePrimary: phonePrimary !== undefined ? phonePrimary : customer.phonePrimary,
      phoneSecondary: phoneSecondary !== undefined ? phoneSecondary : customer.phoneSecondary,
      email: email !== undefined ? email : customer.email,
      preferredChannel: preferredChannel !== undefined ? preferredChannel : customer.preferredChannel,
      intakeSource: intakeSource !== undefined ? intakeSource : customer.intakeSource,
      notes: notes !== undefined ? notes : customer.notes,
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: customer.id,
      beforeSnapshot,
      afterSnapshot: customer.toJSON(),
      ipAddress: req.ip,
    });

    res.json(customer);
  } catch (err) {
    console.error("Update customer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await models.Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Soft delete
    await customer.update({ deletedAt: new Date() });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "CUSTOMER_DELETED",
      entityType: "Customer",
      entityId: customer.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Customer successfully deleted" });
  } catch (err) {
    console.error("Delete customer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// Customer Addresses
// =====================================

export const addCustomerAddress = async (req, res) => {
  const { customerId } = req.params;
  const { label, addressLine, cityDistrict, nearestBranch, latitude, longitude, isDefault } = req.body;

  if (!label) return res.status(400).json({ message: "Address label is required" });

  try {
    const customer = await models.Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (isDefault) {
      // Unset previous default
      await models.CustomerAddress.update({ isDefault: false }, { where: { customerId } });
    }

    const address = await models.CustomerAddress.create({
      customerId,
      label,
      addressLine: addressLine || null,
      cityDistrict: cityDistrict || null,
      nearestBranch: nearestBranch || null,
      latitude: latitude || null,
      longitude: longitude || null,
      isDefault: isDefault || false
    });

    res.status(201).json(address);
  } catch (err) {
    console.error("Add customer address error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCustomerAddress = async (req, res) => {
  try {
    const address = await models.CustomerAddress.findByPk(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    const { label, addressLine, cityDistrict, nearestBranch, latitude, longitude, isDefault } = req.body;

    if (isDefault && !address.isDefault) {
      await models.CustomerAddress.update({ isDefault: false }, { where: { customerId: address.customerId } });
    }

    await address.update({
      label: label !== undefined ? label : address.label,
      addressLine: addressLine !== undefined ? addressLine : address.addressLine,
      cityDistrict: cityDistrict !== undefined ? cityDistrict : address.cityDistrict,
      nearestBranch: nearestBranch !== undefined ? nearestBranch : address.nearestBranch,
      latitude: latitude !== undefined ? latitude : address.latitude,
      longitude: longitude !== undefined ? longitude : address.longitude,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault
    });

    res.json(address);
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCustomerAddress = async (req, res) => {
  try {
    const address = await models.CustomerAddress.findByPk(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // Hard delete for addresses usually
    await address.destroy();
    res.json({ message: "Address successfully deleted" });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
// Customer Devices
// =====================================

export const addCustomerDevice = async (req, res) => {
  const { customerId } = req.params;
  const { deviceTypeId, brand, modelName, color, serialNumber, purchaseYear, hasWarranty, reportedIssue } = req.body;

  if (!brand || !modelName) {
    return res.status(400).json({ message: "Brand and model name are required" });
  }

  try {
    const customer = await models.Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const device = await models.CustomerDevice.create({
      customerId,
      deviceTypeId: deviceTypeId || null,
      brand,
      modelName,
      color: color || null,
      serialNumber: serialNumber || null,
      purchaseYear: purchaseYear || null,
      hasWarranty: hasWarranty || false,
      reportedIssue: reportedIssue || null,
    });

    res.status(201).json(device);
  } catch (err) {
    console.error("Add customer device error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCustomerDevice = async (req, res) => {
  try {
    const device = await models.CustomerDevice.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const { deviceTypeId, brand, modelName, color, serialNumber, purchaseYear, hasWarranty, reportedIssue } = req.body;

    await device.update({
      deviceTypeId: deviceTypeId !== undefined ? deviceTypeId : device.deviceTypeId,
      brand: brand !== undefined ? brand : device.brand,
      modelName: modelName !== undefined ? modelName : device.modelName,
      color: color !== undefined ? color : device.color,
      serialNumber: serialNumber !== undefined ? serialNumber : device.serialNumber,
      purchaseYear: purchaseYear !== undefined ? purchaseYear : device.purchaseYear,
      hasWarranty: hasWarranty !== undefined ? hasWarranty : device.hasWarranty,
      reportedIssue: reportedIssue !== undefined ? reportedIssue : device.reportedIssue
    });

    res.json(device);
  } catch (err) {
    console.error("Update device error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCustomerDevice = async (req, res) => {
  try {
    const device = await models.CustomerDevice.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    // Soft delete
    await device.update({ deletedAt: new Date() });
    res.json({ message: "Device successfully deleted" });
  } catch (err) {
    console.error("Delete device error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
