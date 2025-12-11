import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

// Defining variables
const DB_FILE = process.env.DB_FILE;
const PORT = process.env.PORT;
const AWS_REGION = process.env.AWS_REGION;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

let database;
let id = 1;
const s3 = new S3Client({ region: AWS_REGION });

// Defining server
const app = express();
app.use(express.json());

// Enable CORS for all origins (dev)
app.use(cors());

// Defining functions
async function readDB() {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: DB_FILE });
  const data = await s3.send(command);
  console.log(`File ${key} read successfully`);
  return JSON.parse(data);
}

async function writeDB(data) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: DB_FILE,           // same object key
    Body: data,   // new content
    ContentType: "application/json" // or appropriate MIME type
  });

  await s3.send(command);
  console.log(`File ${key} updated successfully`);
}

// endpoints
// get all todo items
app.get('/api/todos', async (request, response) => {
  try {
    const db = await readDB();
    database = db;
    id = Math.max(...db.map(item => parseInt(item.id)), 0) + 1;

    console.log("GET /todos");

    response.json(db);
  } catch (err) {
    response.status(500).json({ error: 'Could not read database' });
  }
});
// add a new todo item
app.post('/api/todos', async (request, response) => {
  try {
    const newItem = {
      id,
      ...request.body
    }
    database.push(newItem);
    await writeDB(database);

    console.log(`POST /todos ${newItem}`);

    response.json(newItem);
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});
// update todo item
app.post('/api/todos/:id', async (request, response) => {
  try {
    const id = request.params.id;
    const todoItem = database.find(todoItem => todoItem.id == id);

    if (todoItem == null) {
      console.log(`PUT /todos/${id} TODO item not found`);

      response.status(404).json({error: "ToDo item not found!"});
      return;
    }

    todoItem.value = request.body.value;
    todoItem.selected = request.body.selected;

    console.log(`PUT /todos/${id} ${todoItem}`);

    await writeDB(database);

    response.json(todoItem);
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});
// delete todo item
app.delete('/api/todos/:id', async (request, response) => {
  try {
    const id = parseInt(request.params.id);
    const index = database.map(todoItem => todoItem.id).indexOf(id);

    if (index === -1) {
      response.status(404).json({error: "ToDo item not found!"});
      return;
    }

    database.splice(index, 1);

    await writeDB(database);

    console.log(`DELETE /todos/${id}`);

    response.json({});
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
