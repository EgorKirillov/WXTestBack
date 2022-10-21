import express, {Request, Response} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import { connectDb } from './repository/db';


const {Client} = require('pg');

let client = new Client()

export const connectDb = async () => {
  try {
    client = new Client({
      // user: 'postgres',
      // host: 'localhost',
      // database: 'testDB',
      // password: 'sa',
      // port: 5432,
      user: 'ddlfvhwbwhxogm',
      host: 'ec2-63-32-248-14.eu-west-1.compute.amazonaws.com',
      database: 'd6qbfami27jt4t',
      password: '6b3ae6dba743dc111e24b7204d7977128392e99eade90cf24c90b299e6f00f0d',
      port: 5432,
      ssl: {
        rejectUnauthorized: false,
      }
    });
    
    await client.connect();
    // let res = await client.query('SELECT * FROM main');
    
    
     // console.log(res);
     console.log('db connect');
    // await client.end();
  } catch (error) {
    console.log(error);
  }
};


const app = express();
app.use(bodyParser.json())
app.use(cors());

const port = process.env.PORT || 5000;

const startApp = async () => {
  await connectDb();
  // console.log('db connect');
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
  
  app.get('/', async (req, res) => {
    
    let query = 'SELECT * FROM main'
    console.log(query)
// фильтрация
    let filterOrder = ``
    let filterTitle = req.query.filterTitle as string;
    let filterMethod = req.query.filterMethod as string; //'equal' | 'includes' | 'more'| 'lower'
    let filterValue: number | string = req.query.filterValue as string;
    
    if (!!filterTitle && !!filterMethod && !!filterValue) {
      let method = `LIKE '%${filterValue as string}%'`
      
      if (filterTitle === 'count' || filterTitle === 'distance') filterValue = Number(req.query.filterValue)
      switch (filterMethod) {
        case  'equal': {
          method = `= ${(filterTitle == 'name' || filterTitle == 'date') ? `'${filterValue}'` : filterValue}`;
          break
        }
        case  'more': {
          method = `> ${(filterTitle == 'date') ? `'${filterValue}'` : filterValue}`;
          break
        }
        case  'lower': {
          method = `< ${(filterTitle == 'date') ? `'${filterValue}'` : filterValue}`;
          break
        }
      }
      console.log(`${filterTitle} ${method}`)
      filterOrder = ` WHERE ${filterTitle} ${method}`
      if (filterTitle === 'date' && filterMethod === 'equal' && !!filterValue) {
        filterOrder = ` WHERE DATE(date) = '${filterValue}'`
      }
      query = query + filterOrder
      console.log(query)
    }
    
    //не смог красиво сделать условие в sql запросах
    if (filterTitle === 'date' && filterMethod === 'equal' && !!filterValue) {
      query = `SELECT * FROM main WHERE DATE(date) = '${filterValue}'`
      
    }
    
    
    //сортировка
    let sortTitle = req.query.sortTitle as string;
    if (sortTitle) {
      let sortType = (sortTitle.substring(0, 1) === '1') ? 'ASC' : 'DESC'
      let sortColumn = sortTitle.substring(1)
      console.log('sort type :' + sortType)
      console.log('sort column :' + sortColumn)
      query = query + ` ORDER BY ${sortColumn} ${sortType}`
    }
    
    //пагинация
    const currentPage = Number(req.query.currentPage) || 1;
    const pageSize = Number(req.query.pageSize) || 4;
    query += ` LIMIT ${pageSize} OFFSET ${(currentPage - 1) * pageSize} `
    console.log(query)
    
    
    // получение с сервера
    let totalCount = await client.query(`SELECT COUNT(*) FROM main ${filterOrder}`)
    console.log(totalCount)
    
    console.log(+totalCount.rows[0].count)
    
    let rrr = await client.query(query)
    // let books = await db.books.find({}).toArray();
    // const data = await client.query('SELECT * FROM ');
    
    
    let data = {
      pageSize: rrr.rowCount,
      currentPage: currentPage,
      items: rrr.rows,
      totalCount: +totalCount.rows[0].count
    }
    res.send(data)
    // res.send(rrr)
  })
  
  
  app.post('/', async (req, res) => {
    
    let rrr = await client.query('SELECT * FROM main')
    // let books = await db.books.find({}).toArray();
    let dataID = 8
    let dataDate = "2003-01-03T21:00:00.000Z"
    let dataName = "newName"
    let dataCount = 199
    let dataDistance = 122159
    // await client.query(`INSERT INTO main (id, date, name, count, distance) VALUES (${dataID}, ${dataDate}, ${dataName}, ${dataCount}, ${dataDistance});`);
    await client.query(`INSERT INTO main ( id, date, name, count, distance) VALUES ( 8, ${new Date()}, "vasya", 199, 100500);`);
    res.send('row created')
    // res.send(rrr)
  })
};
startApp();