package com.omnibudget.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Outgoing emails will be logged only.");
        }
    }

    public boolean sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailSender == null) {
            log.info("[MOCK EMAIL] To: {} | Subject: {}\nBody: {}", to, subject, htmlContent);
            return true;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("OmniBudget <noreply@omnibudget.app>");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Sent email successfully to {} with subject: {}", to, subject);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    public boolean sendOtpEmail(String toEmail, String otpCode, String userName) {
        String subject = "Your OmniBudget Login Code: " + otpCode;
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d0e; color: #f4f4f5; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">OmniBudget</span>
                </div>
                <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">Hi %s,</h2>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px;">
                  Use the 6-digit code below to securely sign in to your OmniBudget workspace. This code expires in 10 minutes.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #10b981; background-color: #064e3b; padding: 16px 28px; border-radius: 12px; border: 1px solid #059669;">
                    %s
                  </span>
                </div>
                <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 24px;">
                  If you didn't request this login code, you can safely ignore this email. Someone may have typed your address by mistake.
                </p>
                <div style="border-top: 1px solid #27272a; margin-top: 28px; padding-top: 20px; font-size: 11px; color: #52525b; text-align: center;">
                  &copy; 2026 OmniBudget Inc. Zero vendor lock-in personal finance.
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName != null ? userName : "there", otpCode);

        return sendHtmlEmail(toEmail, subject, html);
    }

    public boolean sendBillReminderEmail(String toEmail, String billName, BigDecimal amount, String dueDate) {
        String subject = "Upcoming Bill Alert: " + billName + " due on " + dueDate;
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d0e; color: #f4f4f5; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #ffffff;">Bill Due Notice</h2>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
                  Your recurring commitment <strong style="color: #ffffff;">%s</strong> is scheduled for auto-debit on <strong style="color: #f59e0b;">%s</strong>.
                </p>
                <div style="padding: 16px; background-color: #27272a; border-radius: 12px; margin: 20px 0; text-align: center;">
                  <span style="font-size: 24px; font-weight: 700; color: #ffffff;">$%s</span>
                </div>
                <p style="font-size: 12px; color: #71717a;">Please ensure sufficient funds in your linked checking account to avoid overdraft charges.</p>
              </div>
            </body>
            </html>
            """.formatted(billName, dueDate, amount.toString());

        return sendHtmlEmail(toEmail, subject, html);
    }

    public boolean sendBudgetAlertEmail(String toEmail, String envelopeName, BigDecimal spent, BigDecimal limit) {
        String subject = "Budget Warning: " + envelopeName + " has exceeded allocated limit";
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d0e; color: #f4f4f5; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #ef4444;">Budget Alert: %s</h2>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
                  You have spent <strong style="color: #ef4444;">$%s</strong> against your planned budget limit of <strong style="color: #ffffff;">$%s</strong>.
                </p>
                <p style="font-size: 12px; color: #71717a; margin-top: 16px;">Consider trimming remaining variable expenses for this month to maintain your net savings target.</p>
              </div>
            </body>
            </html>
            """.formatted(envelopeName, spent.toString(), limit.toString());

        return sendHtmlEmail(toEmail, subject, html);
    }
}
