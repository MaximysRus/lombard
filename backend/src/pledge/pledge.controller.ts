import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PledgeService } from './pledge.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api')
export class PledgeController {
  constructor(
    private readonly pledgeService: PledgeService,
    private readonly prisma: PrismaService
  ) {}

  @Get('tariffs')
  getTariffs() {
    return this.prisma.tariff.findMany();
  }

  @Get('categories')
  getCategories() {
    return this.prisma.itemCategory.findMany();
  }

  @Get('clients')
  getClients() {
    return this.prisma.client.findMany();
  }

  @Post('clients')
  createClient(@Body() data: { fullName: string; phone: string }) {
    return this.prisma.client.create({ data });
  }

  @Post('pledges')
  createPledge(@Body() data: any) {
    return this.pledgeService.createPledge(data);
  }

  @Get('clients/:clientId/active-pledges')
  getActivePledges(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.prisma.pledge.findMany({
      where: { clientId, status: 'active' },
      include: { items: true, tariff: true },
    });
  }

  @Post('pledges/:id/redeem')
  redeemPledge(@Param('id', ParseIntPipe) id: number, @Body() data?: { simulatedDate?: string }) {
    const simDate = data?.simulatedDate ? new Date(data.simulatedDate) : undefined;
    return this.pledgeService.redeemPledge(id, simDate);
  }
}