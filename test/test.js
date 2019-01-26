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
        it('Should delete all records in "task_owners" collection without error', function (done) {
            db.delete('task_owners', function (err, res) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });

    describe('#Delete with "delete"', function () {
        it('Should delete all record from "todo" collection without error', function (done) {
            db.delete('todo', function (err, res) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });
   
    describe('#Insert with "insert" ', function () {
        it('Should insert into "task_owners" collection without error and return insert id that equals 1', function (done) {
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
        it('Should insert into "todo" collection without error and return insert id that equals 1', function (done) {
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
        it('Should insert multiple records into "todo" collection with "insert" without error', function (done) {
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

    describe('#Aggregate with "count" ', function () {
        it('Should count items in "todo" collection without error and return 3 as number of records', function (done) {
            db.count()
            .fetch('todo', function (err, result) {
                if (err) {
                    console.error(err)
                    throw err;
                }
                result.should.equal(3);
                done();
            });
        });
    });



    describe('#WhereIn records', function () {
        it('Should retrieve all records in "todo"  collection with id of 2 or 3 without error, records length should be 2', function (done) {
            db.whereIn("id", [2,3]).fetch('todo', function (err, rows) {
                if (err) {
                    console.error(err)
                    throw err;
                }
                // console.log("Got: ", rows);
                rows.should.have.length(2);
                done();
            });
        });
    });

    describe('#WhereNotIn records', function () {
        it('Should retrieve all records in "todo"  collection with id not of 2 or 3 without error, records length should be 1', function (done) {
            db.whereNotIn("id", [2,3]).fetch('todo', function (err, rows) {
                if (err) {
                    console.error(err)
                    throw err;
                }
                // console.log("Got: ", rows);
                rows.should.have.length(1);
                done();
            });
        });
    });
    describe('#Fetch records', function () {
        it('Should retrieve all records in "todo"  collection with "fetch" without error, records length should be 3', function (done) {
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
        it('Should retrieve ONLY ONE record, from  "todo"  collection, record id should equal 2', function (done) {
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

   

    describe('#GreaterThan clause', function () {
        it('Should retrieve all records with id greater than 1 in "todo"  collection with "where >" without error, records length should be 2', function (done) {
            db.where('id >', 1)
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    
                    rows.should.have.length(2);
                    done();
                });
        });
    });

     

    describe('#GreaterThanOrEquals clause', function () {
        it('Should retrieve all records with id greater than  or equals 1 in "todo"  collection with "where >=" without error, records length should be 3', function (done) {
            db.where('id >=', 1)
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                   
                    rows.should.have.length(3);
                    done();
                });
        });
    });


    describe('#LessThan clause', function () {
        it('Should retrieve all records with id less than 2 in "todo"  collection with "where <" without error, records length should be 1', function (done) {
            db.where('id <', 2)
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                   
                    rows.should.have.length(1);
                    done();
                });
        });
    });
  
    describe('#LessThanOrEquals clause', function () {
        it('Should retrieve all records with id less than  or equals 2 in "todo"  collection with "where <=" without error, records length should be 2', function (done) {
            db.where('id <=', 2)
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    
                    rows.should.have.length(2);
                    done();
                });
        });
    });
   
    describe('#Limit clause', function () {
        it('Should retrieve ONLY 3 records in "todo"  collection with "limit" of 2 without error, records length should be 2', function (done) {
            db.limit(2)
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    
                    rows.should.have.length(2);
                    done();
                });
        });
    });
 
   
    describe('#OrderBy DESC clause', function () {
        it('Should retrieve ALL records in "todo"  collection with "orderby" of "desc" without error, records length should be 3, first record id should be 3', function (done) {
            db.orderBy('id', 'desc')
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    // console.log("Got: ", rows);
                    rows.should.have.length(3);
                    rows[0].id.should.equal(3);
                    done();
                });
        });
    });

   
    describe('#OrderBy ASC clause', function () {
        it('Should retrieve ALL records in "todo"  collection with "orderby" of "asc"  without error, records length should be 3, first record id should be 1', function (done) {
            db.orderBy('id', 'asc')
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    rows.should.have.length(3);
                    rows[0].id.should.equal(1);
                    done();
                });
        });
    });
 
    describe('#OrderBy clause', function () {
        it('Should retrieve ALL records in "todo"  collection with just "orderby"  without error, records length should be 3, first record id should be 1', function (done) {
            db.orderBy('id')
                .fetch('todo', function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    rows.should.have.length(3);
                    rows[0].id.should.equal(1);
                    done();
                });
        });
    });

   

   
    describe('#Update ', function () {
        it('Should update "todo" collection. Should return 1 as number of affectedRows', function (done) {

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


    describe('#Update ', function () {
        it('Should update "todo" collection using id > 1. Should return 2 as number of affectedRows', function (done) {

            db.set('task', 'Update two records in Todo')
                .where('id >', 1)
                .update('todo', function (err, res) {
                    if (err) {
                        throw err;
                    }
                    // console.log('update: ', res)
                    res.affectedRows.should.equal(2);

                    done();
                });
        });
    });


    describe('#Aggregate with "distinct" on todo ', function () {
        it('Should return 2 records from "todo" collection ', function (done) {
            db.distinct('task')
            .fetch('todo', function (err, rows) {
                if (err) {
                    throw err;
                }
                // console.log('Got: ', rows);
                rows.should.have.length(2);
                done();
            });

        });
    });
    describe('#Delete ', function () {
        it('Should delete from "todo" collection and return 2 as number of affectedRows', function (done) {

            db.where('id >', 1)
                .delete('todo', function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.affectedRows.should.equal(2);

                    done();
                });

        });
    });
 

});