export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }
  const visible = local.charAt(0);
  return `${visible}***@${domain}`;
}
