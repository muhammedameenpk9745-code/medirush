export function renderVerificationEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MediRush Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7faf9;
      margin: 0;
      padding: 0;
      color: #0b2540;
    }
    .container {
      max-width: 560px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2eae6;
      box-shadow: 0 10px 25px -5px rgba(11, 37, 64, 0.05);
    }
    .header {
      background-color: #0b2540;
      padding: 32px 24px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .header-subtitle {
      color: #16b67a;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 6px;
    }
    .content {
      padding: 36px 32px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #0b2540;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .otp-box {
      background-color: #e8f8f1;
      border: 2px dashed #16b67a;
      border-radius: 16px;
      padding: 20px 16px;
      margin: 0 auto 28px auto;
      max-width: 320px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      color: #0f8f68;
      letter-spacing: 8px;
      margin: 0;
    }
    .expiration-notice {
      font-size: 13px;
      font-weight: 700;
      color: #e11d48;
      background-color: #ffe4e6;
      padding: 10px 16px;
      border-radius: 10px;
      display: inline-block;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #e2eae6;
      padding: 24px 32px;
      background-color: #f7faf9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      text-align: center;
    }
    .disclaimer {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">MediRush</h1>
      <div class="header-subtitle">MEDICINE. FAST. RELIABLE.</div>
    </div>
    
    <div class="content">
      <h2 class="title">Verify Your Email</h2>
      <p class="text">
        Thank you for choosing MediRush. Please use the 6-digit verification code below to complete your email verification and activate your account.
      </p>
      
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>

      <div class="expiration-notice">
        ⏰ This code expires in 10 minutes.
      </div>
      
      <p class="text" style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
        Do not share this code with anyone. MediRush representatives will never ask for your verification code.
      </p>
    </div>

    <div class="footer">
      <p class="disclaimer">
        If you did not create a MediRush account, you can safely ignore this email.
      </p>
      <p style="margin-top: 8px; font-weight: 600; color: #64748b;">
        © ${new Date().getFullYear()} MediRush Healthcare. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
