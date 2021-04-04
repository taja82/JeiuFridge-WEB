var mysql = require('mysql');
var dbconnInfo = {
    "host": "",
    "user": "",
    "password": "",
    "database": "",
    "multipleStatements": true,
    "connectionLimit": 30
};
//var connection;
var pool = mysql.createPool(dbconnInfo);

function getConnection(callback) {
    pool.getConnection(function (err, conn) {
        if(!err) {
            callback(conn);
        }
    });
}
module.exports = getConnection;

/*var dbconnection = {
    init: function() { return connection = mysql.createConnection(dbconnInfo) },*/
    /*dbopen: function(connection) {
        connection.connect(function(err) {
            if (err) {
                console.error("mysql connection error : " + err);
            }
            else {
                console.info("mysql connection successfully");
            }
        });
    }*/
    /*dbopen : function() {return handleDisconnect()},
    dbclose : function() {return connection.end()}
};

function handleDisconnect() {
    connection.connect(function(err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
        else {
            console.info('mysql is connected successfully');
        }
    });

    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            return handleDisconnect();
        }
        else {
            throw err;
        }
    });
    //현재 PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR 이런 오류 남
}



module.exports = dbconnection;*/
