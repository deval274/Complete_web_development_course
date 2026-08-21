import mailgen from "mailgen";

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

export { emailVerificationMailgenContent, forgotPasswordMailgenContent };
