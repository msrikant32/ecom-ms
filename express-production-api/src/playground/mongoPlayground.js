const { Schema, model } = require('mongoose');
const logger = require('../config/logger');

// Deliberately separate collections from the app's real Product/Order
// models, seeded with fixed fake data - so the playground's permissive
// querying can never touch real user data (password hashes, real orders),
// and the dataset stays stable for docs/screenshots to reference by name.
//
// Shaped deliberately DIFFERENTLY from the SQL playground's normalized
// tables: the order EMBEDS customer info and line items directly as
// sub-documents, needing no join to answer "what did this customer order,
// with product names" - that contrast IS the teaching point.
const playgroundProductSchema = new Schema(
  {
    name: String,
    category: String,
    price: Number,
    stock: Number,
    tags: [String],
  },
  { collection: 'playground_products' }
);

const playgroundOrderSchema = new Schema(
  {
    customer: { name: String, email: String, city: String }, // embedded, not referenced
    items: [{ productName: String, quantity: Number, unitPrice: Number }], // embedded line items
    status: String,
    createdAt: Date,
  },
  { collection: 'playground_orders' }
);

const PlaygroundProduct = model('PlaygroundProduct', playgroundProductSchema);
const PlaygroundOrder = model('PlaygroundOrder', playgroundOrderSchema);

const SAMPLE_PRODUCTS = [
  { name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, stock: 42, tags: ['input', 'desk'] },
  { name: 'Ultrawide Monitor', category: 'Electronics', price: 459.99, stock: 15, tags: ['display', 'desk'] },
  { name: 'USB-C Dock', category: 'Electronics', price: 64.99, stock: 100, tags: ['accessory'] },
  { name: 'Ergonomic Chair', category: 'Furniture', price: 329.99, stock: 8, tags: ['seating'] },
  { name: 'Webcam 4K', category: 'Electronics', price: 129.99, stock: 60, tags: ['video', 'accessory'] },
];

const SAMPLE_ORDERS = [
  {
    customer: { name: 'Ava Chen', email: 'ava@example.com', city: 'Seattle' },
    items: [
      { productName: 'Mechanical Keyboard', quantity: 1, unitPrice: 89.99 },
      { productName: 'USB-C Dock', quantity: 2, unitPrice: 64.99 },
    ],
    status: 'delivered',
    createdAt: new Date('2026-06-02T10:00:00Z'),
  },
  {
    customer: { name: 'Ava Chen', email: 'ava@example.com', city: 'Seattle' },
    items: [{ productName: 'Ultrawide Monitor', quantity: 1, unitPrice: 459.99 }],
    status: 'processing',
    createdAt: new Date('2026-07-15T14:30:00Z'),
  },
  {
    customer: { name: 'Marcus Bell', email: 'marcus@example.com', city: 'Austin' },
    items: [
      { productName: 'Ergonomic Chair', quantity: 1, unitPrice: 329.99 },
      { productName: 'Webcam 4K', quantity: 1, unitPrice: 129.99 },
    ],
    status: 'delivered',
    createdAt: new Date('2026-06-20T09:15:00Z'),
  },
  {
    customer: { name: 'Priya Nair', email: 'priya@example.com', city: 'Boston' },
    items: [
      { productName: 'Mechanical Keyboard', quantity: 2, unitPrice: 89.99 },
      { productName: 'USB-C Dock', quantity: 1, unitPrice: 64.99 },
    ],
    status: 'shipped',
    createdAt: new Date('2026-07-10T16:45:00Z'),
  },
];

async function seedMongoPlayground() {
  const [productCount, orderCount] = await Promise.all([
    PlaygroundProduct.countDocuments(),
    PlaygroundOrder.countDocuments(),
  ]);
  if (productCount === 0) {
    await PlaygroundProduct.insertMany(SAMPLE_PRODUCTS);
  }
  if (orderCount === 0) {
    await PlaygroundOrder.insertMany(SAMPLE_ORDERS);
  }
  if (productCount === 0 || orderCount === 0) {
    logger.info('playground.mongo_seeded');
  }
}

module.exports = { PlaygroundProduct, PlaygroundOrder, seedMongoPlayground };
