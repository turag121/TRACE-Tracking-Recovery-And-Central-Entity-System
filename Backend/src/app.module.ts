import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { MprModule } from './missing_person_reporter/mpr.module';
import { EmailModule } from './email/email.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { AuthModule } from './auth/auth.module';
import { CaseOfficerModule } from './case_officer/case-officer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AdminModule,
    MprModule,
    EmailModule,
    VolunteerModule,
    AuthModule,
    CaseOfficerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
