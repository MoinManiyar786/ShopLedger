# ShopLedger

Node.js CommonJS app with Express 4, body-parser, a plain HTML/CSS/JS
browser UI, and a JSON file for persistence.

## Module map

- `server.js` serves `public/`, mounts `routes/` under `/api`, and serves printable invoices.
- `lib/orders.js`, `lib/inventory.js`, and `lib/ledger.js` handle orders, stock, and Khata.
- `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js` implement checkout rules.
- `lib/invoice.js` prepares printable invoices. `lib/reports.js` reconciles GST.
- `config.js` holds the port, HSN tax slabs, and coupon rules.
- `lib/store.js` reads and writes `data/db.json`.

## Commands

- `npm install --no-package-lock` installs runtime dependencies.
- `npm start` serves ShopLedger on port 3000 by default.
- `node --test` runs tests with Node’s built-in runner.

## Working rules

1. Read the request path before editing and explain current behavior.
2. Capture current behavior and a failing regression test before fixing a bug.
3. Make the smallest change within the ticket’s allowed files.
4. Run tests with in-memory fixtures. Tests must never open `data/db.json`.
   Use a disposable copy of the app and data for manual smoke checks.
5. Run the tests and review the diff before opening a pull request.
   Keep seed data, lockfiles, and dependencies out of the diff.

## Ticket 1 · Invoice and GST mismatch

Change `lib/invoice.js` and add coverage in `test/invoice.test.js`.
Change `lib/tax.js` only if required. Use the existing checkout rules.
