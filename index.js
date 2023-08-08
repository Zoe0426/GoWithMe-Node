//=====.env 環境設定=====
if (process.argv[2] === "production") {
  require("dotenv").config({
    path: __dirname + "/production.env",
  });
} else if (process.argv[2] === "mac") {
  require("dotenv").config({
    path: __dirname + "/mac.env",
  });
} else {
  require("dotenv").config();
}

//=====載入node套件=====
const http = require("http");
const express = require("express");
const app = express();
const httpServer = http.createServer(app);
const db = require(__dirname + "/modules/db_connect");
const dayjs = require("dayjs");
const cors = require("cors");
const bodyparesr = require("body-parser");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const corsOptions = {
  // Credential: true,
  credentials: true,
  origin: (origin, cb) => {
    console.log({ origin });
    cb(null, true);
  },
};

//socket.io設定白名單
const socketIO = require("socket.io");
const io = socketIO(httpServer, {
  credentials: true,
  cors: {
    origin: (origin, cb) => {
      cb(null, true);
    },
  },

  //老師寫的
  // cors: (req, res) => {
  //   // console.log(req, res)
  //   console.log({ socket: req.headers.origin });
  //   return {
  //     origin: req.headers.origin,
  //   };
  // },
});

const rooms = new Map();

function findAvailableRoom() {
  for (const room of rooms.values()) {
    if (room.users.length < 2) {
      return room;
    }
  }
  return null;
}

function createRoom(adminUsername) {
  const roomName = generateRandomRoomName();

  const newRoom = {
    roomName,
    users: [],
    admin: adminUsername,
  };
  rooms.set(roomName, newRoom);
  return newRoom;
}

function generateRandomRoomName() {
  return uuidv4();
}

io.on("connection", (socket) => {
  //經過連線後在 console 中印出訊息
  console.log("success connect!");

  socket.on("joinRoom", (username) => {
    const adminUsername = "狗with咪客服";
    let room = findAvailableRoom();

    // 如果找不到可用的房間，就創建新的房間
    // if (!room) {
    //   const newRoom = createRoom();
    //   newRoom.users.push({ socketId: socket.id, username });
    //   room = newRoom;
    // } else {
    //   room.users.push({ socketId: socket.id, username });
    // }

    // socket.join(room.roomName);
    // rooms.set(socket.id, room);

    // 發送歡迎訊息給使用者
    // const today = new Date();
    // const hours = String(today.getHours()).padStart(2, "0");
    // const minutes = String(today.getMinutes()).padStart(2, "0");
    // socket.emit("receiveMessage", {
    //   sender: "狗with咪客服",
    //   message: {
    //     message: `您好，這裡是狗with咪線上客服，有什麼需要幫忙的嗎?`,
    //     time: hours + ":" + minutes,
    //     img: "",
    //   },
    // });

    if (username === adminUsername) {
      if(!room){
        room = createRoom(adminUsername);
      }
      // let room = findAvailableRoom();
      room.users.push({ socketId: socket.id, username });
      socket.join(room.roomName);
      rooms.set(socket.id, room);

      // const today = new Date();
      // const hours = String(today.getHours()).padStart(2, "0");
      // const minutes = String(today.getMinutes()).padStart(2, "0");
      // socket.emit("receiveMessage", {
      //   sender: "狗with咪客服",
      //   message: {
      //     message: `您好，這裡是狗with咪線上客服，有什麼需要幫忙的嗎?`,
      //     time: hours + ":" + minutes,
      //     img: "",
      //   },
      // });
    } else {
      // 非管理原分配到其他房間
      const newRoom = createRoom(adminUsername);
      newRoom.users.push({ socketId: socket.id, username });
      socket.join(newRoom.roomName);
      rooms.set(socket.id, newRoom);

      const today = new Date();
      const hours = String(today.getHours()).padStart(2, "0");
      const minutes = String(today.getMinutes()).padStart(2, "0");
      socket.emit("receiveMessage", {
        sender: "狗with咪客服",
        message: {
          message: `您好，這裡是狗with咪線上客服，有什麼需要幫忙的嗎?`,
          time: hours + ":" + minutes,
          img: "default-profile.svg",
        },
      });
    }
  });

  // 當使用者傳送訊息時
  socket.on("sendMessage", (message) => {
    const room = rooms.get(socket.id);
    if (room) {
      const sender = room.users.find(
        (user) => user.socketId === socket.id
      )?.username;
      if (sender) {
        io.to(room.roomName).emit("receiveMessage", { sender, message });
      }
    }
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.id);
    if (room) {
      const userIndex = room.users.findIndex(
        (user) => user.socketId === socket.id
      );
      if (userIndex !== -1) {
        const sender = room.users.find(
          (user) => user.socketId === socket.id
        )?.username;
        const today = new Date();
        const hours = String(today.getHours()).padStart(2, "0");
        const minutes = String(today.getMinutes()).padStart(2, "0");
        io.to(room.roomName).emit("receiveMessage", {
          sender,
          message: {
            sender,
            message: `${sender} 已離開聊天室`,
            time: hours + ":" + minutes,
            img: "",
          },
        });
        room.users.splice(userIndex, 1);
        rooms.delete(socket.id);

        // 如果聊天室沒人，rooms Map中删除
        if (room.users.length === 0) {
          rooms.delete(room.roomName);
        }
      }
    }
  });
});

