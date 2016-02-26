jest.dontMock('../user');

describe('User', () => {
    const {
        User,
        UserModel,
    } = require('../user');

    const query = {
        where: jest.genMockFn(),
        first: jest.genMockFn(),
        then: jest.genMockFn(),
    };
    beforeEach(() => {
        query.where.mockClear();
        query.first.mockClear();
        query.then.mockClear();

        query.where.mockReturnValue(query);
        query.first.mockReturnValue(query);
    });

    const knex = jest.genMockFn();
    beforeEach(() => {
        knex.mockClear();
        knex.mockReturnValue(query);
    });

    let model;
    it('can be instanced', () => {
        model = new UserModel(knex);
    });

    pit('finds user by (oauth_provider, oauth_id)', () => {
        query.then.mockImpl((callback) =>
            Promise.resolve({
                id: 'id1',
                name: 'name1',
                oauth_provider: 'twitter',
                oauth_id: 'test-id',
            }).then(callback)
        );

        const p = model.find({
            oauth_provider: 'twitter',
            oauth_id: 'test-id',
        });

        expect(query.where).toBeCalledWith({
            oauth_provider: 'twitter',
            oauth_id: 'test-id',
        });
        expect(query.first).toBeCalled();

        return p.then((user) => {
                expect(user.id).toEqual('id1');
                expect(user.name).toEqual('name1');
                expect(user instanceof User).toBe(true);
            }).catch((e) => {
                throw new Error('Promise rejected with: ' + e);
            });
    });

    pit('rjects promise if user not found', () => {
        query.then.mockImpl((callback)=>
            Promise.resolve(null).then(callback)
        );

        const p = model.find({
            oauth_provider: 'twitter',
            oauth_id: 'test-id',
        });

        return p.then(() => {
                throw new Error('Promise resolved');
            })
            .catch((e) => {
                expect(e).toBeDefined();
                expect(e).not.toBeNull();
            });
    });

    pit('serializes self into id', () => {
        query.then.mockImpl((callback) =>
            Promise.resolve({
                id: 'id2',
                name: 'name2',
            }).then(callback)
        );

        return model
            .find({ id: 'id2' })
            .then((user) => user.serialize())
            .then((id) => expect(id).toEqual('id2'))
            .catch((e) => {
                throw new Error('Promise rejected with: ' + e);
            });
    });

    pit('deserializes from id', () => {
        query.then.mockImpl((callback) =>
            Promise.resolve({
                id: 'id3',
                name: 'name3',
            }).then(callback)
        );

        return model
            .deserialize('id3')
            .then((user) => {
                expect(user.id).toEqual('id3');
                expect(user.name).toEqual('name3');
                expect(user instanceof User).toBe(true);
            })
            .catch((e) => {
                throw new Error('Promise rejected with: ' + e);
            });
    });
});