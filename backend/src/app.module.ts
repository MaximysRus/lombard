import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PledgeController } from './pledge/pledge.controller';
import { PledgeService } from './pledge/pledge.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [AppController, PledgeController],
  providers: [AppService, PledgeService, PrismaService],
})
export class AppModule { }
