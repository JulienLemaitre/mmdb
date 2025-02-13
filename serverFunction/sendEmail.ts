import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

export default async function sendEmail({ type, content }) {
  console.log(`[sendEmail] ${type} | content`, JSON.stringify(content));

  const { data, error } = await resend.emails.send({
    from: "mmdb@colibriazulejos.com",
    // from: "notification@mmdb.com",
    to: "julem80+resend@pm.me",
    subject: "techLog from mmdb",
    html: `<p>content: ${typeof content === "string" ? content : JSON.stringify(content)}</p>`,
  });

  if (error) {
    console.error({ error });
    return { data, error };
  }

  console.log({ data });
  return { data, error };
}
