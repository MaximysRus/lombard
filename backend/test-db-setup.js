const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });
console.log('⏳ Накатываем структуру на тестовую БД...');

try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Тестовая БД готова!');
} catch (error) {
  console.error('❌ Ошибка при подготовке тестовой БД');
  process.exit(1);
}