import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropPhoneIndex = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    
    // Try to drop the phone_1 index
    console.log('🗑️  Dropping phone_1 index...');
    try {
      await db.collection('users').dropIndex('phone_1');
      console.log('✅ phone_1 index dropped successfully');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  phone_1 index does not exist');
      } else {
        throw error;
      }
    }

    // List all remaining indexes
    const indexes = await db.collection('users').getIndexes();
    console.log('\n📋 Remaining indexes on users collection:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}`);
    });

    console.log('\n✅ Cleanup complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropPhoneIndex();
