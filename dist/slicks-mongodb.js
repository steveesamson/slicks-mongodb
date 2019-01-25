/**
 * Created by steve Samson <stevee.samson@gmail.com> on February 19, 2014.
 * Updated on June 21, 2016.
 * Updated on March 13, 2017.
 */
let _ = require('underscore'),
    pool = require('mongodb').MongoClient;

module.exports = function (dbconfig) {

    if(!dbconfig.port){
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
            console.log('Connecting...')
            pool.connect(url,{useNewUrlParser: true }, function (err, conn) {
                if (err) {
                    return (cb && cb(err));
                }
                console.log('Obtained new connection on mongodb.');
                var db_connection = {
                    connection: conn,
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
            return o? '' + o.toString() : '';
        },
        stringWrap = function (o) {
            var raw = toString(o);

            return (raw.indexOf("'") != -1) ? raw : "'%s'".format(raw);
        },
        cleantAt = function (string) {

            return string.replace(new RegExp("@", 'g'), '%');
        },
        hasOperator = function (string) {
            var has = false;
            string = string.trim();
            if (string.endsWith(">") || string.endsWith(">=") || string.endsWith("<=") || string.endsWith("<") || string.endsWith("<>") || string.endsWith("!=")) {
                has = true;
            }
            return has;
        },
        trim = function (arr) {

            for (var i = 0; i < arr.length; ++i) {
                arr[i] = arr[i].trim();
            }
            return arr;
        },
        
        addWheres = function (key, value) {
            // console.log('key:',key, ' val: ', value);
            this.wheres[key] = value;
        },
        
        addSets = function (key, value) {
            this.sets[key] = value;
        },
        

        reset = function () {
            this.offset = 0;
            this.lim = 0;
            this.order = "ASC";
            this.isdistinct = false;
            this.froms = null;
            this.wheres = {};
            this.sets = {};
            return this;
        };

    let mongodb = {
        lastQuery: '',
        debug: false,
        distinct: function () {
            // this.isdistinct = true;
            console.log('distinct not supported yet');
            return this;
        },
        limit: function (lim, offset) {
            // this.lim = lim;
            // this.offset = offset || 0;
            console.log('limit not supported yet');
            return this;
        },
        query:function (lim, offset) {
            console.log('query not supported yet');
            return this;
        },
        orderBy: function () {
            console.log('orderBy not supported yet');
            return this;
        },
       
        from: function (from) {
            this.froms = from;
            return this;
        },
        where: function (column, value) {
            if (arguments.length < 2) return this;
            // value = _.isString(value) ? stringWrap(value) : toString(value);
            // column = hasOperator(column) ? column : "%s =".format(column);
            addWheres.call(this, column, value);
            return this;
        },
        set: function (column, value) {
            // value = _.isString(value) ? stringWrap(value) : toString(value);
            // column = hasOperator(column) ? column : "%s =".format(column);
            addSets.call(this, column, value);
            return this;
        },
        
        insert: function (table, options, cb) {
            reset.call(this);
            const collection = this.db.collection(table);
            collection[_.isArray(options)? 'insertMany' : 'insertOne'](options,function (err, result) {
                if (err) {
                    return (cb && cb(err));
                }

                let {ops} = result;
                if(ops.length && !_.isArray(options)){
                    ops = ops[0];
                }
                (cb && cb(false, ops));
            });


        },
        fetch: function (tableOrCb, cb) {

                if (_.isFunction(tableOrCb)) {
                    if (_.isNull(this.froms)) {
                        var e = Error("No table specified for select statement.");
                        console.error(e);
                        reset.call(this);
                        return (cb && cb(e));
                    }
                    cb = tableOrCb;
                } else if (_.isString(tableOrCb)) {

                    this.froms = tableOrCb;

                } else {
                    var err = new Error("No table or callback specified for select statement.");
                    console.error(err);
                    reset.call(this);
                    return (cb && cb(err));
                }

                // console.log('Table: ', this.froms)
                // console.log('Where: ', this.wheres)
                const collection = this.db.collection(this.froms);
                collection.find(this.wheres).toArray(function (err, items) {
                    if (err) {
                        reset.call(this);
                        return (cb && cb(err));
                    }
                    reset.call(this);
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
            collection.updateOne(this.wheres, {'$set':this.sets},function (err, result) {
                if (err) {
                    reset.call(this);
                    return (cb && cb(err));
                }
                reset.call(this);
                (cb && cb(false, {affectedRows: result.modifiedCount}));
            })
 
        },
        delete: function (table, options, cb) {

            if (options && _.isFunction(options)) {
                cb = options;
               
            } else if (options && _.isObject(options)) {

                this.wheres = options;
            }

            const collection = this.db.collection(table);
            collection.deleteMany(this.wheres,function (err, result) {
                if (err) {
                    reset.call(this);
                    return (cb && cb(err));
                }
                reset.call(this);
                // console.log('result: ', result)
                (cb && cb(false, {affectedRows: result.deletedCount}));
            });
            

        },
        init: function () {
            this.debug = dbconfig.debug_db || false;
            return reset.call(this);
        }
    };

    return {
        connect: connect
    };

};