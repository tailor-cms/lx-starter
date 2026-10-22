import { Module } from '@nestjs/common';
import { CoursewareAssistantController } from './courseware-assistant.controller';
import { CoursewareAssistantService } from './courseware-assistant.service';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { ScenarioController } from './scenario.controller';
import { ScenarioService } from './scenario.service';
import { UserModule } from '../user/user.module';
import { ContentModule } from '../content/content.module';

/**
 * Learning Module
 * Handles learner activity tracking, progress management, profile updates,
 * AI-powered scenario role-play experiences, and the conversational
 * courseware assistant.
 */
@Module({
  imports: [UserModule, ContentModule],
  controllers: [
    LearningController,
    ScenarioController,
    CoursewareAssistantController,
  ],
  providers: [LearningService, ScenarioService, CoursewareAssistantService],
  exports: [LearningService, ScenarioService, CoursewareAssistantService],
})
export class LearningModule {}
