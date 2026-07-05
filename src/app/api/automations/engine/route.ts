import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { runAutomationsForTrigger } from '@/lib/automations/engine'
import type { AutomationTriggerType } from '@/types'

/**
 * Manual trigger for testing or for external integrations that want
 * to fire automations. Auth is required (minimum role: agent) — we
 * resolve the caller's account_id and dispatch over the account's
 * automations.
 *
 * Security: using requireRole('agent') instead of getCurrentAccount()
 * so viewers cannot trigger automations that send messages, create
 * deals or modify contact data via this endpoint.
 */
export async function POST(request: Request) {
  let accountId: string
  try {
    const ctx = await requireRole('agent') // 🔒 Security fix: min role required
    accountId = ctx.accountId
  } catch (err) {
    return toErrorResponse(err)
  }

  const body = await request.json().catch(() => null)
  if (!body?.trigger_type) {
    return NextResponse.json({ error: 'trigger_type required' }, { status: 400 })
  }

  await runAutomationsForTrigger({
    accountId,
    triggerType: body.trigger_type as AutomationTriggerType,
    contactId: body.contact_id ?? null,
    context: body.context ?? {},
  })

  return NextResponse.json({ ok: true })
}
