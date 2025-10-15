import { Module } from '@nestjs/common';
import { IAController } from './ia.controller';
import { IAService } from './ia.service';

@Module({
  controllers: [IAController],
  providers: [IAService],
  exports: [IAService],
})
export class IaModule {}
