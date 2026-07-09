jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e60-7f2c-75be-89a4-cfd939f272ce'),
}));

import { RemindersService } from './reminders.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';

describe('ReminderSchedulerService', () => {
  it('does not crash when reminder processing fails', async () => {
    const remindersService = {
      processDueReminders: jest.fn().mockRejectedValue(new Error('smtp down')),
    };
    const scheduler = new ReminderSchedulerService(
      remindersService as unknown as RemindersService,
    );

    await expect(scheduler.processDueReminders()).resolves.toBeUndefined();
  });
});
