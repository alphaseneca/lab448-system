# QR Token Format (Human-Readable)

Each repair gets a unique **QR token** stored natively as the primary `repair_orders.ticket_number`. It is used natively for QR scanning and manual lookup flows (`GET /repairs/by-qr/:token`).

## Format

- **Pattern**: `LAB` + `YYMMDD` + 4-digit daily sequence (no dash).
- **Examples**: `LAB2501310001`, `LAB2501310002`, `LAB2501311000` (1000th repair that day).

| Part     | Meaning                                              |
|----------|------------------------------------------------------|
| `LAB`    | Fixed prefix (lab/shop identifier).                  |
| `YYMMDD` | Server calendar date at intake (e.g. 250131 = 31 Jan 2025). |
| 4 digits | Daily sequence: 0001–9999, resets each day.        |

## Date

- **Source**: The date is derived from the **backend server** when the intake request is processed: `new Date()` then format as YYMMDD (year, month, date from server local time). No client-supplied date is used.
- **Implementation**: In `generateNextTicketNumber(transaction)` in `src/controllers/repairOrderController.js`, the date key is built from `d.getFullYear()`, `d.getMonth() + 1`, `d.getDate()` with zero-padding.

## Daily sequence

- **Storage**: The `ref_counters` table manages sequences.
- **Behaviour**: For each intake, the backend gets or creates the row for today’s `date_key`, locks it, increments `last_value` by 1, and uses that value (zero-padded to 4 digits) in the token. The sequence resets each new day (new date key).
- **Concurrency**: Row locking inside the same transaction as repair creation ensures unique tokens under concurrent intakes.

## Legacy tokens

- Older or previously generated tokens (e.g. random format) may no longer be valid if not present in the DB. Lookup is by exact match on `ticket_number`; only tokens stored in `repair_orders` work.

## Frontend: showing the QR code

- **Queue page**: Click a repair's ticket number in the table to open a modal that shows the actual scannable QR code (and the token text).
- **Repair workspace**: The Customer card shows the ticket number and a scannable QR code image below it.
- **Intake Flow**: The intake success screen creates a barcode automatically via `<QRCodeSVG value={createdRepair.ticketNumber} />`.

## Code references

- **Generator**: `generateNextTicketNumber(transaction)` in `backend/src/controllers/repairOrderController.js` (called inside the intake transaction).
- **Lookup Router**: `/api/v2/repair-workflow/by-qr/:token` seamlessly maps `:token` string directly to `where: { ticketNumber }`.
