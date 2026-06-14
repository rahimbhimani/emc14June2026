import { NotificationJob } from '../models/emcNotificationJob'
import { NotificationReceipt } from '../models/emcNotification'
import { sendViaChannel } from '../utils/notificationSender'

const POLL_INTERVAL_MS = 10_000   // check for pending jobs every 10 seconds
const BATCH_SIZE       = 20       // max jobs processed per tick

// Exponential backoff delays for retries (ms): 1 min → 5 min → 15 min
const BACKOFF_MS = [60_000, 300_000, 900_000]

async function processJobs() {
  const now = new Date()

  // 1. Find a batch of pending jobs that are ready to run
  const pending = await NotificationJob.find({
    status: 'pending',
    nextAttemptAt: { $lte: now },
  })
    .limit(BATCH_SIZE)
    .lean()

  if (!pending.length) return

  // 2. Atomically claim them — only update docs still in 'pending' state
  //    (guards against duplicate processing if multiple server instances are running)
  const ids = pending.map(j => j._id)
  await NotificationJob.updateMany(
    { _id: { $in: ids }, status: 'pending' },
    { $set: { status: 'processing' } },
  )

  // 3. Process each job concurrently
  await Promise.all(
    pending.map(async (job) => {
      const result = await sendViaChannel({
        channel:  job.channel,
        from:     job.from,
        to:       job.to,
        subject:  job.subject,
        body:     job.body,
        html:     job.html,
        metadata: job.metadata,
      })

      const newAttempts = job.attempts + 1

      if (result.ok) {
        // ── Success ─────────────────────────────────────────────────────────
        await NotificationJob.findByIdAndUpdate(job._id, {
          status: 'done',
          attempts: newAttempts,
          processedAt: new Date(),
          $unset: { lastError: 1 },
        })

        if (job.receiptId) {
          await NotificationReceipt.findByIdAndUpdate(job.receiptId, {
            status: 'delivered',
            deliveredAt: new Date(),
          })
        }
      }
      else {
        // ── Failure ──────────────────────────────────────────────────────────
        const isFinal = newAttempts >= job.maxAttempts
        const backoff  = BACKOFF_MS[Math.min(newAttempts - 1, BACKOFF_MS.length - 1)]

        await NotificationJob.findByIdAndUpdate(job._id, {
          status:       isFinal ? 'failed' : 'pending',
          attempts:     newAttempts,
          lastError:    result.error,
          nextAttemptAt: isFinal ? undefined : new Date(Date.now() + backoff),
        })

        if (isFinal && job.receiptId) {
          await NotificationReceipt.findByIdAndUpdate(job.receiptId, {
            status: 'failed',
            errorMessage: result.error,
          })
        }
      }
    }),
  )
}

// ── Nitro server plugin ──────────────────────────────────────────────────────
export default defineNitroPlugin((nitroApp) => {
  const timer = setInterval(() => {
    processJobs().catch(err =>
      console.error('[notification-queue] unhandled error:', err?.message),
    )
  }, POLL_INTERVAL_MS)

  // Clean up on server shutdown
  nitroApp.hooks.hookOnce('close', () => clearInterval(timer))

  console.log(`[notification-queue] started — polling every ${POLL_INTERVAL_MS / 1000}s`)
})
