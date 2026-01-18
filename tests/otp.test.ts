import { generateOtp, hashOtp, verifyOtp } from '../src/utils/otp';

describe('otp utils', () => {
  it('generates numeric OTP of expected length', () => {
    const otp = generateOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^[0-9]{6}$/.test(otp)).toBe(true);
  });

  it('hashes and verifies otp correctly', async () => {
    const otp = '123456';
    const hash = await hashOtp(otp);
    await expect(verifyOtp(otp, hash)).resolves.toBe(true);
    await expect(verifyOtp('000000', hash)).resolves.toBe(false);
  });
});