//=====middle ware=====
app.use(bodyparesr.json());
app.use(cors(corsOptions)); //拜訪權限？
app.use(express.urlencoded({ extended: false })); //翻釋req.body
app.use(express.json()); //翻釋req.body
app.use((req, res, next) => {
  res.title = "狗with咪";
  res.toDateString = (d) => {
    const fm = "YYYY-MM-DD";
    const djs = dayjs(d);
    return djs.format(fm);
  };
  res.toDateDayString = (d) => {
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const date = dayjs(d).format("YYYY.MM.DD");
    const Dday = new Date(date);
    const dayOfWeek = weekdays[Dday.getDay()];
    return `${date}(${dayOfWeek})`;
  };
  res.toDatetimeString = (d) => {
    const fm = "YYYY-MM-DD HH:mm:ss";
    const djs = dayjs(d);
    return djs.format(fm);
  };
  res.toDatetimeString2 = (d) => {
    const fm = "YYYY/MM/DD HH:mm:ss";
    const djs = dayjs(d);
    return djs.format(fm);
  };

  const auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    const token = auth.slice(7);
    let jwtData = null;
    try {
      jwtData = jwt.verify(token, "GoWithMe");
    } catch (ex) {}
    if (jwtData) {
      res.locals.jwtData = jwtData; // 標記有沒有使用 token
    }
    // console.log(jwtData);
  }

  next();
});

//=====測試=====
app.get("/", (req, res) => {
  res.send("Hello");
});
app.get("/test-db", async (req, res) => {
  //連線、轉換日期格式
  const [data] = await db.query("SELECT * FROM address_book LIMIT 2");
  data.forEach((i) => {
    i.birthday = res.toDatetimeString(i.birthday);
    i.created_at = res.toDatetimeString(i.created_at);
  });
  res.json(data);
});
//=====api路由=====
app.use("/member-api", require(__dirname + "/routes/member-api"));
app.use("/shop-api", require(__dirname + "/routes/shop-api"));
app.use("/activity-api", require(__dirname + "/routes/activity-api"));
app.use("/restaurant-api", require(__dirname + "/routes/restaurant-api"));
app.use("/forum-api", require(__dirname + "/routes/forum-api"));
app.use("/cart-api", require(__dirname + "/routes/cart-api"));

//=====測試api路由，依需求建立=====
app.use("/test-api", require(__dirname + "/routes/test/c-test-api"));
//=====static=====
app.use(express.static("public"));
//=====自訂404=====
app.use((req, res) => {
  res.type("text/html");
  res.status(404);
  res.send("<h1>404 - not found</h1>");
});

//=====port設定=====
const port = process.env.PORT || 3001;
httpServer.listen(port);
/*
app.listen(port, () => {
  console.log("start server, port:" + port);
});
*/
