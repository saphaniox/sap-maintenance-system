const cron = require('node-cron');
const Notification = require('../models/Notification');
const Maintenance = require('../models/maintenance');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const emailService = require('./emailService');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  // Initialize all scheduled tasks
  init() {
    console.log('Initializing scheduler service...');

    // Check for upcoming maintenance (runs daily at 8 AM)
    this.scheduleMaintenanceReminders();

    // Check for low stock (runs daily at 9 AM)
    this.scheduleLowStockAlerts();

    // Generate recurring maintenance tasks (runs daily at midnight)
    this.scheduleRecurringMaintenance();

    // Clean old notifications (runs weekly on Sunday at midnight)
    this.scheduleNotificationCleanup();

    console.log(`Scheduler initialized with ${this.jobs.length} jobs`);
  }

  // Reminder for maintenance due within 3 days
  scheduleMaintenanceReminders() {
    const job = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('Running maintenance reminders check...');
        
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const upcomingMaintenance = await Maintenance.find({
          status: { $in: ['pending', 'in-progress'] },
          scheduledDate: {
            $gte: new Date(),
            $lte: threeDaysFromNow,
          },
        }).populate('machineId', 'name');

        for (const maintenance of upcomingMaintenance) {
          // Get all managers and admins
          const recipients = await User.find({
            role: { $in: ['admin', 'manager'] },
            isActive: true,
          });

          if (recipients.length > 0) {
            const userIds = recipients.map(u => u._id);
            const daysUntil = Math.ceil(
              (new Date(maintenance.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)
            );

            await Notification.createForUsers(userIds, {
              title: 'Upcoming Maintenance',
              message: `"${maintenance.title}" is scheduled in ${daysUntil} day(s) for ${maintenance.machineId?.name || 'Unknown Machine'}`,
              type: 'reminder',
              priority: maintenance.priority,
              relatedModel: 'Maintenance',
              relatedId: maintenance._id,
              actionUrl: `/maintenance`,
            });

            // Send emails
            for (const user of recipients) {
              await emailService.sendMaintenanceReminder(user.email, maintenance);
            }
          }
        }

        console.log(`Sent ${upcomingMaintenance.length} maintenance reminders`);
      } catch (error) {
        console.error('Error in maintenance reminders:', error);
      }
    });

    this.jobs.push(job);
  }

  // Alert for low stock items
  scheduleLowStockAlerts() {
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        console.log('Running low stock alerts check...');

        const lowStockItems = await Inventory.find({
          $expr: { $lte: ['$currentStock', '$minStock'] },
        });

        if (lowStockItems.length > 0) {
          const recipients = await User.find({
            role: { $in: ['admin', 'manager'] },
            isActive: true,
          });

          if (recipients.length > 0) {
            const userIds = recipients.map(u => u._id);

            await Notification.createForUsers(userIds, {
              title: 'Low Stock Alert',
              message: `${lowStockItems.length} item(s) are running low on stock`,
              type: 'inventory',
              priority: 'high',
              relatedModel: 'Inventory',
              actionUrl: `/inventory`,
            });

            // Send email summary
            for (const user of recipients) {
              await emailService.sendLowStockAlert(user.email, lowStockItems);
            }
          }
        }

        console.log(`Sent low stock alerts for ${lowStockItems.length} items`);
      } catch (error) {
        console.error('Error in low stock alerts:', error);
      }
    });

    this.jobs.push(job);
  }

  // Generate recurring maintenance tasks
  scheduleRecurringMaintenance() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('Running recurring maintenance generation...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all recurring maintenance templates that are active
        const recurringTemplates = await Maintenance.find({
          isRecurring: true,
          isTemplate: true,
          status: { $ne: 'cancelled' },
          $or: [
            { recurrenceEndDate: { $gte: today } },
            { recurrenceEndDate: null },
          ],
        });

        for (const template of recurringTemplates) {
          const nextScheduledDate = this.calculateNextScheduledDate(template);

          if (nextScheduledDate && nextScheduledDate <= today) {
            // Check if task already exists for this date
            const existingTask = await Maintenance.findOne({
              parentMaintenanceId: template._id,
              scheduledDate: {
                $gte: new Date(nextScheduledDate.setHours(0, 0, 0, 0)),
                $lt: new Date(nextScheduledDate.setHours(23, 59, 59, 999)),
              },
            });

            if (!existingTask) {
              // Create new maintenance task
              const newTask = new Maintenance({
                title: template.title,
                description: template.description,
                machineId: template.machineId,
                status: 'pending',
                priority: template.priority,
                scheduledDate: nextScheduledDate,
                dueDate: new Date(nextScheduledDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
                assignedTo: template.assignedTo,
                cost: template.cost,
                notes: template.notes,
                isRecurring: false,
                parentMaintenanceId: template._id,
              });

              await newTask.save();
              console.log(`Created recurring task: ${newTask.title}`);

              // Notify assigned user
              if (template.assignedTo) {
                const user = await User.findOne({ name: template.assignedTo });
                if (user) {
                  await Notification.create({
                    userId: user._id,
                    title: 'New Maintenance Task',
                    message: `Recurring task "${template.title}" has been scheduled`,
                    type: 'maintenance',
                    priority: template.priority,
                    relatedModel: 'Maintenance',
                    relatedId: newTask._id,
                    actionUrl: `/maintenance`,
                  });
                }
              }
            }
          }
        }

        console.log(`Processed ${recurringTemplates.length} recurring templates`);
      } catch (error) {
        console.error('Error generating recurring maintenance:', error);
      }
    });

    this.jobs.push(job);
  }

  // Clean up old read notifications (older than 30 days)
  scheduleNotificationCleanup() {
    const job = cron.schedule('0 0 * * 0', async () => {
      try {
        console.log('Running notification cleanup...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await Notification.deleteMany({
          isRead: true,
          createdAt: { $lt: thirtyDaysAgo },
        });

        console.log(`Cleaned up ${result.deletedCount} old notifications`);
      } catch (error) {
        console.error('Error in notification cleanup:', error);
      }
    });

    this.jobs.push(job);
  }

  // Calculate next scheduled date for recurring task
  calculateNextScheduledDate(template) {
    const lastScheduledDate = template.scheduledDate || new Date();
    const nextDate = new Date(lastScheduledDate);

    switch (template.recurrencePattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + template.recurrenceInterval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * template.recurrenceInterval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + template.recurrenceInterval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + template.recurrenceInterval);
        break;
      default:
        return null;
    }

    // Don't schedule past end date
    if (template.recurrenceEndDate && nextDate > template.recurrenceEndDate) {
      return null;
    }

    return nextDate;
  }

  // Stop all jobs
  stopAll() {
    this.jobs.forEach(job => job.stop());
    console.log('All scheduled jobs stopped');
  }
}

module.exports = new SchedulerService();
