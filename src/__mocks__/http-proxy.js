const ProxyServer = module.exports = jest.genMockFn();
ProxyServer.prototype.web = jest.genMockFn();
ProxyServer.prototype.ws = jest.genMockFn();
ProxyServer.prototype.on = jest.genMockFn();
