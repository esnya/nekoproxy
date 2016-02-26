export const USER_NOT_FOUND = 'USER_NOT_FOUND';

export class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
    }

    serialize() {
        return Promise.resolve(this.id);
    }
}

export class UserModel {
    constructor(knex) {
        this.knex = knex;
    }

    /**
     * Find user by data.
     * @param{object} data - Data to find user
     * @returns{Promise} resolves with user fonded
     */
    find(data) {
        return this
            .knex('users')
            .where(data)
            .first()
            .then((user) => user
                ? new User(user)
                : Promise.reject(USER_NOT_FOUND)
            );
    }

    create(data) {
        return this
            .knex('users')
            .insert({
                ...data,
                created: this.knex.fn.now(),
                modified: this.knex.fn.now(),
            })
            .then(() => this.find({ id: data.id }));
    }

    deserialize(id) {
        return this.find({ id });
    }
}
