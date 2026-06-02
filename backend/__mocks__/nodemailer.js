// Manual mock for nodemailer ES module
const nodemailer = {
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
};

export default nodemailer;