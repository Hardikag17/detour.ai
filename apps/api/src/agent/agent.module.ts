import { Module } from '@nestjs/common';
import { GoogleModule } from '../google/google.module';
import { MemoryModule } from '../memory/memory.module';
import { AgentService } from './agent.service';

@Module({
  imports: [GoogleModule, MemoryModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
