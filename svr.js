const express = require('express')
const dbconfig = require('./config/db.js')
const path = require('path')
const static = require('serve-static')

const conn = dbconfig.init()
dbconfig.connect(conn)

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use('/public', static(path.join(__dirname, 'public')))

let user = ""

app.listen(8000, (req, res)=>{
    console.log('8000번 포트 연결됨')
})

app.get('/', (req, res)=>{
    res.redirect('/public/sign/init.html')
})

app.post('/register', (req, res)=>{
    console.log('register 호출 됨')

    const pid = req.body.id
    const pname = req.body.name
    const ppw = req.body.pw

    conn.query('SELECT * FROM user WHERE id = ?;',
        [pid],
        (err, rows)=>{
            if(err) {
                console.log('MySQL QUERY ERROR')
                return
            }

            if(rows[0]) {
                console.log('이미 존재하는 아이디 입니다.')
                return
            }

            if(!(pname || ppw || pid)) {
                console.log('모든 정보를 기입하시오.')
                return
            }

            conn.query('INSERT INTO user VALUES (?, ?, SHA2(?, 256));',
                [pid, pname, ppw],
                (err, rows)=>{
                    if(err) {
                        console.log('MySQL QUERY FAIL')
                        return
                    }

                    res.redirect('./public/sign/init.html')
                }
            )
        }
    )

    console.log(pid, pname, ppw)
})

app.post('/login', (req, res)=>{
    console.log('login 호출 됨')

    pid = req.body.id
    pwd = req.body.pw

    conn.query('SELECT * FROM user WHERE id = ? and password = SHA2(?, 256);',
        [pid, pwd],
        (err, rows)=>{
            if(err) {
                console.log("MySQL QUERY FAIL")
                return
            }

            if(rows[0]) {
                user = rows[0]['id']
                res.redirect('/public/todo/main.html')
            }
        }
    )
})

app.post('/init_todo', (req, res)=>{
    console.log('init_todo 호출됨')
    console.log(`사용자 ${user}`)

    const resData = {}
    resData.status = 'Fail'
    resData.data = []

    conn.query('SELECT rid, time, todo FROM todo WHERE id = ? order by time;',
        user,
        (err, rows) => {
            if(err) {
                console.log('SQL QUERY FAIL')
                res.send(resData)
                return
            }

            for(let i=0; i<rows.length; i++) {
                const date_data = new Date(rows[i]['time']).toISOString().split('T')[0]
                const todo_data = rows[i]['todo']
                const rid_data = rows[i]['rid']

                resData.status = 'Ok'
                resData.data.push([date_data, todo_data, rid_data])
            }

            res.send(resData)
        }
    )    
})

app.post('/search_todo', (req, res)=>{
    const trg = req.body.trg

    const currentDate = new Date()

    const resData = {}
    resData.status = 'Fail'
    resData.data = []

    conn.query('SELECT time, todo FROM todo WHERE id=? order by time;',
        user,
        (err, rows)=>{
            if(err) {
                res.send(resData)
                return
            }

            rows.forEach((val)=>{
                let time = new Date(val['time'])
                if (time.getFullYear == currentDate.getFullYear) {
                    let dist = 0
                    dist += (time.getMonth() - currentDate.getMonth()) * 30
                    dist += (time.getDate() - currentDate.getDate())
                    console.log(currentDate, time, dist)

                    if(dist >= 0 && dist <= trg) {
                        time = time.toISOString().split('T')[0]
                        const task = val['todo']
                        resData.data.push([time, task])
                        resData.status = 'Ok' 
                    }
                }
            })

            console.log(resData)
            res.send(resData)
        }
    )
})

app.post('/post_todo', (req, res)=>{
    const todo_date = req.body.date
    const todo_task = req.body.task

    if(todo_date == undefined || todo_task == undefined)
        return

    console.log('Query Try')
    conn.query('INSERT INTO todo (id, time, todo) VALUES (?, ?, ?);'
        ,[user, todo_date, todo_task]
        ,(err, rows)=>{
            if(err) {
                console.log('MySQL QUERY FAIL')
                return
            }

            res.redirect('/public/todo/main.html')
        }
        )

})

app.post('/remove_todo', (req, res)=>{
    console.log('remove todo 호출됨')
    
    const rid = req.body.rid

    conn.query('DELETE FROM todo WHERE rid = ?',
        rid,
        (err, row)=>{
            if(err){
                console.log('DELETE FAIL')
                return
            }

        }
    )
})