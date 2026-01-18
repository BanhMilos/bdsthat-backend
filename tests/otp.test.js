"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const otp_1 = require("../src/utils/otp");
describe('otp utils', () => {
    it('generates numeric OTP of expected length', () => {
        const otp = (0, otp_1.generateOtp)(6);
        expect(otp).toHaveLength(6);
        expect(/^[0-9]{6}$/.test(otp)).toBe(true);
    });
    it('hashes and verifies otp correctly', async () => {
        const otp = '123456';
        const hash = await (0, otp_1.hashOtp)(otp);
        await expect((0, otp_1.verifyOtp)(otp, hash)).resolves.toBe(true);
        await expect((0, otp_1.verifyOtp)('000000', hash)).resolves.toBe(false);
    });
});
