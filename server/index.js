const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increased body limit to 10MB for base64 payment screenshot images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Owner Admin Credentials
const OWNER_EMAIL = 'vishwa81251@gmail.com';
const OWNER_PASSWORD = '81251';

// In-memory SQL/JSON database store for orders
let ordersDatabase = [
  {
    orderId: 'PJR-108492',
    customer: {
      name: 'Ravi Kumar',
      phone: '9876543210',
      areaId: 'lbnagar',
      address: 'Plot 42, Green Hills Colony, Near Bus Stop, LB Nagar'
    },
    area: { id: 'lbnagar', name: 'LB Nagar', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
    items: [
      {
        cartItemId: 'murukulu-1 kg',
        product: { name: 'Classic Murukulu (Jantikalu)' },
        selectedWeightLabel: '1 kg',
        unitPrice: 350,
        quantity: 1
      },
      {
        cartItemId: 'laddu-500g',
        product: { name: 'Homemade Motichoor / Besan Laddu' },
        selectedWeightLabel: '500g',
        unitPrice: 190,
        quantity: 1
      }
    ],
    subtotal: 540,
    deliveryCharge: 30,
    totalAmount: 570,
    deliveryDate: { formattedDate: 'Saturday, Upcoming', dayOfWeekName: 'Saturday' },
    status: 'CONFIRMED', // Stages: PLACED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString()
  }
];

// POST /api/auth/login - Owner JWT Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    const token = 'jwt_owner_token_' + Date.now();
    return res.json({
      success: true,
      token,
      user: { email: OWNER_EMAIL, role: 'OWNER' }
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid Owner Email or Password' });
});

// GET /api/orders - Fetch all orders
app.get('/api/orders', (req, res) => {
  res.json(ordersDatabase);
});

// GET /api/orders/:id - Fetch single order by Order ID or Phone for tracking
app.get('/api/orders/:id', (req, res) => {
  const queryId = req.params.id.trim().toLowerCase();
  const found = ordersDatabase.find(o => 
    o.orderId.toLowerCase() === queryId || 
    o.customer.phone === queryId
  );
  if (found) {
    return res.json(found);
  }
  return res.status(404).json({ error: 'Order not found' });
});

// POST /api/orders - Create new order (including payment_proof)
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder || !newOrder.orderId) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  newOrder.status = newOrder.status || 'PLACED';
  newOrder.paymentStatus = newOrder.paymentStatus || 'PAID';

  ordersDatabase.unshift(newOrder);
  console.log(`[PJR Swagrooha Server] New Paid Order Placed with Screenshot: ${newOrder.orderId} for ${newOrder.customer.name} (${newOrder.area.name}) - Total: ₹${newOrder.totalAmount}`);
  
  res.status(201).json({ 
    success: true, 
    message: 'Order saved successfully with payment screenshot!',
    order: newOrder 
  });
});

// PUT /api/orders/:id/status - Owner Status Update
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status stage' });
  }

  const orderIndex = ordersDatabase.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  ordersDatabase[orderIndex].status = status;
  console.log(`[PJR Swagrooha Server] Order ${orderId} status updated to: ${status}`);

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    order: ordersDatabase[orderIndex]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PJR Swagrooha Foods Backend Server running on http://localhost:${PORT}`);
});
