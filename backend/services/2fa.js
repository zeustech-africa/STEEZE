import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const generate2FASecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `STEEZE:${email}`,
    issuer: 'STEEZE',
  });
  return secret;
};

export const generateQRCode = async (secret) => {
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  return qrCodeUrl;
};

export const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token,
    window: 1,
  });
};