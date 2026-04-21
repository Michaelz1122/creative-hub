function requireEnvValue(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getAppUrl() {
  const raw = requireEnvValue("APP_URL");
  const url = new URL(raw);

  if (isProductionEnvironment() && url.protocol !== "https:") {
    throw new Error("APP_URL must use https in production.");
  }

  return url;
}

export function getAuthPasswordPepper() {
  if (isProductionEnvironment()) {
    return requireEnvValue("AUTH_PASSWORD_PEPPER");
  }

  return process.env.AUTH_PASSWORD_PEPPER?.trim() || "";
}

export function getEmailDeliveryMode() {
  const configuredMode = process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase();

  if (configuredMode === "send" || configuredMode === "log") {
    return configuredMode;
  }

  return isProductionEnvironment() ? "send" : "log";
}

export function getEmailSenderConfig() {
  const fromEmail = requireEnvValue("EMAIL_FROM");
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  return {
    fromEmail,
    replyTo,
  };
}

export function getResendConfig() {
  return {
    apiKey: requireEnvValue("RESEND_API_KEY"),
  };
}

