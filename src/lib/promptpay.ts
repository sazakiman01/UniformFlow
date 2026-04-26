/**
 * Generate PromptPay QR Code data string (EMVCo / Thai PromptPay spec).
 * Compatible with all Thai banking apps (K-Bank, SCB, Bangkok Bank, etc.)
 *
 * Reference: https://www.bot.or.th/en/financial-innovation/digital-finance/promptpay.html
 *
 * Pure JS implementation — no external dependency required.
 */

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return tag + len + value;
}

/** CRC-16/CCITT-FALSE checksum (PromptPay uses this) */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Sanitize phone (0812345678 → 66812345678) or tax id (13 digits → 13 digits) */
function sanitizeId(raw: string): { id: string; tagId: string } {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 13) {
    // Tax ID
    return { id: digits, tagId: '02' };
  }
  // Phone — convert to country code format
  let phone = digits;
  if (phone.startsWith('0')) phone = '66' + phone.slice(1);
  else if (!phone.startsWith('66')) phone = '66' + phone;
  return { id: '00' + phone, tagId: '01' };
}

export interface PromptPayQROptions {
  /** Phone (10 digits with leading 0) or Tax ID (13 digits) or eWallet */
  promptPayId: string;
  /** Amount in THB. Omit for "any amount" QR */
  amount?: number;
  /** Static (reusable) or Dynamic (single-use). Default: dynamic if amount given */
  oneTime?: boolean;
}

/**
 * Generate the EMVCo QR data string for a PromptPay payment.
 * Encode this string as a QR code image using any QR library (e.g., 'qrcode').
 */
export function generatePromptPayPayload(options: PromptPayQROptions): string {
  const { promptPayId, amount } = options;
  const oneTime = options.oneTime ?? amount !== undefined;
  const { id, tagId } = sanitizeId(promptPayId);

  // Tag 00: Payload Format Indicator
  const payloadFormat = tlv('00', '01');
  // Tag 01: Point of Initiation Method (11=static, 12=dynamic/one-time)
  const initiation = tlv('01', oneTime ? '12' : '11');
  // Tag 29: Merchant Account Information (PromptPay)
  // Sub-tag 00: AID (A000000677010111)
  // Sub-tag 01 or 02: identifier
  const merchantInfo =
    tlv('00', 'A000000677010111') + tlv(tagId, id);
  const tag29 = tlv('29', merchantInfo);
  // Tag 53: Currency (764 = THB)
  const currency = tlv('53', '764');
  // Tag 54: Amount (optional)
  const amountTag = amount !== undefined
    ? tlv('54', amount.toFixed(2))
    : '';
  // Tag 58: Country (TH)
  const country = tlv('58', 'TH');

  const beforeCRC = payloadFormat + initiation + tag29 + currency + amountTag + country + '6304';
  const checksum = crc16(beforeCRC);
  return beforeCRC + checksum;
}
