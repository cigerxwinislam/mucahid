import { Sandbox } from '@e2b/code-interpreter';
import { safeWaitUntil } from '@/lib/utils/safe-wait-until';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Creates or connects to a persistent sandbox instance
 * Persistent sandboxes are stored for up to 30 days
 *
 * @param userID - User identifier for sandbox ownership
 * @param template - Sandbox environment template name
 * @param timeoutMs - Operation timeout in milliseconds
 * @returns Connected or newly created sandbox instance
 *
 * Flow:
 * 1. Checks for existing sandbox in database (< 30 days old)
 * 2. If found with status "pausing", waits for pause completion
 * 3. If found with status "active"/"paused", attempts to resume
 * 4. If no valid sandbox found, creates new one
 * 5. Updates database with sandbox details
 */
export async function createOrConnectPersistentTerminal(
  userID: string,
  template: string,
  timeoutMs: number,
): Promise<Sandbox> {
  try {
    // Check for existing sandbox
    const existingSandbox = await convex.query(api.sandboxes.getSandbox, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      userId: userID,
      template,
    });

    if (existingSandbox?.sandbox_id) {
      let currentStatus = existingSandbox.status;

      if (currentStatus === 'pausing') {
        for (let i = 0; i < 5; i++) {
          const updatedSandbox = await convex.query(api.sandboxes.getSandbox, {
            serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
            userId: userID,
            template,
          });

          if (updatedSandbox?.status === 'paused') {
            currentStatus = 'paused';
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        if (currentStatus === 'pausing') {
          // Try to resume the sandbox if it's stuck in pausing state
          try {
            const sandbox = await Sandbox.resume(existingSandbox.sandbox_id, {
              timeoutMs,
            });

            await convex.mutation(api.sandboxes.updateSandboxStatus, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              sandboxId: existingSandbox.sandbox_id,
              status: 'active',
            });

            return sandbox;
          } catch (e) {
            console.error(
              `[${existingSandbox.sandbox_id}] Failed to recover sandbox from pausing state:`,
              e,
            );
            console.log(
              `[${userID}] Sandbox ${existingSandbox.sandbox_id} is stuck in pausing state, creating new one`,
            );

            // Delete the stuck sandbox record
            await convex.mutation(api.sandboxes.deleteSandbox, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              sandboxId: existingSandbox.sandbox_id,
            });

            // Create new persistent sandbox
            const sandbox = await Sandbox.create(template, {
              timeoutMs,
            });

            await convex.mutation(api.sandboxes.upsertSandbox, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              userId: userID,
              sandboxId: sandbox.sandboxId,
              template,
              status: 'active',
            });

            return sandbox;
          }
        }
      }

      if (currentStatus === 'active' || currentStatus === 'paused') {
        try {
          const sandbox = await Sandbox.resume(existingSandbox.sandbox_id, {
            timeoutMs,
          });

          await convex.mutation(api.sandboxes.updateSandboxStatus, {
            serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
            sandboxId: existingSandbox.sandbox_id,
            status: 'active',
          });

          return sandbox;
        } catch (e: any) {
          // Handle sandbox not found error (expired/deleted)
          if (e.name === 'NotFoundError' || e.message?.includes('not found')) {
            console.log(
              `[${userID}] Sandbox ${existingSandbox.sandbox_id} expired/deleted, creating new one`,
            );
            // Delete the expired sandbox record
            await convex.mutation(api.sandboxes.deleteSandbox, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              sandboxId: existingSandbox.sandbox_id,
            });
          } else {
            console.error(
              `[${userID}] Failed to resume sandbox ${existingSandbox.sandbox_id}:`,
              e,
            );
          }
        }
      }
    }

    // Create new persistent sandbox
    const sandbox = await Sandbox.create(template, {
      timeoutMs,
    });

    await convex.mutation(api.sandboxes.upsertSandbox, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      userId: userID,
      sandboxId: sandbox.sandboxId,
      template,
      status: 'active',
    });

    return sandbox;
  } catch (error) {
    console.error(`[${userID}] Error in createOrConnectTerminal:`, error);
    throw error;
  }
}

/**
 * Initiates a background task to pause an active sandbox
 * Uses Vercel's waitUntil to handle the pause operation asynchronously
 *
 * @param sandbox - Active sandbox instance to pause
 * @returns sandboxId if pause initiated, null if invalid sandbox
 *
 * State Transitions:
 * 1. active -> pausing: Initial state update
 * 2. pausing -> paused: Successful pause
 * 3. pausing -> active: Failed pause (reverts)
 *
 * Note: The actual pause operation continues in the background
 * after this function returns
 */
export async function pauseSandbox(sandbox: Sandbox): Promise<string | null> {
  if (!sandbox?.sandboxId) {
    console.error('Background: No sandbox ID provided for pausing');
    return null;
  }

  // Update status to pausing
  await convex.mutation(api.sandboxes.updateSandboxStatus, {
    serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
    sandboxId: sandbox.sandboxId,
    status: 'pausing',
  });

  // Start background task and return immediately
  safeWaitUntil(
    sandbox
      .pause()
      .then(async () => {
        await convex.mutation(api.sandboxes.updateSandboxStatus, {
          serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
          sandboxId: sandbox.sandboxId,
          status: 'paused',
        });
      })
      .catch(async (error) => {
        console.error(
          `Background: Error pausing sandbox ${sandbox.sandboxId}:`,
          error,
        );
        await convex.mutation(api.sandboxes.updateSandboxStatus, {
          serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
          sandboxId: sandbox.sandboxId,
          status: 'active',
        });
      }),
  );

  return sandbox.sandboxId;
}
