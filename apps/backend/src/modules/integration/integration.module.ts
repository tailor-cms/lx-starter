import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Integration } from './entities/integration.entity';
import { IntegrationService } from './integration.service';
import { IntegrationsController } from './integration.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Integration])],
  controllers: [IntegrationsController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
