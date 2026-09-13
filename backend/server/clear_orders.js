const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://swagrooha_admin:24X31a6658@cluster0.btptxsg.mongodb.net/swagrooha?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB.');
    const result = await mongoose.connection.collection('orders').deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} orders.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting or deleting:', err);
    process.exit(1);
  });
