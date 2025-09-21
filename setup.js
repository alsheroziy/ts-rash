const fs = require('fs');
const path = require('path');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/uzbek_test_bot

# Server Configuration
PORT=3000
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created! Please update it with your bot token.');
} else {
  console.log('ℹ️ .env file already exists.');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Update .env file with your Telegram bot token');
console.log('2. Make sure MongoDB is running');
console.log('3. Run: npm run build');
console.log('4. Run: npm start');
console.log('\n🎉 Bot is ready to use!');
