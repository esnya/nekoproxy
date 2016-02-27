jest.dontMock('../user');

describe('User', () => {
    const {
        USER_NOT_FOUND,
        User,
        UserModel,
    } = require('../user');

    const query = {
        where: jest.genMockFn(),
        first: jest.genMockFn(),
        insert: jest.genMockFn(),
        then: jest.genMockFn(),
    };
    beforeEach(() => {
        query.where.mockClear();
        query.first.mockClear();
        query.then.mockClear();
        query.insert.mockClear();

        query.where.mockReturnValue(query);
        query.first.mockReturnValue(query);
    });

    const knex = jest.genMockFn();
    knex.schema = {
        hasTable: jest.genMockFn(),
        createTable: jest.genMockFn(),
    };
    knex.fn = {
        now: jest.genMockFn(),
    };

    beforeEach(() => {
        knex.mockClear();
        knex.mockReturnValue(query);
    });

    let model;
    pit('initializes table', () => {
        knex.schema.hasTable.mockReturnValueOnce(Promise.resolve(false));

        model = new UserModel(knex);

        return Promise.resolve()
            .then(() => {
                expect(knex.schema.hasTable).toBeCalledWith('users');

                expect(knex.schema.createTable).toBeCalled();

                const call = knex.schema.createTable.mock.calls[0];
                expect(call[0]).toEqual('users');

                const primary = [];
                const col = (name) => ({
                    primary: jest.genMockFn()
                        .mockImpl(() => primary.push(name)),
                    notNullable: jest.genMockFn(),
                });
                const table = {
                    string: jest.genMockFn().mockImpl(col),
                    timestamp: jest.genMockFn().mockImpl(col),
                    unique: jest.genMockFn(),
                };
                call[1](table);

                expect(
                    table
                        .string
                        .mock
                        .calls
                        .map((call) => call[0])
                ).toEqual([
                    'id',
                    'name',
                    'oauth_provider',
                    'oauth_id',
                ]);

                expect(
                    table
                        .timestamp
                        .mock
                        .calls
                        .map((call) => call[0])
                ).toEqual([
                    'created',
                    'modified',
                    'deleted',
                ]);

                expect(primary).toEqual(['id']);
                expect(table.unique)
                    .toBeCalledWith(['oauth_provider', 'oauth_id']);
            });
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
                expect(e).toEqual(USER_NOT_FOUND);
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

    pit('creates new user', () => {
        query.insert.mockReturnValue(Promise.resolve([0]));
        query.then.mockImpl((callback) =>
            Promise.resolve({
                id: 'id4',
            }).then(callback)
        );

        const p = model.create({
            id: 'id4',
            oauth_id: 'oauthid',
            oauth_provider: 'twitter',
        });

        expect(query.insert).toBeCalledWith({
            id: 'id4',
            oauth_id: 'oauthid',
            oauth_provider: 'twitter',
        });

        return p.then((user) => {
            expect(user instanceof User).toBe(true);
            expect(user.id).toEqual('id4');
            expect(user.name).not.toBeDefined();
        });
    });
});