import crypto from "crypto"

const nlName = () => process.env.NEWSLETTER_NAME || "Newsletter"

export function generateUnsubscribeToken(email: string): { token: string; exp: number } {
  const secret = process.env.UNSUBSCRIBE_SECRET || ""
  const normalizedEmail = email.trim().toLowerCase()
  const exp = Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000)
  const token = crypto.createHmac("sha256", secret).update(`${normalizedEmail}:${exp}`).digest("hex")
  return { token, exp }
}

export function verifyUnsubscribeToken(email: string, token: string, exp?: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET || ""
  const normalizedEmail = email.trim().toLowerCase()
  if (exp) {
    const now = Math.floor(Date.now() / 1000)
    if (now > parseInt(exp, 10)) return false
    const expected = crypto.createHmac("sha256", secret).update(`${normalizedEmail}:${exp}`).digest("hex")
    return token === expected
  }
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex")
  return token === expected
}

export function appendCanspaFooter(html: string, email: string, baseUrl: string): string {
  const { token, exp } = generateUnsubscribeToken(email)
  const base = baseUrl.replace(/\/+$/, "")
  const unsubUrl = `${base}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&exp=${exp}`
  const prefsUrl = `${base}/preferences?email=${encodeURIComponent(email)}&token=${token}&exp=${exp}`
  const year = new Date().getFullYear()

  const footer = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:40px;border-top:1px solid rgba(0,0,0,0.06);">
  <tr><td style="padding:24px 0;text-align:center;">
    <p style="margin:0 0 8px;color:rgba(13,13,13,0.5);font-size:12px;">You subscribed to <strong>${nlName()}</strong>.</p>
    <p style="margin:0 0 8px;">
      <a href="${prefsUrl}" style="color:rgba(13,13,13,0.5);font-size:12px;text-decoration:underline;">Update preferences</a>
      &nbsp;·&nbsp;
      <a href="${unsubUrl}" style="color:rgba(13,13,13,0.5);font-size:12px;text-decoration:underline;">Unsubscribe</a>
    </p>
    <p style="margin:0;color:rgba(13,13,13,0.4);font-size:11px;">&copy; ${year} ${nlName()}</p>
  </td></tr>
</table>`

  if (html.toLowerCase().includes("</body>")) return html.replace(/<\/body>/i, `${footer}\n</body>`)
  if (html.toLowerCase().includes("</html>")) return html.replace(/<\/html>/i, `${footer}\n</html>`)
  return html + footer
}
