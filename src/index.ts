import express, {Request, Response} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
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
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
  
  app.get('/', async (req, res) => {
    
    let query = 'SELECT * FROM main'
    
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
      filterOrder = ` WHERE ${filterTitle} ${method}`
      //не смог красиво сделать условие в sql запросах
      if (filterTitle === 'date' && filterMethod === 'equal' && !!filterValue) {
        filterOrder = ` WHERE DATE(date) = '${filterValue}'`
      }
      query = query + filterOrder
    }
    
    
    //сортировка
    let sortTitle = req.query.sortTitle as string;
    if (sortTitle) {
      let sortType = (sortTitle.substring(0, 1) === '1') ? 'ASC' : 'DESC'
      let sortColumn = sortTitle.substring(1)
      query = query + ` ORDER BY ${sortColumn} ${sortType}`
    }
    
    //пагинация
    const currentPage = Number(req.query.currentPage) || 1;
    const pageSize = Number(req.query.pageSize) || 4;
    query += ` LIMIT ${pageSize} OFFSET ${(currentPage - 1) * pageSize} `
    
    // получение с сервера общего количества строк
    let totalCount = await client.query(`SELECT COUNT(*) FROM main ${filterOrder}`)
    
    let resp = await client.query(query)
    let data = {
      pageSize: resp.rowCount,
      currentPage: currentPage,
      items: resp.rows,
      totalCount: +totalCount.rows[0].count
    }
    res.status(200).send(data)
  })
  
};

try {
  startApp();
}
catch (e) {
  console.log(e)
}
