# UniFund Email Templates

These templates are designed to match the UniFund brand (Muted Navy & Teal). You can use these in your Supabase Auth settings or your email service provider (SendGrid, Postmark, etc.).

**Note:** Replace `https://your-domain.com` in the image tags with your actual hosted domain where the logo is stored (e.g., `https://unifund.co.za`).

## 1. Confirm Your Email
**Supabase Template Category:** "Confirm signup"

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email - UniFund</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; color: #1a3549; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #2e5a7d; padding: 30px; text-align: center; }
        .content { padding: 40px; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 30px; background-color: #2e5a7d; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6a92b4; background-color: #f8fafc; }
        h1 { color: #ffffff; margin: 0; font-size: 24px; }
        h2 { color: #234563; font-size: 20px; margin-top: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nsgucgicmfrudzedynuj.supabase.co/storage/v1/object/public/logo/logo.png" alt="UniFund Logo" width="120" style="display: block; margin: 0 auto 15px auto;">
            <h1>UniFund</h1>
        </div>
        <div class="content">
            <h2>Welcome to UniFund!</h2>
            <p>Hello,</p>
            <p>Thank you for joining UniFund. To start creating campaigns or supporting students, please confirm your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </div>
            <p style="margin-top: 30px;">If you didn't create an account with UniFund, you can safely ignore this email.</p>
            <p>Warm regards,<br>The UniFund Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 UniFund. All rights reserved.</p>
            <p>Empowering Students, Fueling Futures.</p>
        </div>
    </div>
</body>
</html>
```

---

## 2. Reset Your Password
**Supabase Template Category:** "Reset password"

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - UniFund</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; color: #1a3549; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #2e5a7d; padding: 30px; text-align: center; }
        .content { padding: 40px; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 30px; background-color: #d4a853; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6a92b4; background-color: #f8fafc; }
        h1 { color: #ffffff; margin: 0; }
        .alert { padding: 15px; background-color: #faf2f2; border-left: 4px solid #c75a5a; color: #a84848; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nsgucgicmfrudzedynuj.supabase.co/storage/v1/object/public/logo/logo.png" alt="UniFund Logo" width="120" style="display: block; margin: 0 auto 15px auto;">
            <h1>UniFund</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your UniFund account.</p>
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
            </div>
            <p style="margin-top: 30px;">For your security, this link will expire in 24 hours. If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            <p>Stay secure,<br>The UniFund Security Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 UniFund. Help Desk: support@unifund.co.za</p>
        </div>
    </div>
</body>
</html>
```

---

## 3. Password Changed Notification
**Usage:** Security alert after successful password change.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert: Password Changed</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; color: #1a3549; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
        .header { background-color: #1a3549; padding: 30px; text-align: center; }
        .content { padding: 40px; line-height: 1.6; }
        .alert-box { border: 1px solid #dae4ed; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6a92b4; }
        h1 { color: #ffffff; margin: 0; font-size: 22px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nsgucgicmfrudzedynuj.supabase.co/storage/v1/object/public/logo/logo.png" alt="UniFund Logo" width="120" style="display: block; margin: 0 auto 15px auto;">
            <h1>Security Notification</h1>
        </div>
        <div class="content">
            <h2>Your password was changed</h2>
            <p>Hello,</p>
            <div class="alert-box">
                <p>This is a confirmation that the password for your account <strong>{{ .Email }}</strong> was recently changed.</p>
                <p><strong>When:</strong> {{ .Timestamp }}</p>
            </div>
            <p style="margin-top: 25px;"><strong>If you did this:</strong> No further action is required.</p>
            <p><strong>If you didn't do this:</strong> Your account may have been compromised. Please reset your password immediately and contact our security team.</p>
            <p>Best regards,<br>UniFund Security</p>
        </div>
        <div class="footer">
            <p>UniFund - Safeguarding Student Education</p>
        </div>
    </div>
</body>
</html>
```

---

## 4. Phone Number Changed Notification
**Usage:** Security alert for profile updates.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert: Phone Updated</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; color: #1a3549; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
        .header { background-color: #3d6b75; padding: 30px; text-align: center; }
        .content { padding: 40px; line-height: 1.6; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6a92b4; }
        h1 { color: #ffffff; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nsgucgicmfrudzedynuj.supabase.co/storage/v1/object/public/logo/logo.png" alt="UniFund Logo" width="120" style="display: block; margin: 0 auto 15px auto;">
            <h1>Profile Update</h1>
        </div>
        <div class="content">
            <h2>Your phone number was updated</h2>
            <p>Hello,</p>
            <p>The phone number associated with your UniFund account was recently changed to <strong>{{ .NewPhone }}</strong>.</p>
            <p>If you made this change, you're all set! If you didn't authorize this, please log into your dashboard and review your security settings immediately.</p>
            <p>Thank you,<br>The UniFund Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 UniFund. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```
