const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//register API1
////                     API 1
//                     user registration
// Scenarios
// 1) If the username already exists
// 2) Password is too short
// 3) User created successfully
//change the password to encrypted format using bcrypt() third part library
//npm install bcrypt --save
// const hashedPassword = await bcrypt.hash(password,saltRounds);

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  const postUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const registeredUser = await db.get(postUserQuery);

  if (registeredUser === undefined) {
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;
    if (password.length > 5) {
      const userRegis = await db.run(createUserQuery);
      response.send("User created successfully"); //3
    } else {
      response.status(400);
      response.send("Password is too short"); //2
    }
  } else {
    response.status(400);
    response.send("User already exists"); //1
  }
});

//Login APT2
//                      API 2
//                     USER LOGIN
//      Scenarios
// 1) If an unregistered user tries to login
// 2) If the user provides incorrect password
// 3) Successful login of the user
// compare the encrypted password  and given password is same.
// const result = await bcrypt.compare(givenPassword, passwordInDb)

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginUser = `SELECT *  FROM  user WHERE username = '${username}'`;
  const loginUsersQuery = await db.get(loginUser);

  if (loginUsersQuery !== undefined) {
    const isPasswordCheck = await bcrypt.compare(
      password,
      loginUsersQuery.password
    );

    if (isPasswordCheck) {
      response.status(200);
      response.send("Login success!"); //3
    } else {
      response.status(400);
      response.send("Invalid password"); //2
    }
  } else {
    response.status(400);
    response.send("Invalid user"); //1
  }
});

//Change-password API3
//                     API 3
//                  change Password
//      Scenarios
// 1) If the user provides incorrect current password
// 2)Password is too short
//  3) Password updated
// 4) invalid user
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  // check user
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await db.get(checkUserQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated"); //Scenario 3
      } else {
        response.status(400);
        response.send("Password is too short"); //Scenario 2
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 1
    }
  } else {
    response.status(400);
    response.send(`Invalid user`); // Scenario 4
  }
});
module.exports = app;
