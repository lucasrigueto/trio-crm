/**
 * Evolution API Adapter
 * Trio CRM — Rigueto
 *
 * Faz a ponte entre o Trio CRM e a Evolution API self-hosted (Baileys/QR Code).
 * Espelha a interface de `meta-api.ts` para que o engine de automações e o
 * webhook possam chamar o sender correto sem saber qual driver está ativo.
 *
 * Docs Evolution API: https://doc.evolution-api.com
 */

export interface EvolutionTextArgs {
  apiUrl: string
  apiKey: string
  instanceName: string
  /** Número de telefone do destinatário no formato internacional (ex: 5531999990000) */
  to: string
  text: string
}

export interface EvolutionTemplateArgs extends Omit<EvolutionTextArgs, 'text'> {
  templateName: string
  /** Código de idioma no formato BCP-47 (ex: 'pt_BR', 'en_US') */
  language: string
  /** Parâmetros posicionais do template, em ordem */
  params: string[]
}

export interface EvolutionMediaArgs extends Omit<EvolutionTextArgs, 'text'> {
  mediaUrl: string
  mediaType: 'image' | 'video' | 'document' | 'audio'
  caption?: string
  filename?: string
}

export interface EvolutionSendResult {
  /** Identificador único da mensagem retornado pela Evolution API */
  messageId: string
}

// ─── Utilitários internos ─────────────────────────────────────────────────────

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'apikey': apiKey,
  }
}

function buildSendUrl(apiUrl: string, instanceName: string, endpoint: string): string {
  // Remove trailing slash do apiUrl
  const base = apiUrl.replace(/\/$/, '')
  return `${base}/${endpoint}/${instanceName}`
}

async function handleEvolutionResponse(res: Response, context: string): Promise<unknown> {
  if (!res.ok) {
    let errorBody = ''
    try {
      errorBody = await res.text()
    } catch {
      // ignore
    }
    throw new Error(
      `[Evolution API] ${context} falhou com status ${res.status}: ${errorBody}`
    )
  }
  return res.json()
}

// ─── Funções de envio ─────────────────────────────────────────────────────────

/**
 * Envia uma mensagem de texto simples via Evolution API.
 */
export async function evolutionSendText(
  args: EvolutionTextArgs
): Promise<EvolutionSendResult> {
  const url = buildSendUrl(args.apiUrl, args.instanceName, 'message/sendText')

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(args.apiKey),
    body: JSON.stringify({
      number: args.to,
      textMessage: { text: args.text },
    }),
  })

  const data = await handleEvolutionResponse(res, 'sendText') as { key?: { id?: string } }
  return { messageId: data?.key?.id ?? 'unknown' }
}

/**
 * Envia uma mensagem de template via Evolution API.
 *
 * NOTA: A Evolution API não suporta templates Meta nativamente via Baileys.
 * Esta função converte o template em texto formatado como fallback.
 * Para o driver oficial Meta, use `engineSendTemplate` de `meta-api.ts`.
 */
export async function evolutionSendTemplate(
  args: EvolutionTemplateArgs
): Promise<EvolutionSendResult> {
  // Monta o texto do template substituindo {{N}} pelos parâmetros
  // (comportamento de fallback — a Evolution/Baileys não envia templates oficiais)
  let text = `[Template: ${args.templateName}]`
  if (args.params.length > 0) {
    text += '\n' + args.params.join('\n')
  }

  return evolutionSendText({
    apiUrl: args.apiUrl,
    apiKey: args.apiKey,
    instanceName: args.instanceName,
    to: args.to,
    text,
  })
}

/**
 * Envia mídia (imagem, vídeo, documento, áudio) via Evolution API.
 */
export async function evolutionSendMedia(
  args: EvolutionMediaArgs
): Promise<EvolutionSendResult> {
  const url = buildSendUrl(args.apiUrl, args.instanceName, 'message/sendMedia')

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(args.apiKey),
    body: JSON.stringify({
      number: args.to,
      mediaMessage: {
        mediatype: args.mediaType,
        media: args.mediaUrl,
        caption: args.caption,
        fileName: args.filename,
      },
    }),
  })

  const data = await handleEvolutionResponse(res, 'sendMedia') as { key?: { id?: string } }
  return { messageId: data?.key?.id ?? 'unknown' }
}

// ─── Webhook / Normalização de payload ───────────────────────────────────────

/**
 * Shape mínimo de um payload de webhook da Evolution API.
 * O payload completo pode ter mais campos dependendo do tipo do evento.
 */
export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      id: string
      fromMe: boolean
    }
    message?: {
      conversation?: string
      imageMessage?: { caption?: string; url?: string }
      videoMessage?: { caption?: string; url?: string }
      documentMessage?: { title?: string; url?: string }
      audioMessage?: { url?: string }
    }
    messageType?: string
    messageTimestamp?: number
    pushName?: string
  }
}

/**
 * Verifica se um corpo de requisição é um webhook da Evolution API.
 * (Distingue do formato Meta Cloud API que tem `object: 'whatsapp_business_account'`)
 */
export function isEvolutionWebhookPayload(body: unknown): body is EvolutionWebhookPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.event === 'string' &&
    typeof b.instance === 'string' &&
    typeof b.data === 'object' &&
    b.data !== null
  )
}

/**
 * Extrai o número de telefone do remoteJid no formato E.164 (sem @s.whatsapp.net).
 * Ex: "5531999990000@s.whatsapp.net" → "5531999990000"
 */
export function extractPhoneFromJid(remoteJid: string): string {
  return remoteJid.split('@')[0].replace(/[^0-9]/g, '')
}

/**
 * Extrai o texto de uma mensagem Evolution API normalizado.
 */
export function extractMessageText(payload: EvolutionWebhookPayload): string | null {
  const msg = payload.data.message
  if (!msg) return null
  return (
    msg.conversation ??
    msg.imageMessage?.caption ??
    msg.videoMessage?.caption ??
    msg.documentMessage?.title ??
    null
  )
}
