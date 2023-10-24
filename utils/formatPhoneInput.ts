/**
 * Utility function that return a formatted phone number from form input
 * @param {string} phoneValue
 * @param {object} [options]
 * @param {number} [options.lengthLimit] Used to alter phone number normalization for Saas
 * @example
 * formatPhoneInput('09  67 45 4310')
 * // => '0967454310'
 */
export default function formatPhoneInput(
  phoneValue: string,
  options: { lengthLimit?: number } = {},
) {
  const { lengthLimit } = options;

  let normalizedPhone = phoneValue.replace(/(^33)|(^\+33)|(^0033)/, "0");
  normalizedPhone = normalizedPhone.replace(/[^0-9]/g, "");

  // Add 0 if first number is not 0
  if (normalizedPhone && normalizedPhone.charAt(0) !== "0") {
    normalizedPhone = "0".concat(normalizedPhone);
  }

  // Limit length according to lengthLimit option
  const actualLengthLimit = lengthLimit || 10;
  if (normalizedPhone.length > actualLengthLimit) {
    normalizedPhone = normalizedPhone.substring(0, actualLengthLimit);
  }

  return normalizedPhone;
}
