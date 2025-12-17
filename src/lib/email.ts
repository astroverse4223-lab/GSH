import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface DataExportEmailData {
  userName: string;
  downloadUrl: string;
  expiryDate: string;
  requestId: string;
}

class EmailService {
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail =
      process.env.SMTP_FROM_EMAIL || "noreply@realmoflegends.info";
    this.fromName = process.env.SMTP_FROM_NAME || "Gamer Social Hub";
  }

  async sendVerificationEmail(
    email: string,
    username: string,
    token: string
  ): Promise<boolean> {
    const verificationUrl = `https://realmoflegends.info/api/auth/verify?token=${token}`;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #4F46E5;">Welcome to Gamer Social Hub!</h1>
        <p>Hi ${username},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Verify your email address - Gamer Social Hub",
      html,
    });
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_PASSWORD) {
        console.warn(
          "SMTP password (Resend API key) not configured. Email not sent."
        );
        return false;
      }

      const { data: result, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      if (error) {
        console.error("Error sending email:", error);
        return false;
      }
      console.log("✅ Email sent successfully:", {
        id: result.id,
        to: to,
        subject: subject,
        from: this.fromEmail,
      });
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", {
        to: to,
        subject: subject,
        error: error,
      });
      return false;
    }
  }

  async sendDataExportReadyEmail(
    email: string,
    data: DataExportEmailData
  ): Promise<boolean> {
    const subject = "Your Data Export is Ready - Gamer Social Hub";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #FF6B1A, #FF3366);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border: 1px solid #e9ecef;
            }
            .download-button {
              display: inline-block;
              background: linear-gradient(135deg, #FF6B1A, #FF3366);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎮 Your Data Export is Ready!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            
            <p>Great news! Your data export from Gamer Social Hub has been processed and is ready for download.</p>
            
            <div style="text-align: center;">
              <a href="${data.downloadUrl}" class="download-button">
                📥 Download My Data
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This download link will expire on <strong>${
                  data.expiryDate
                }</strong></li>
                <li>The link is unique to you and should not be shared</li>
                <li>Your export contains personal information - store it securely</li>
                <li>Request ID: <code>${data.requestId}</code></li>
              </ul>
            </div>
            
            <h3>What's included in your export:</h3>
            <ul>
              <li>Profile information and settings</li>
              <li>Posts, comments, and reactions</li>
              <li>Friends and social connections</li>
              <li>Privacy settings and preferences</li>
              <li>Marketplace listings and transactions</li>
              <li>Messages and notifications</li>
            </ul>
            
            <p>If you have any questions or didn't request this export, please contact our support team immediately.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
            <p>If you no longer wish to receive these emails, you can update your notification preferences in your account settings.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendDataExportRequestConfirmation(
    email: string,
    userName: string,
    requestId: string
  ): Promise<boolean> {
    const subject = "Data Export Request Received - Gamer Social Hub";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0066CC, #FF6B1A);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border: 1px solid #e9ecef;
            }
            .info-box {
              background: #d1ecf1;
              border: 1px solid #b6d4db;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Data Export Request Confirmed</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We've received your request to export your data from Gamer Social Hub. We're now processing your request.</p>
            
            <div class="info-box">
              <strong>📊 What happens next:</strong>
              <ol>
                <li>We're collecting all your data (this may take a few minutes)</li>
                <li>Your data will be compiled into a secure downloadable file</li>
                <li>You'll receive another email with the download link when ready</li>
                <li>The download link will be valid for 7 days</li>
              </ol>
            </div>
            
            <p><strong>Request ID:</strong> <code>${requestId}</code></p>
            <p><strong>Estimated completion:</strong> Within the next 10 minutes</p>
            
            <p>If you didn't request this export, please contact our support team immediately for security purposes.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendAccountDeletionScheduledEmail(
    email: string,
    userName: string,
    scheduledDate: string,
    requestId: string
  ): Promise<boolean> {
    const subject = "⚠️ Account Deletion Scheduled - Gamer Social Hub";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #dc3545, #ff6b6b);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 30px;
            }
            .warning-box {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .cancel-button {
              display: inline-block;
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
            .countdown {
              font-size: 1.2em;
              font-weight: bold;
              color: #dc3545;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Account Deletion Scheduled</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We've received your request to delete your Gamer Social Hub account. This email confirms that your account deletion has been scheduled.</p>
            
            <div class="countdown">
              🕐 Your account will be permanently deleted on:<br>
              <strong>${scheduledDate}</strong>
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Important Information:</strong>
              <ul>
                <li><strong>30-Day Grace Period:</strong> You have 30 days to change your mind</li>
                <li><strong>Data Loss:</strong> All your posts, friends, messages, and account data will be permanently deleted</li>
                <li><strong>Cannot Undo:</strong> After deletion, your account cannot be recovered</li>
                <li><strong>Immediate Effect:</strong> Your account is still active until the deletion date</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://realmoflegends.info/privacy?cancelDeletion=${requestId}" class="cancel-button">
                🛑 Cancel Account Deletion
              </a>
            </div>
            
            <h3>What happens next:</h3>
            <ol>
              <li>Your account remains active for the next 30 days</li>
              <li>We'll send you reminder emails at 7 days and 1 day before deletion</li>
              <li>On ${scheduledDate}, your account and all data will be permanently deleted</li>
              <li>You can cancel this request anytime before the deletion date</li>
            </ol>
            
            <p><strong>Request ID:</strong> <code>${requestId}</code></p>
            
            <p>If you didn't request this deletion, please contact our support team immediately and change your password for security.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
            <p><strong>Need help?</strong> Contact our support team if you have questions.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendAccountDeletionCancelledEmail(
    email: string,
    userName: string
  ): Promise<boolean> {
    const subject = "✅ Account Deletion Cancelled - Gamer Social Hub";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #d4edda;
              border: 2px solid #28a745;
              padding: 30px;
            }
            .success-box {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .continue-button {
              display: inline-block;
              background: linear-gradient(135deg, #FF6B1A, #FF3366);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Account Deletion Cancelled</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Great news! Your account deletion request has been successfully cancelled. Your Gamer Social Hub account is safe and will remain active.</p>
            
            <div class="success-box">
              <h3>🎉 Your account is secure!</h3>
              <p>You can continue using all features of Gamer Social Hub without any interruption.</p>
            </div>
            
            <h3>What this means:</h3>
            <ul>
              <li>✅ Your account deletion has been cancelled</li>
              <li>✅ All your data, posts, and friends remain intact</li>
              <li>✅ You can continue using your account normally</li>
              <li>✅ No further deletion emails will be sent</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXTAUTH_URL
              }/feed" class="continue-button">
                🎮 Continue Gaming!
              </a>
            </div>
            
            <p>If you have any questions or didn't cancel this deletion yourself, please contact our support team immediately.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
            <p>Welcome back to the community! 🎮</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendAccountDeletionReminderEmail(
    email: string,
    userName: string,
    daysRemaining: number,
    scheduledDate: string,
    requestId: string
  ): Promise<boolean> {
    const subject = `⏰ ${daysRemaining} Day${
      daysRemaining > 1 ? "s" : ""
    } Until Account Deletion - Gamer Social Hub`;

    const urgencyColor = daysRemaining <= 1 ? "#dc3545" : "#ffc107";
    const urgencyText = daysRemaining <= 1 ? "URGENT" : "REMINDER";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${urgencyColor}, #ff6b6b);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff3cd;
              border: 2px solid ${urgencyColor};
              padding: 30px;
            }
            .countdown {
              background: ${urgencyColor};
              color: white;
              padding: 20px;
              border-radius: 6px;
              text-align: center;
              margin: 20px 0;
              font-size: 1.3em;
              font-weight: bold;
            }
            .cancel-button {
              display: inline-block;
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
              font-size: 1.1em;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⏰ ${urgencyText}: Account Deletion Reminder</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>This is a ${urgencyText.toLowerCase()} reminder that your Gamer Social Hub account is scheduled for deletion.</p>
            
            <div class="countdown">
              ⚠️ ${daysRemaining} day${
      daysRemaining > 1 ? "s" : ""
    } remaining until deletion<br>
              Deletion Date: ${scheduledDate}
            </div>
            
            <p><strong>What will be deleted:</strong></p>
            <ul>
              <li>Your profile and account information</li>
              <li>All posts, comments, and reactions</li>
              <li>Friends list and messages</li>
              <li>Marketplace listings and transactions</li>
              <li>Gaming achievements and statistics</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXTAUTH_URL
              }/privacy?cancelDeletion=${requestId}" class="cancel-button">
                🛑 CANCEL DELETION NOW
              </a>
            </div>
            
            <p><strong>Important:</strong> If you want to keep your account, you must cancel the deletion before ${scheduledDate}. After this date, your account cannot be recovered.</p>
            
            <p>Request ID: <code>${requestId}</code></p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Welcome Email
  async sendWelcomeEmail(
    email: string,
    userName: string,
    userId: string
  ): Promise<boolean> {
    const subject = "🎮 Welcome to Gamer Social Hub!";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0066CC, #FF6B1A);
              color: white;
              padding: 40px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 40px;
              border: 1px solid #e9ecef;
            }
            .welcome-box {
              background: linear-gradient(135deg, #FF3366, #FF6B1A);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .feature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .feature-item {
              background: #e9ecef;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #FF3366, #FF6B1A);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎮 Welcome to the Community!</h1>
            <p style="font-size: 1.2em; margin: 10px 0 0 0;">Get ready to level up your gaming experience!</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>🎉 Welcome, ${userName}!</h2>
              <p>Your adventure in Gamer Social Hub begins now!</p>
            </div>
            
            <p>You've joined the ultimate community for gamers! Here's what you can do:</p>
            
            <div class="feature-grid">
              <div class="feature-item">
                <strong>🎮 Gaming Profiles</strong><br>
                Show off your gaming achievements
              </div>
              <div class="feature-item">
                <strong>👥 Connect</strong><br>
                Find gaming buddies worldwide
              </div>
              <div class="feature-item">
                <strong>📝 Share Posts</strong><br>
                Post your epic gaming moments
              </div>
              <div class="feature-item">
                <strong>🛒 Marketplace</strong><br>
                Buy & sell gaming gear
              </div>
              <div class="feature-item">
                <strong>📺 Live Streams</strong><br>
                Watch and stream gameplay
              </div>
              <div class="feature-item">
                <strong>🎵 Music Player</strong><br>
                Add your gaming soundtrack
              </div>
            </div>
            
            <h3>🚀 Quick Start Guide:</h3>
            <ol>
              <li><strong>Complete your profile:</strong> Add a bio, gaming interests, and profile picture</li>
              <li><strong>Find friends:</strong> Connect with other gamers in your area or favorite games</li>
              <li><strong>Join groups:</strong> Find gaming communities that match your interests</li>
              <li><strong>Share your first post:</strong> Tell the community about your favorite game!</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="https://realmoflegends.info/users/${userId}" class="cta-button">
                🎯 Complete Your Profile
              </a>
            </div>
            
            <p>Need help getting started? Check out our <a href="https://realmoflegends.info/help">Help Center</a> or reply to this email with any questions.</p>
            
            <p>Happy gaming!</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
            <p>🎮 Level up your gaming experience with us!</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  // Password Reset Email
  async sendPasswordResetEmail(
    email: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const subject = "🔐 Password Reset Request - Gamer Social Hub";
    const resetUrl = `https://realmoflegends.info/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6f42c1, #e83e8c);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border: 1px solid #e9ecef;
            }
            .security-warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #343a40;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
            .expire-info {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We received a request to reset your password for your Gamer Social Hub account.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">
                🔓 Reset My Password
              </a>
            </div>
            
            <div class="expire-info">
              <strong>⏰ This link expires in 1 hour</strong><br>
              For security reasons, this password reset link will only work for the next 60 minutes.
            </div>
            
            <div class="security-warning">
              <strong>🛡️ Security Information:</strong>
              <ul>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you click the reset link</li>
                <li>This link can only be used once</li>
                <li>Make sure you're on the official Gamer Social Hub website</li>
              </ul>
            </div>
            
            <h3>Trouble clicking the button?</h3>
            <p>Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6f42c1; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <p>If you continue to have problems or didn't request this reset, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} Gamer Social Hub. All rights reserved.</p>
            <p><strong>Keep your account secure!</strong> Never share your password with anyone.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

export const emailService = new EmailService();

// Report email function
interface ReportEmailData {
  reportId: string;
  reporterName: string;
  reporterEmail: string;
  type: string;
  category: string;
  description: string;
  targetName: string;
  targetId: string;
}

export const sendReportEmail = async (data: ReportEmailData) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_ADMIN_EMAIL;

  console.log("Report Email Debug:");
  console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
  console.log("RESEND_ADMIN_EMAIL:", process.env.RESEND_ADMIN_EMAIL);
  console.log("Target email:", adminEmail);

  if (!adminEmail) {
    console.error("No admin email configured for reports");
    return false;
  }

  const subject = `🚨 New ${data.type} Report - ${data.category}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Report Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 New Report Submitted</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Report ID: ${
            data.reportId
          }</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; border-top: none;">
          <h2 style="color: #495057; margin-top: 0;">Report Details</h2>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #dc3545;">
            <strong>Type:</strong> ${data.type}<br>
            <strong>Category:</strong> ${data.category}<br>
            <strong>Reported Item:</strong> ${data.targetName} (ID: ${
    data.targetId
  })
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <strong>Reporter:</strong> ${data.reporterName}<br>
            <strong>Reporter Email:</strong> ${data.reporterEmail}
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <strong>Description:</strong><br>
            <p style="margin: 5px 0; padding: 10px; background: #f8f9fa; border-radius: 3px;">
              ${data.description}
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>⚠️ Action Required:</strong><br>
            Please review this report and take appropriate action. You can access the admin panel to manage reports.
          </div>
        </div>
        
        <div style="background: #6c757d; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Realm of Legends. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated report notification.</p>
        </div>
      </body>
    </html>
  `;

  return emailService
    .sendEmail({ to: adminEmail, subject, html })
    .then((result) => {
      console.log("Report email result:", result);
      if (result) {
        console.log("✅ Report email sent successfully to:", adminEmail);
      } else {
        console.error("❌ Failed to send report email to:", adminEmail);
      }
      return result;
    })
    .catch((error) => {
      console.error("🚨 Report email error:", error);
      return false;
    });
};
