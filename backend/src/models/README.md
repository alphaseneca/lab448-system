# Lab448 Database Model Guidelines

**Attention AI Agents / Developers**: If you need to add, update, or remove database models from the `src/models/` directory, you **must** strictly adhere to the rules outlined below. The integrity of the backend database depends entirely on the schema aligning 1:1 with the central `schema.dbml` file.

## 1. Domain-Driven Folder Structure

Models are strictly organized into 10 domains. A new table in `schema.dbml` always belongs to a specific domain (identified by the `// ========================== DOMAIN X` comments).

When generating the model, save it inside precisely the matching folder:

- `iam/` — Identity & Access Management
- `customer/` — Customer CRM
- `service_catalog/` — Service Catalog
- `repair_workflow/` — Repair Workflow
- `invoicing/` — Invoicing
- `inventory/` — Inventory
- `media_attachments/` — Media Attachments
- `communications/` — Communications
- `system/` — System logs, counters, audit events
- `subscriptions/` — Subscriptions

Do **NOT** place models at the root of `src/models/` directly.

## 2. Naming Conventions

- **File Name**: `PascalCase.js` (e.g., `RepairOrder.js`, `CustomerSubscription.js`)
- **Model Name**: PascalCase exactly matching the class logic (e.g., `sequelize.define("CustomerSubscription", ...)`).
- **Table Name**: Always defined explicitly using `tableName: 'snake_case_plural'` to match the `schema.dbml` table name. Provide exact mapping.

## 3. Attribute Definitions (Sequelize Mapping)

1. **Underscored Configuration**: Set `underscored: true` on the model configuration options block. 
2. **Column Names/Fields**: 
   - Define variable names in memory as `camelCase` (e.g., `invoiceNumber`, `createdById`).
   - If the name is multi-word, explicitly define the mapping using `field: "snake_case"` inside the attribute options to ensure queries bridge camelCase logic precisely to snake_case DB fields.
   - Example:
     ```javascript
     invoiceNumber: {
       type: DataTypes.STRING,
       allowNull: false,
       unique: true,
       field: "invoice_number", // Match DBML column name
     }
     ```
3. **Primary Keys**: Always `DataTypes.STRING` using CUID2.
   ```javascript
   import { createId } from "@paralleldrive/cuid2";
   // ...
   id: {
     type: DataTypes.STRING,
     primaryKey: true,
     defaultValue: () => createId(),
   }
   ```
4. **Timestamps**:
   - `schema.dbml` often includes `created_at` but specifically not `updated_at` on append-only models (like logs). 
   - Define `createdAt` and `updatedAt` explicitly per model with `field` maps.
   - For log tables without `updated_at`, set `updatedAt: false` in the config block.
   - Set `paranoid: true` if `deleted_at` exists in the DBML.

## 4. Associations (`associate` method)

Every relationship arrow heavily documented in `schema.dbml` MUST be converted into a Sequelize string constraint wrapped explicitly inside `Model.associate = (models) => { ... }`.

1. **Foreign Keys**: You must strictly provide the `foreignKey` mapping explicitly.
2. **Alias mapping (`as`)**: Explicitly cast what the related object is called. Do not let Sequelize implicitly guess names.
   
```javascript
CustomerDevice.associate = (models) => {
  CustomerDevice.belongsTo(models.Customer, {
    foreignKey: "customerId",
    as: "customer",
  });
  CustomerDevice.hasMany(models.RepairOrder, {
    foreignKey: "deviceId",
    as: "repairOrders",
  });
};
```

## 5. Integrating the Model (`index.js`)

After creating a `src/models/<domain>/NewModel.js` file:
1. Open `src/models/index.js`.
2. Navigate horizontally down to the correct `/ Domain X: Name` import section.
3. Import the file: `import NewModel from "./<domain>/NewModel.js";`
4. Register the model into the `const models = { ... }` object literal block, correctly grouped inside its domain.
   - E.g., `NewModel: NewModel(sequelize),`
5. The automation inside `index.js` will automatically loop over all registered `models` invoking the `associate` blocks. No further action is required.
