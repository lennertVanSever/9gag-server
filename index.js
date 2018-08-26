const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { SHA256 } = require("crypto-js");

const { connection } = require("./Connection");
const fs = require("fs");
const uuidv4 = require('uuid/v4');

const server = express();
const PORT = process.env.PORT || 8000;


server.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
});

server.use(express.static('public'))
server.use(bodyParser.json());
server.use(cors({origin: "http://localhost:3000"}));

server.get("/", (request, response) => {
  response.send("on master branch")
})

server.get("/password", (request, response) => {
  const stupidPassword = "password123";
  const hashedPassword = SHA256(stupidPassword);
  console.log({hashedPassword});
})

server.get("/get/jokes", (request, response) => {
  connection.query("select * from joke order by id desc", (error, results) => {
    if(error){
      showError(error);
    }
    response.json(results);
  })
});

server.post("/update/joke/upvote", (request, response) => {
  const { body } = request;
  if(body){
    const { id } = body;
    if(id){
      const sql = "update joke set up_votes = up_votes + 1 where id = ?";
      const values = [id];
      connection.query(sql, values, (error, results) => {
        if(error){
          showError(error, response);
        }
        response.json({status: "succes",message: "joke upvoted"})
      })
    }
  }
})

function showError(error, response){
  console.log(error);
  response.json({status: "error", message: "something went wrong"});
}

server.post("/post/joke", (request, response) => {
  const { body } = request;
  if(body){
    const { title, file } = body;
    console.log({title, file});
    if(file){
      const { base64 } = file;
      const fileName = uuidv4();
      fs.writeFile(`./public/images/${fileName}.jpeg`, base64, 'base64', (error) => {
        if(error){
          console.log(error);
        }
      })

      const sql = "INSERT into joke set ?";
      const values = {
        image_location: `http://10.20.0.18:8000/images/${fileName}.jpeg`,
        title
      }
      connection.query(sql, values, (error, result) => {
        if(error) showError(error, response);
        else {
          console.log(result);
          response.json({status: "succes",message: "joke uploaded"})
        }
      })
    }
  }

})
