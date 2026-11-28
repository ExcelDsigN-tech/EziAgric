/**
 * SMS Service
 *
 * Thin HTTP-gateway client. Configure with SMS_API_URL and SMS_API_KEY.
 * Throws on failure; callers decide whether that is fatal.
 */

export async function sendSms(to: string, message: string): Promise<void> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (!url || !key) throw new Error("SMS gateway not configured (SMS_API_URL / SMS_API_KEY)");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) throw new Error(`SMS gateway responded ${res.status}`);
}
