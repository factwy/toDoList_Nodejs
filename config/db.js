const mysql = require('mysql2')
const dbconfig = require('./dbconfig.json')

const dbInfo = {
    'host':dbconfig.host,
    'user':dbconfig.user,
    'password':dbconfig.password,
    'database':dbconfig.database,
    'timezone':'09:00'
}

module.exports = {
    init: function(){
        return mysql.createConnection(dbInfo)
    },
    connect: function(conn){
        conn.connect((err)=>{
            if(err) {
                console.log("MySQL 연동 실패")
                console.dir(err)
            }
            else    console.log("MySQL 연동 성공")
        })
    }
}