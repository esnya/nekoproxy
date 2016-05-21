describe('page', () => {
    jest.autoMockOff();
    const {render} = require('../page');


    it('renders login page', () => {
        render('Login', {
            providers: ['twitter'],
        });
    });
});
