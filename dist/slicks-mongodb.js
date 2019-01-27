/**
 * Created by steve Samson <stevee.samson@gmail.com> on February 19, 2014.
 * Updated on June 21, 2016.
 * Updated on March 13, 2017.
 */
let _ = require('underscore'),
    pool = require('mongodb').MongoClient,
    OID = require('mongodb').ObjectID;

module.exports = function (dbconfig) {

    if (!dbconfig.port) {
        dbconfig.port = 27017;
    }

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (prefix) {
            return this.indexOf(prefix) === 0;
        };
    }
    const makeName = function (str) {
            var index = str.indexOf('_');
            if (index < 0) {
                return str == 'id' ? str.toUpperCase() : (str.charAt(0)).toUpperCase() + str.substring(1);
            }
            var names = str.split('_');
            var new_name = '';
            names.forEach(function (s) {
                new_name += new_name.length > 0 ? " " + makeName(s) : makeName(s);
            });

            return new_name;

        },
        url = `mongodb://${dbconfig.host}:${dbconfig.port}`,
        // pool = mysql.createPool(dbconfig),
        connect = function (cb) {
            pool.connect(url, {
                useNewUrlParser: true
            }, function (err, conn) {
                if (err) {
                    return (cb && cb(err));
                }
                // console.log('Obtained new connection on mongodb.');
                var db_connection = {
                    connection: conn,
                    cdc:dbconfig.cdc,
                    maillog:dbconfig.maillog,
                    db: conn.db(dbconfig.database),
                    release: function () {
                        if (this.debug) {
                            console.log('closing db connection...');
                        }

                        this.connection.close();
                        if (this.debug) {
                            console.log('db connection closed');
                        }

                    },
                    destroy: function () {
                        if (this.debug) {
                            console.log('removing db connection...');
                        }
                        this.connection.close();
                        if (this.debug) {
                            console.log('db connection removed');
                        }
                    }
                };
                mongodb.init();
                _.extend(mongodb, db_connection);

                (cb && cb(false, mongodb));
            });
        },
        toString = function (o) {
            return o ? '' + o.toString() : '';
        },
        trim = function (arr) {

            for (var i = 0; i < arr.length; ++i) {
                arr[i] = arr[i].trim();
            }
            return arr;
        },

        addWheres = function (key, value) {

            let string = key.trim();
            if (string.endsWith("<>") || string.endsWith('!=')) {
                string = string.replace(/<>/, '');
                this.wheres[string.trim()] = {
                    "$ne": value
                };
            } else if (string.endsWith(">")) {
                string = string.replace(/>/, '');
                this.wheres[string.trim()] = {
                    "$gt": value
                };
            } else if (string.endsWith(">=")) {
                string = string.replace(/>=/, '');
                this.wheres[string.trim()] = {
                    "$gte": value
                };
            } else if (string.endsWith("<")) {
                string = string.replace(/</, '');
                this.wheres[string.trim()] = {
                    "$lt": value
                };
            } else if (string.endsWith("<=")) {
                string = string.replace(/<=/, '');
                this.wheres[string.trim()] = {
                    "$lte": value
                };
            } else {
                if(string === 'id'){
                    string = "_id";
                    value = new OID(value);
                }
                this.wheres[string] = value;
            }

        },

        addSets = function (key, value) {
            this.sets[key] = value;
        },


        reset = function () {
            mongodb.offset = 0;
            mongodb.lim = 0;
            mongodb.order = "ASC";
            mongodb.orderby = [];
            mongodb.groupby = [];
            mongodb.noDuplicate = null;
            mongodb.froms = null;
            mongodb.wheres = {};
            mongodb.sets = {};
            mongodb.size = 0;

            return this;
        };

    let mongodb = {
        storeType: 'mongodb',
        lastQuery: '',
        debug: false,
        distinct: function (column) {
            this.noDuplicate = column;
            return this;
        },
        limit: function (lim, offset) {
            this.lim = lim;
            this.offset = offset || 0;
            return this;
        },
        
        count:function(){
            this.size = 1;
            return this;
        },
        groupBy:function(){
            // this.groupby = trim(columns.split(","));
            // return this;
            console.log('query not supported yet');
            return this;
        },
        orderBy: function (columns, direction) {
            direction = direction ? direction.toLowerCase() : 'asc'
            this.orderby.push([columns, (direction === 'asc') ? 1 : -1]);
            return this;
        },

        from: function (from) {
            this.froms = from;
            return this;
        },
        where: function (column, value) {
            if (arguments.length < 2) return this;
            addWheres.call(this, column, value);
            return this;
        },
        like: function (column, value) {
            if (arguments.length < 2) return this;
            this.wheres[column] = new RegExp(value.toString(), 'i');
            return this;
        },
        whereIn: function (column, value) {
            if (arguments.length < 2) return this;
            this.wheres[column] = {
                "$in": value
            }
            return this;
        },
        whereNotIn: function (column, value) {
            if (arguments.length < 2) return this;
            this.wheres[column] = {
                "$nin": value
            }
            return this;
        },
        set: function (column, value) {
            addSets.call(this, column, value);
            return this;
        },

        insert: function (table, options, cb) {
            reset();
            const collection = this.db.collection(table);
            collection[_.isArray(options) ? 'insertMany' : 'insertOne'](options, function (err, result) {
                if (err) {
                    return (cb && cb(err));
                }

               

                if (!_.isArray(options)) {
                    
                   return  (cb && cb(false, {id:result.insertedId}));
                }

                (cb && cb(false, result.ops));
            });


        },
        fetch: function (tableOrCb, cb) {

            if (_.isFunction(tableOrCb)) {
                if (_.isNull(this.froms)) {
                    var e = Error("No table specified for select statement.");
                    console.error(e);
                    reset();
                    return (cb && cb(e));
                }
                cb = tableOrCb;
            } else if (_.isString(tableOrCb)) {

                this.froms = tableOrCb;

            } else {
                var err = new Error("No table or callback specified for select statement.");
                console.error(err);
                reset();
                return (cb && cb(err));
            }

            // console.log('Table: ', this.froms)
            // console.log('Where: ', this.wheres)
            const collection = this.db.collection(this.froms);
            let _opt = {
                skip: this.offset,
                sort: this.orderby,
                limit: this.lim
            };
            if(this.size){
                return collection.countDocuments(this.wheres, function(err, result){
                    if (err) {
                        reset();
                        return (cb && cb(err));
                    }
                    reset();
                    (cb && cb(false, result));
                })
            }

            if(this.noDuplicate){
                return collection.distinct(this.noDuplicate, this.wheres, _opt, function(err, items){
                    if (err) {
                        reset();
                        return (cb && cb(err));
                    }
                    reset();
                    (cb && cb(false, items));
                })
            }

            // if(this.groupby.length){
            //     return collection.group(this.groupby, this.wheres, function(err, result){
            //         if (err) {
            //             reset();
            //             return (cb && cb(err));
            //         }
            //         reset();
            //         (cb && cb(false, result));
            //     })
            // }
            // console.log('Options: ', _opt);
            collection.find(this.wheres, _opt).toArray(function (err, items) {
                if (err) {
                    reset();
                    return (cb && cb(err));
                }
                reset();
                items.forEach(i =>{ i.id = i._id; });
                (cb && cb(false, items));
            });

        },
        update: function (table, cb) {

            if (_.isNull(this.sets)) {

                var err = Error("No fields to be set in update statement.");
                return (cb && cb(err));
            }


            const collection = this.db.collection(table);
            // console.log('set: ', this.sets)
            // let load = JSON.stringify(this.sets);
            // console.log('load: ', load);
            // load = JSON.parse(load);
            // console.log('load: ', );
            collection.updateMany(this.wheres, {
                '$set': this.sets
            }, function (err, result) {
                if (err) {
                    reset();
                    return (cb && cb(err));
                }
                reset();
                (cb && cb(false, {
                    affectedRows: result.modifiedCount
                }));
            })

        },
        delete: function (table, options, cb) {

            if (options && _.isFunction(options)) {
                cb = options;

            } else if (options && _.isObject(options)) {

                this.wheres = options;
            }

            const collection = this.db.collection(table);
            collection.deleteMany(this.wheres, function (err, result) {
                if (err) {
                    reset();
                    return (cb && cb(err));
                }
                reset();
                // console.log('result: ', result)
                (cb && cb(false, {
                    affectedRows: result.deletedCount
                }));
            });


        },
        init: function () {
            this.debug = dbconfig.debug_db || false;
            return reset();
        }
    };

    return {
        connect: connect
    };

};