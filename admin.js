const { addTest, listTests, deactivateTest } = require('./dist/utils/admin');

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      await listTests();
      break;
      
    case 'add':
      // Example of adding a new test
      const newTest = {
        title: 'O\'zbek tili - Yangi test',
        description: 'Bu yangi test',
        questions: [
          {
            id: 'q1',
            question: 'Yangi savol?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            explanation: 'To\'g\'ri javob A'
          }
        ],
        timeLimit: 10
      };
      await addTest(newTest);
      break;
      
    case 'deactivate':
      const testId = process.argv[3];
      if (!testId) {
        console.log('❌ Please provide test ID');
        return;
      }
      await deactivateTest(testId);
      break;
      
    default:
      console.log('📋 Available commands:');
      console.log('  node admin.js list          - List all tests');
      console.log('  node admin.js add           - Add a new test (example)');
      console.log('  node admin.js deactivate <id> - Deactivate a test');
  }
}

main().catch(console.error);
