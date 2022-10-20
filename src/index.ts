import express, { Request, Response } from 'express';
// import cors from 'cors';
// import bodyParser from 'body-parser';
// import { connectDb } from './repository/db';

const { Client } = require('pg');

export const connectDb = async () => {
  try {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'testDB',
      password: 'sa',
      port: 5432,
    });
    
    await client.connect();
    let res =  await client.query('SELECT * FROM main');
    
    
    console.log(res);
    await client.end();
  } catch (error) {
    console.log(error);
  }
};


const app = express();

// app.use(cors());
// app.use(bodyParser.json());

const port = process.env.PORT || 5000;

const startApp = async () => {
  await connectDb();
  console.log('db connect');
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  app.get('/', async (req, res) => {
    // получение с сервера
    //  let rrr = await db?.query('SELECT * FROM main') || null
    // let books = await db.books.find({}).toArray();
    // const data = await client.query('SELECT * FROM ');
    
     res.send('ечсть контакт')
     // res.send(rrr)
  })
};
startApp();