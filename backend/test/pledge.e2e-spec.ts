import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { addDays, subDays } from 'date-fns';

describe('Pledge Redemption (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tariffStandard: any;
  let tariffPremium: any;
  let client: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    
    prisma = app.get(PrismaService);

    await prisma.pledgeItem.deleteMany();
    await prisma.pledge.deleteMany();
    await prisma.client.deleteMany();
    await prisma.itemCategory.deleteMany();
    await prisma.tariff.deleteMany();

    tariffStandard = await prisma.tariff.create({
      data: { name: 'Standard 5 Days', basePeriodDays: 5, basePeriodRate: 5, overdueRate: 1 }
    });
    
    tariffPremium = await prisma.tariff.create({
      data: { name: 'Premium 5 Days', basePeriodDays: 5, basePeriodRate: 10, overdueRate: 2 }
    });

    client = await prisma.client.create({
      data: { fullName: 'Иван Тестовый', phone: '+79990001122' }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const createMockPledge = async (tariffId: number, loan: number, dueDate: Date, status = 'active') => {
    return prisma.pledge.create({
      data: {
        tariffId,
        clientId: client.id,
        totalLoan: loan,
        dueDate,
        status,
      }
    });
  };

  it('1. Выкуп в срок (в пределах основного периода)', async () => {
    const dueDate = addDays(new Date(), 1); 
    const pledge = await createMockPledge(tariffStandard.id, 1000, dueDate);

    const res = await request(app.getHttpServer())
      .post(`/api/pledges/${pledge.id}/redeem`)
      .send({ simulatedDate: new Date().toISOString() });

    expect(res.status).toBe(201);
    
    expect(res.body.redeemSum).toBe(1050);
    expect(res.body.status).toBe('redeemed');
  });

  it('2. Выкуп с просрочкой', async () => {
    const dueDate = subDays(new Date(), 3); 
    const pledge = await createMockPledge(tariffStandard.id, 1000, dueDate);

    const res = await request(app.getHttpServer())
      .post(`/api/pledges/${pledge.id}/redeem`)
      .send({ simulatedDate: new Date().toISOString() });

    expect(res.status).toBe(201);
    
    expect(res.body.redeemSum).toBe(1080);
  });

  it('3. Граничный случай (выкуп ровно в дату "до")', async () => {
    const today = new Date();
    const pledge = await createMockPledge(tariffStandard.id, 1000, today);

    const res = await request(app.getHttpServer())
      .post(`/api/pledges/${pledge.id}/redeem`)
      .send({ simulatedDate: today.toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.redeemSum).toBe(1050);
  });

  it('4. Попытка выкупить уже выкупленный залог', async () => {
    const pledge = await createMockPledge(tariffStandard.id, 1000, new Date(), 'redeemed');

    const res = await request(app.getHttpServer())
      .post(`/api/pledges/${pledge.id}/redeem`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Залог уже выкуплен');
  });

  it('5. Разные тарифы дают разный результат при одинаковой сумме', async () => {
    const dueDate = addDays(new Date(), 2);

    const pledgeStandard = await createMockPledge(tariffStandard.id, 1000, dueDate);
    const pledgePremium = await createMockPledge(tariffPremium.id, 1000, dueDate);

    const res1 = await request(app.getHttpServer())
      .post(`/api/pledges/${pledgeStandard.id}/redeem`)
      .send({ simulatedDate: new Date().toISOString() });

    const res2 = await request(app.getHttpServer())
      .post(`/api/pledges/${pledgePremium.id}/redeem`)
      .send({ simulatedDate: new Date().toISOString() });

    expect(res1.body.redeemSum).toBe(1050);
    expect(res2.body.redeemSum).toBe(1100);
    expect(res1.body.redeemSum).not.toBe(res2.body.redeemSum);
  });
});