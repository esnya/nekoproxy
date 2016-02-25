const mockApp = {
    set: jest.genMockFn(),
    post: jest.genMockFn(),
    use: jest.genMockFn(),
};

const express = module.exports = jest.genMockFn().mockReturnValue(mockApp);

express.static = jest.genMockFn();