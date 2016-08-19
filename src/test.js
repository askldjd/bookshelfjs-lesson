'use strict';

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres',
    database: 'bs',
    charset: 'utf8'
  }
});

const bookshelf = require('bookshelf')(knex);

function createTables(knex, Promise) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments();
      table.string('name');
      table.string('email', 128);
      table.string('role').defaultTo('admin');
      table.string('password');
      table.integer('age');
      table.timestamps();
    })
    .createTable('posts', function(table) {
      table.increments();
      table.string('message');
      table.integer('user_id').notNullable();
      table.timestamps();
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
};

function dropTables(knex) {
  return knex.raw('DROP TABLE users CASCADE')
    .then(() => {
      return knex.raw('DROP TABLE posts CASCADE');
    });
}


let Posts = bookshelf.Model.extend({
  tableName: 'posts',
  hasTimestamps: true,

  user: function() {
    return this.belongsTo(User);
  }
});

let User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  posts: function() {
    return this.hasMany(Posts);
  }
});

function getAndPrint() {
  return new User({
    'id': 1
  }).fetch({
    withRelated: ['posts']
  }).then(user => {
    return new Promise(resolve => {
      console.log(user.toJSON());
      resolve(user);
    });
  })
}

dropTables(knex)
  .then(() => {
    return createTables(knex)
  })
  .then(() => {
    let user = new User();
    user.set('name', 'Joe');
    user.set('email', 'joe@example.com');
    user.set('age', 28);

    return user.save();
  })
  .then(u => {
    let post = new Posts({
      user_id: 1,
      message: 'Hi, hows it going?'
    })
    return post.save()
  })
  .then(() => {
    return new User({
      'id': 1
    }).fetch({
      withRelated: ['posts']
    })
  })
  .then(user => {
    // console.log(user.toJSON());
    return user.posts().add([{
      user_id: 1,
      message: 'message 2'
    },{
      user_id: 1,
      message: 'message 3'
    }]).invokeThen('save')
  })
  .then(getAndPrint)
  .then(users => {
    return users.relations.posts.at(1).save({
      message: 'spanking new message'
    });
  })
  .then(getAndPrint)
  .then(() => {
    return User.forge({
      'id': 1,
      name: 'John',
      email: 'john@gmail.com',
      age: 29
    }).save()
  })
  .then(getAndPrint)
  // .then(user => {
  //   console.log(user.toJSON());
  // })
  .catch(err => {
    console.log('err', err);
  })
