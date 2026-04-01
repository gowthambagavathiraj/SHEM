package com.info.shems.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🔐 Your Login OTP – Smart Home Energy Management System");

            String htmlContent = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f6f8;
                                padding: 20px;
                            }
                            .container {
                                max-width: 500px;
                                margin: auto;
                                background: #ffffff;
                                padding: 20px;
                                border-radius: 8px;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                            }
                            .header {
                                text-align: center;
                                color: #2c3e50;
                            }
                            .otp-box {
                                margin: 20px 0;
                                padding: 15px;
                                text-align: center;
                                font-size: 24px;
                                font-weight: bold;
                                color: #ffffff;
                                background-color: #4CAF50;
                                border-radius: 6px;
                                letter-spacing: 4px;
                            }
                            .text {
                                font-size: 14px;
                                color: #555555;
                            }
                            .footer {
                                margin-top: 20px;
                                font-size: 12px;
                                color: #888888;
                                text-align: center;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2 class="header">Smart Home Energy Management System</h2>

                            <p class="text">
                                Hello,<br><br>
                                Use the OTP below to complete your login.
                            </p>

                            <div class="otp-box">
                                %s
                            </div>

                            <p class="text">
                                This OTP is valid for <b>5 minutes</b>.<br>
                                If you did not request this login, please ignore this email.
                            </p>

                            <div class="footer">
                                © 2026 Smart Home Energy Management System<br>
                                Secure • Smart • Efficient
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(otp);

            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("❌ Failed to send email to " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please check your Gmail SMTP settings.", e);
        }
    }

    public void sendResetPasswordLink(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🔑 Reset Your Password – Smart Home Energy Management System");

            String htmlContent = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #f8fafc;
                                padding: 40px 20px;
                                margin: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: auto;
                                background: #ffffff;
                                padding: 40px;
                                border-radius: 16px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                                border: 1px solid #e2e8f0;
                            }
                            .header {
                                text-align: center;
                                color: #1e293b;
                                font-size: 24px;
                                font-weight: 700;
                                margin-bottom: 24px;
                            }
                            .text {
                                font-size: 16px;
                                color: #475569;
                                line-height: 1.6;
                            }
                            .button-container {
                                text-align: center;
                                margin: 32px 0;
                            }
                            .button {
                                background-color: #6366f1;
                                color: #ffffff !important;
                                padding: 14px 28px;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: 600;
                                font-size: 16px;
                                display: inline-block;
                                box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
                            }
                            .footer {
                                margin-top: 32px;
                                font-size: 13px;
                                color: #94a3b8;
                                text-align: center;
                            }
                            .link-text {
                                font-size: 12px;
                                color: #94a3b8;
                                word-break: break-all;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">Password Reset Request</div>

                            <p class="text">
                                Hello,<br><br>
                                We received a request to reset the password for your account associated with this email address.
                            </p>

                            <div class="button-container">
                                <a href="%s" class="button">Reset Password</a>
                            </div>

                            <p class="text">
                                This link is valid for <b>15 minutes</b>. If you did not request a password reset, please ignore this email.
                            </p>

                            <div class="link-text">
                                If the button above doesn't work, copy and paste this link into your browser:<br>
                                <a href="%s" style="color: #6366f1;">%s</a>
                            </div>

                            <div class="footer">
                                © 2026 Smart Home Energy Management System<br>
                                Secure • Smart • Efficient
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(resetLink, resetLink, resetLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("✅ Reset link sent successfully to: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("❌ Failed to send reset link to " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Failed to send reset email.", e);
        }
    }

    // ── Schedule Confirmation Email ─────────────────────────────────────────────
    public void sendScheduleConfirmation(String toEmail, String deviceName, String startTime, String endTime) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("⏰ Automation Schedule Set – " + deviceName);
            String html = """
                    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
                    <div style="max-width:500px;margin:auto;background:#fff;padding:28px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                      <h2 style="color:#1e293b;margin-bottom:4px;">⏰ Automation Schedule Confirmed</h2>
                      <p style="color:#64748b;font-size:14px;">Your device schedule has been set successfully.</p>
                      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:4px 0;"><b>📱 Device:</b> %s</p>
                        <p style="margin:4px 0;"><b>🟢 Turn ON at:</b> %s</p>
                        <p style="margin:4px 0;"><b>🔴 Turn OFF at:</b> %s</p>
                      </div>
                      <p style="color:#64748b;font-size:13px;">The system will automatically manage this device as per the schedule. You can modify or delete it from your dashboard.</p>
                      <div style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">© 2026 Smart Home Energy Management System</div>
                    </div></body></html>""".formatted(deviceName, startTime, endTime);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send schedule email: " + e.getMessage());
        }
    }

    // ── Schedule Completion Email ─────────────────────────────────────────────
    public void sendScheduleCompletion(String toEmail, String deviceName, String endTime) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("✅ Automation Completed – " + deviceName);
            String html = """
                    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
                    <div style="max-width:500px;margin:auto;background:#fff;padding:28px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                      <h2 style="color:#10b981;margin-bottom:4px;">✅ Automation Completed</h2>
                      <p style="color:#64748b;font-size:14px;">Your scheduled automation has successfully finished.</p>
                      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:4px 0;"><b>📱 Device:</b> %s</p>
                        <p style="margin:4px 0;"><b>🔴 Turned OFF at:</b> %s</p>
                      </div>
                      <p style="color:#64748b;font-size:13px;">The system automatically powered down this device to save energy as per your schedule.</p>
                      <div style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">© 2026 Smart Home Energy Management System</div>
                    </div></body></html>""".formatted(deviceName, endTime);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send schedule completion email: " + e.getMessage());
        }
    }

    // ── Energy Overload Alert Email ─────────────────────────────────────────────
    public void sendOverloadAlert(String toEmail, String userName, double totalWatts, double limitWatts, String culprits) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("⚠️ Energy Overload Alert – SHEMS");
            String html = """
                    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#fef2f2;padding:20px;">
                    <div style="max-width:500px;margin:auto;background:#fff;padding:28px;border-radius:12px;border-left:5px solid #ef4444;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                      <h2 style="color:#dc2626;margin-bottom:4px;">⚠️ Energy Overload Detected!</h2>
                      <p style="color:#64748b;font-size:14px;">Hi <b>%s</b>, your home energy usage has exceeded the safe threshold.</p>
                      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:4px 0;font-size:18px;"><b>⚡ Current Usage: <span style="color:#dc2626;">%.1f W (%.2f kW)</span></b></p>
                        <p style="margin:4px 0;color:#64748b;">Safe Limit: %.0f W</p>
                        <p style="margin:12px 0 4px 0;padding-top:12px;border-top:1px solid #fca5a5;font-size:15px;color:#991b1b;"><b>🚨 Overloading Devices:</b><br/>%s</p>
                      </div>
                      <p style="color:#374151;font-size:14px;"><b>Immediate Action Recommended:</b></p>
                      <ul style="color:#374151;font-size:13px;">
                        <li>Turn off high-power appliances immediately.</li>
                        <li>Check for devices accidentally left on.</li>
                        <li>Use the Automation Scheduler to stagger device usage.</li>
                      </ul>
                      <div style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">© 2026 Smart Home Energy Management System</div>
                    </div></body></html>""".formatted(userName, totalWatts, totalWatts / 1000.0, limitWatts, culprits);
            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("⚠️ Overload alert sent to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send overload alert: " + e.getMessage());
        }
    }
}
