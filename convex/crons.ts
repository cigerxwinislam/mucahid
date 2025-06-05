import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Run every week on Sunday at 00:00 UTC
crons.cron(
  'delete-old-feedback',
  '0 0 * * 0', // Every Sunday at midnight UTC
  internal.feedback.deleteOldFeedback,
);

export default crons;
