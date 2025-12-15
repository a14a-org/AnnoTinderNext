
import { Resend } from "resend";

export async function sendVerificationRequest(params: {
    identifier: string;
    url: string;
    provider: { apiKey?: string; from?: string };
}) {
    const { identifier, url, provider } = params;
    if (!provider.apiKey) {
        throw new Error("RESEND_API_KEY is missing");
    }
    if (!provider.from) {
        throw new Error("Email 'from' address is missing");
    }
    const resend = new Resend(provider.apiKey);

    const { host } = new URL(url);

    // Instead of sending the magic link directly, we send a link to our intermediate page
    // We encode the actual magic link as a query parameter
    const confirmationUrl = `${new URL(url).origin}/auth/confirm?url=${encodeURIComponent(url)}`;

    try {
        await resend.emails.send({
            from: provider.from,
            to: identifier,
            subject: `Sign in to ${host}`,
            text: text({ url: confirmationUrl, host }),
            html: html({ url: confirmationUrl, host }),
        });
    } catch (error) {
        console.error("Failed to send verification email", error);
        throw new Error("Failed to send verification email");
    }
}

/**
 * Email HTML body
 * Insert invisible space into the URL to prevent being turned into a link by email clients
 * The main button points to our confirmation page
 */
function html(params: { url: string; host: string }) {
    const { url, host } = params;

    const brandColor = "#E63946"; // chili-coral, matching the brand
    const color = {
        background: "#f9f9f9",
        text: "#444",
        mainBackground: "#ffffff",
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: "#fff",
    };

    return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.background}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${host}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email, you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
    return `Sign in to ${host}\n${url}\n\n`;
}
