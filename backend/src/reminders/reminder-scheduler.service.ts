import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private isRunning = false;

  constructor(private readonly remindersService: RemindersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Skipping overlapping reminder scheduler tick');
      return;
    }

    this.isRunning = true;

    try {
      const sentCount = await this.remindersService.processDueReminders();

      if (sentCount > 0) {
        this.logger.log(`Processed ${sentCount} due reminder(s)`);
      }
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Reminder scheduler tick failed: ${errorName}`);
    } finally {
      this.isRunning = false;
    }
  }
}
