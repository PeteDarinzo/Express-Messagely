/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();


/*** Springboard Method ***/

const DB_URI = (process.env.NODE_ENV === "test")
  ? "postgresql:///messagely_test"
  : "postgresql:///messagely";

/*** End Springboard Method ***/



/*** My Method ***/

//   let DB_URI = {
//     host: "localhost",
//     user: "", // your username 
//     password: "", // your password
//     database: "" // LEAVE BLANK
// }

// DB_URI.database = (process.env.NODE_ENV === 'test') ? "messagely_test" : "messagely";

/*** End my method ***/


const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
};