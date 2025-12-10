import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';

// Defining variables
const DB_FILE = process.env.DB_FILE;
const PORT = process.env.PORT;
let database;
let id = 1;

// Defining server
const app = express();
app.use(express.json());

// Enable CORS for all origins (dev)
app.use(cors());

// Defining functions
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// endpoints
// get all todo items
app.get('/api/todos', (request, response) => {
  try {
    const db = readDB();
    database = db;
    id = Math.max(...db.map(item => parseInt(item.id), 0)) + 1;

    response.json(db);
  } catch (err) {
    response.status(500).json({ error: 'Could not read database' });
  }
});
// add a new todo item
app.post('/api/todos', (request, response) => {
  try {
    const newItem = {
      id,
      ...request.body
    }
    console.log(newItem);
    database.push(newItem);
    console.log(database);
    writeDB(database);

    response.json(newItem);
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});
// update todo item
app.post('/api/todos/:id', (request, response) => {
  try {
    const id = request.params.id;
    const todoItem = database.find(todoItem => todoItem.id == id);

    if (todoItem == null) {
      response.status(404).json({error: "ToDo item not found!"});
      return;
    }

    todoItem.value = request.body.value;
    todoItem.selected = request.body.selected;

    writeDB(database);

    response.json(todoItem);
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});
// delete todo item
app.delete('/api/todos/:id', (request, response) => {
  try {
    const id = parseInt(request.params.id);
    const index = database.map(todoItem => todoItem.id).indexOf(id);

    if (index === -1) {
      response.status(404).json({error: "ToDo item not found!"});
      return;
    }

    database.splice(index, 1);

    writeDB(database);

    response.json({});
  } catch (err) {
    response.status(500).json({ error: 'Could not write database', details: err });
  }
});


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
