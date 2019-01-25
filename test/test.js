/**
 * Created by steve Samson <stevee.samson@gmail.com> on February 10, 2014.
 * Updated June 21, 2016.
 */

var chai = require('chai'),
    should = require('chai').should(),
    slicks_mongodb = require('../dist/slicks-mongodb')({
        host: 'localhost',
        user: 'tester',
        dateStrings: true,
        driver: 'mongodb',
        database: 'todo_db',
        password: 'tester',
        debug_db: false
    }),
    db = null;

describe('#Slicks-MongoDB', function () {

    before(function (done) {
        slicks_mongodb.connect(function (err, _db) {
            if (err) {
                console.log(err)
                throw err;
            }
            db = _db;
            done();
        })
    });

    after(function () {
        db.destroy();
    });

    describe('#Delete with "delete"', function () {
        it('Should delete all records in "task_owners" table without error', function (done) {
            db.delete('task_owners', function (err, res) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });

    describe('#Delete with "delete"', function () {
        it('Should delete all record from "todo" table without error', function (done) {
            db.delete('todo', function (err, res) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });
 
    describe('#Insert with "insert" ', function () {
        it('Should insert into "task_owners" table without error and return insert id that equals 1', function (done) {
            db.insert('task_owners', {id: 1, name: 'Test owner'}, function (err, res) {
                if (err) {
                    throw err;
                }
                
                res.id.should.equal(1);
                done();
            });
        });
    });

    describe('#Insert with "insert" ', function () {
        it('Should insert into "todo" table without error and return insert id that equals 1', function (done) {
            db.insert('todo', {id: 1, task: 'Do dishes', task_owner: 1}, function (err, res) {
                if (err) {
                    throw err;
                }
                res.id.should.equal(1);
                done();
            });
        });
    });

    describe('#Insert multiple with "query"', function () {
        it('Should insert multiple records into "todo" table with "insert" without error', function (done) {
            var q = [{id:2, task:'Vacuum the floor', task_owner:1}, {id:3, task:'VIron my shirt', task_owner:1}]; 
            db.insert('todo', q, function (err, res) {
                if (err) {
                    throw err;
                }

                // console.log('Many: ', res)
                done();
            });
        });
    });
    // // console.log("Got: ", res);
    describe('#Fetch records', function () {
        it('Should retrieve all records in "todo"  table with "fetch" without error, records length should be 3', function (done) {
            db.fetch('todo', function (err, rows) {
                if (err) {
                    console.error(err)
                    throw err;
                }
                // console.log("Got: ", rows);
                rows.should.have.length(3);
                done();
            });
        });
    });



    describe('#Where clause', function () {
        it('Should retrieve ONLY ONE record, from  "todo"  table, record id should equal 2', function (done) {
                db.from('todo')
                .where('id', 2)
                .fetch(function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    rows.should.have.length(1);
                    var rec = rows[0];
                    rec.id.should.equal(2);
                    done();
                });
        });
    });

   
    describe('#Update ', function () {
        it('Should update "todo" table. Should return 1 as number of affectedRows', function (done) {

            db.set('task', 'Updated Todo')
                .where('id', 1)
                .update('todo', function (err, res) {
                    if (err) {
                        throw err;
                    }
                    // console.log('update: ', res)
                    res.affectedRows.should.equal(1);

                    done();
                });
        });
    });


    describe('#Delete ', function () {
        it('Should delete from "todo" table and return 1 as number of affectedRows', function (done) {

            db.where('id', 2)
                .delete('todo', function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.affectedRows.should.equal(1);

                    done();
                });

        });
    });


});