const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender — uses Resend's testing domain if no custom domain is verified
const FROM_EMAIL = process.env.EMAIL_FROM || 'BuilderAI <onboarding@resend.dev>';

/**
 * Send a workspace invitation email
 */
async function sendInvitationEmail({ to, inviterName, workspaceName, inviteUrl }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to join "${workspaceName}"`,
      html: `
        <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a2e;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
              <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">BuilderAI</span>
            </div>
          </div>
          <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;color:#1a1a2e;">You've been invited!</h1>
          <p style="font-size:15px;color:#64748b;text-align:center;margin:0 0 32px;line-height:1.6;">
            <strong style="color:#1a1a2e;">${inviterName}</strong> has invited you to collaborate on the 
            <strong style="color:#1a1a2e;">"${workspaceName}"</strong> workspace.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(99,102,241,0.3);">
              Accept Invitation
            </a>
          </div>
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EmailService] Resend error:', error);
      return { success: false, error };
    }
    console.log(`[EmailService] Invitation email sent to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[EmailService] Failed to send invitation:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a contact form submission email (from deployed websites)
 */
async function sendContactEmail({ to, fromName, fromEmail, message, websiteName }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: fromEmail,
      subject: `New message from ${fromName} via ${websiteName || 'your website'}`,
      html: `
        <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a2e;">
          <div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
            <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;color:#1a1a2e;">📬 New Contact Form Submission</h2>
            <table style="width:100%;font-size:14px;color:#475569;">
              <tr><td style="padding:6px 0;font-weight:600;width:80px;">From:</td><td>${fromName}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600;">Email:</td><td><a href="mailto:${fromEmail}" style="color:#6366f1;">${fromEmail}</a></td></tr>
              <tr><td style="padding:6px 0;font-weight:600;">Website:</td><td>${websiteName || 'N/A'}</td></tr>
            </table>
          </div>
          <div style="padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
            <h3 style="font-size:14px;font-weight:600;margin:0 0 12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
            <p style="font-size:15px;line-height:1.7;color:#1a1a2e;margin:0;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="font-size:11px;color:#94a3b8;text-align:center;margin:24px 0 0;">
            Sent via BuilderAI · <a href="mailto:${fromEmail}" style="color:#6366f1;">Reply to ${fromName}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EmailService] Contact email error:', error);
      return { success: false, error };
    }
    console.log(`[EmailService] Contact email sent to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[EmailService] Failed to send contact email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a project invitation email
 */
async function sendProjectInvitationEmail({ to, inviterName, projectName, role, inviteUrl }) {
  try {
    const roleLabel = role === 'editor' ? 'edit' : 'view';
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to collaborate on "${projectName}"`,
      html: `
        <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a2e;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
              <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">BuilderAI</span>
            </div>
          </div>
          <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;color:#1a1a2e;">Project Invitation</h1>
          <p style="font-size:15px;color:#64748b;text-align:center;margin:0 0 24px;line-height:1.6;">
            <strong style="color:#1a1a2e;">${inviterName}</strong> invited you to <strong style="color:#1a1a2e;">${roleLabel}</strong> the project
            <strong style="color:#1a1a2e;">"${projectName}"</strong>.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:28px;text-align:center;">
            <span style="font-size:13px;color:#64748b;">Your access level: </span>
            <span style="font-size:13px;font-weight:700;color:#6366f1;text-transform:capitalize;">${role}</span>
          </div>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(99,102,241,0.3);">
              Accept Invitation
            </a>
          </div>
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    if (error) { console.error('[EmailService] Project invite Resend error:', error); return { success: false, error }; }
    console.log(`[EmailService] Project invite email sent to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[EmailService] Failed to send project invite:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendInvitationEmail, sendContactEmail, sendProjectInvitationEmail };
