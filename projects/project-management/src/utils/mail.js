import mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new mailgen({
    theme: "default",
    product: {
      name: "Project Management",
      link: "https://project-management.com",
    },
  });

  const emailTextualContent = mailGenerator.generatePlaintext(
    options.mailgenContent,
  );
  const emailHTMLContent = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "Project Management <noreply@project-management.com>",
    to: options.email,
    subject: options.subject,
    text: emailTextualContent,
    html: emailHTMLContent,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("Email not sent", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro:
        "Welcome to our platform! Please verify your email address by clicking the button below.",
      action: {
        instructions: "To verify your email, please click the button below:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationUrl,
        },
      },
      outro:
        "If you did not request this verification, please ignore this email.",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro:
        "You are receiving this email because we received a password reset request for your account.",
      action: {
        instructions: "To reset your password, please click the button below:",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "If you did not request this password reset, please ignore this email.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
