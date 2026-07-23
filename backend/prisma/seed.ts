import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало работы сидера...');

  let tariffTech = await prisma.tariff.findFirst({ where: { name: 'Техника 5 дней 2.15%' } });
  if (!tariffTech) {
    tariffTech = await prisma.tariff.create({
      data: { name: 'Техника 5 дней 2.15%', basePeriodDays: 5, basePeriodRate: 2.15, overdueRate: 0.5 },
    });
    console.log('Создан тариф: Техника');
  }

  let tariffJewelry = await prisma.tariff.findFirst({ where: { name: 'Ювелирка 10 дней 5%' } });
  if (!tariffJewelry) {
    tariffJewelry = await prisma.tariff.create({
      data: { name: 'Ювелирка 10 дней 5%', basePeriodDays: 10, basePeriodRate: 5.0, overdueRate: 1.0 },
    });
    console.log('Создан тариф: Ювелирка');
  }

  const categoriesCount = await prisma.itemCategory.count();
  if (categoriesCount === 0) {
    await prisma.itemCategory.createMany({
      data: [
        { name: 'Смартфоны', attributes: ['Модель', 'Объем памяти', 'Состояние экрана'], tariffId: tariffTech.id },
        { name: 'Мониторы', attributes: ['Диагональ', 'Разрешение', 'Дефекты матрицы'], tariffId: tariffTech.id },
        { name: 'Золото', attributes: ['Проба', 'Компания', 'Царапины'], tariffId: tariffJewelry.id },
        { name: 'Серебро', attributes: ['Проба', 'Компания', 'Царапины'], tariffId: tariffJewelry.id },
      ],
    });
    console.log('Категории успешно добавлены.');
  } else {
    console.log('Категории уже существуют, пропускаем.');
  }

  console.log('Сидирование завершено!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Ошибка при выполнении сидера:', e);
    await prisma.$disconnect();
    throw e;
  });