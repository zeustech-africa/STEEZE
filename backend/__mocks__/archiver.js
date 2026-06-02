// Manual mock for archiver ES module
const mockArchiver = () => {
  const archive = {
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function(event, callback) {
      if (event === 'end') {
        setTimeout(callback, 10);
      }
      return this;
    }),
    finalize: jest.fn(),
    file: jest.fn().mockReturnThis(),
    directory: jest.fn().mockReturnThis(),
    abort: jest.fn(),
  };
  return archive;
};

export default mockArchiver;