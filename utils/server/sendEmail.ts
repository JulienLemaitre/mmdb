import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const VERCEL_ENV = process.env.VERCEL_ENV;
const resend = new Resend(RESEND_API_KEY);

export default async function sendEmail({ type, content }) {
  console.log(`[sendEmail] ${type} | content`, JSON.stringify(content));

  const isString = typeof content === "string";
  const plain = isString ? content : JSON.stringify(content, null, 2);

  const htmlContent = isString
    ? `<p style="font-family: sans-serif;">${content}</p>`
    : `<pre style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-size: 13px; line-height: 1.4; overflow-x: auto; color: #333;">${JSON.stringify(content, null, 2)}</pre>`;

  const { data, error } = await resend.emails.send({
    from: "mmdb@colibriazulejos.com",
    // from: "notification@mmdb.com",
    to: "julem80+resend@pm.me",
    subject: `Mmdb [${VERCEL_ENV || "local dev"}] ${type}`,
    text: `type: ${type}\n\ncontent:\n${plain}`,
    html: `
      <div style="font-family: sans-serif; max-width: 800px;">
        <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Log: ${type}</h2>
        <p style="color: #666; font-size: 12px;">Env: ${VERCEL_ENV || "local dev"} | Date: ${new Date().toLocaleString()}</p>
        <div style="margin-top: 20px;">
          ${htmlContent}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error({ error });
    return { data, error };
  }

  console.log({ data });
  return { data, error };
}
