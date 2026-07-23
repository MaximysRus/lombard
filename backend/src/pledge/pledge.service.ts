import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateRedemption } from './utils/calculator';
import { addDays } from 'date-fns';

@Injectable()
export class PledgeService {
  constructor(private prisma: PrismaService) { }

  async createPledge(data: any /* или CreatePledgeDto */) {
    const tariff = await this.prisma.tariff.findUnique({
      where: { id: data.tariffId },
      include: { categories: true }
    });

    if (!tariff) throw new BadRequestException('Тариф не найден');

    const allowedCategoryIds = tariff.categories.map(c => c.id);

    for (const item of data.items) {
      if (!allowedCategoryIds.includes(item.categoryId)) {
        throw new BadRequestException(
          `Ошибка: Категория ID ${item.categoryId} не разрешена для тарифа "${tariff.name}"`
        );
      }
    }

    const dueDate = addDays(new Date(), tariff.basePeriodDays);
    const totalLoan = data.items.reduce((sum, item) => sum + item.estimatedValue, 0);

    return this.prisma.pledge.create({
      data: {
        dueDate,
        totalLoan,
        tariff: { connect: { id: data.tariffId } },
        client: { connect: { id: data.clientId } },
        status: 'active',
        items: {
          create: data.items.map(item => ({
            name: item.name,
            attributesData: item.attributesData,
            estimatedValue: item.estimatedValue,
            category: { connect: { id: item.categoryId } }
          }))
        }
      }
    });
  }

  async redeemPledge(pledgeId: number, simulatedDate?: Date) {
    const pledge = await this.prisma.pledge.findUnique({
      where: { id: pledgeId },
      include: { tariff: true }
    });

    if (!pledge) throw new BadRequestException('Залог не найден');
    if (pledge.status === 'redeemed') throw new BadRequestException('Залог уже выкуплен');

    const today = simulatedDate || new Date();

    const calcResult = calculateRedemption(
      pledge.totalLoan,
      pledge.tariff.basePeriodRate,
      pledge.tariff.overdueRate,
      pledge.dueDate,
      today
    );

    return this.prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        status: 'redeemed',
        redeemedAt: today,
        redeemSum: calcResult.total
      }
    });
  }
}