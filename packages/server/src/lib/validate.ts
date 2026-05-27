const ID_CARD_REGEX = /^\d{17}[\dXx]$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function validateIdCard(idCard: string): string | null {
  if (!ID_CARD_REGEX.test(idCard)) {
    return "身份证号格式不正确，应为18位数字";
  }
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i], 10) * weights[i];
  }
  const expected = checkCodes[sum % 11];
  if (idCard[17].toUpperCase() !== expected) {
    return "身份证号校验位不正确";
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  if (!PHONE_REGEX.test(phone)) {
    return "手机号格式不正确，应为11位数字且以1开头";
  }
  return null;
}
