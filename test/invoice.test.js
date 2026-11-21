const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');

function item(name, hsn, price, qty = 1) {
  return { name, sku: name.toUpperCase(), hsn, price, qty };
}

test('matches a ledger order with no coupon and only 18% goods', () => {
  const order = {
    id: 1008,
    items: [item('Tea', '0902', 140), item('Syrup', '2106', 180, 2)],
    total: 590
  };

  const figures = invoice.computeInvoiceFigures(order);
  assert.deepEqual(
    [figures.subtotal, figures.discount, figures.tax, figures.total],
    [500, 0, 90, 590]
  );
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('uses each item’s HSN slab when there is no coupon', () => {
  const order = {
    items: [item('Ghee', '0405', 450, 2), item('Oil', '1512', 190, 2)]
  };

  const figures = invoice.computeInvoiceFigures(order);
  assert.deepEqual(figures.rows.map(row => [row.gstPercent, row.lineTax]), [[12, 108], [5, 19]]);
  assert.equal(figures.total, 1407);
});

test('caps SAVE10 at ₹150 and calculates GST after the discount', () => {
  const order = { coupon: 'SAVE10', items: [item('Oil', '1508', 1120, 2)] };
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual([figures.discount, figures.tax, figures.total], [150, 104.5, 2194.5]);
});

test('apportions a flat coupon across lines before calculating GST', () => {
  const order = {
    coupon: 'FLAT50',
    items: [item('Ghee', '0405', 260), item('Tea', '0902', 140)]
  };
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual([figures.discount, figures.tax, figures.total], [50, 49.35, 399.35]);
  assert.deepEqual(figures.rows.map(row => row.lineTax), [27.3, 22.05]);
  assert.deepEqual([figures.cgst, figures.sgst], [24.68, 24.67]);
});

test('order #1002 matches the checkout GST and total with SAVE10', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [item('Rice', '1006', 640), item('Oil', '1512', 190, 2)],
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  };

  const figures = invoice.computeInvoiceFigures(order);
  assert.equal(figures.total, order.total);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.discount, order.discount);
  assert.deepEqual(figures.rows.map(row => row.lineTax), [28.8, 17.1]);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('honors explicit legacy rates and uses the default for unknown HSN codes', () => {
  const order = {
    items: [
      { ...item('Exempt', '1006', 100), gstRate: 0 },
      { ...item('Decimal', '1006', 100), gstRate: 0.12 },
      { ...item('Percentage', '1006', 100), gstRate: 18 },
      item('Unknown', '9999', 100)
    ]
  };

  const figures = invoice.computeInvoiceFigures(order);
  assert.deepEqual(figures.rows.map(row => row.gstPercent), [0, 12, 18, 18]);
  assert.equal(figures.tax, 48);
});

test('still displays a notice when the recorded amount differs', () => {
  const order = { id: 1000, items: [item('Rice', '1006', 100)], total: 100 };

  assert.match(invoice.render(order), /Accountant Reconciliation Notice/);
});
