const express = require("express");
const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const upload = require(__dirname + "/../modules/img-upload.js");
const multipartParser = upload.none();

// 讀取會員資料
router.get("/", async (req, res) => {
  const [data] = await db.query("SELECT * FROM member_info LIMIT 5");
  res.json(data);
});

// --------------------------------------------
// 新增會員資料

/*
1. sql insert
3. member_sid auto creat mem+00000
4. birth dayjs
5. pwd gensalt
*/

router.post("/", multipartParser, async (req, res) => {
  const sql = `INSERT INTO member_info(
    member_sid, member_name, member_email, 
    member_password, member_mobile, member_gender, 
    member_birth, member_pet, member_level, 
    member_ID, member_profile, 
    create_time, update_time) VALUES(
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?,?,
    NOW(), NOW()
  )`;
  //自動生成會員編號
  // let count = 1;
  // let str = String(count).padStart(5, "0");
  // let memSid = `mem${str}`;
  // console.log(memSid);
  // count++;

  let sql_memSid = `SELECT MAX(member_sid) AS maxSid FROM member_info`;
  let [result_memSid] = await db.query(sql_memSid);
  // res.json(result_memSid);

  let new_memSid = "";
  if (!result_memSid[0].maxSid) {
    new_memSid = "mem00001";
  } else {
    let currentCount = parseInt(result_memSid[0].maxSid.substring(3));
    let newCount = currentCount + 1;
    new_memSid = `mem${String(newCount).padStart(5, "0")}`;
  }

  // 處理生日格式
  let birthday = dayjs(req.body.member_birth);
  if (birthday.isValid()) {
    birthday = birthday.format("YYYY-MM-DD");
  } else {
    birthday = null;
  }

  //密碼加鹽
  const saltRounds = 10;
  let saltPwd = await bcrypt.hash(req.body.member_password, saltRounds);
  console.log(saltPwd);

  const [result] = await db.query(sql, [
    new_memSid,
    req.body.member_name,
    req.body.member_email,
    saltPwd,
    req.body.member_mobile,
    req.body.member_gender,
    birthday,
    req.body.member_pet,
    req.body.member_level,
    req.body.member_ID,
    req.body.member_profile,
  ]);

  res.json({
    result,
    postData: req.body,
  });
});
module.exports = router;

// -----------------------------------
// 修改會員資料
router.put("/:sid", multipartParser, async (req, res) => {
  let { sid } = req.params;

  const sql = `UPDATE member_info SET 
  member_name=?,
  member_email=?,
  member_password=?,
  member_mobile=?,
  member_gender=?,
  member_birth=?,
  member_pet=?,
  member_level=?,
  member_ID=?,
  member_profile=?
  WHERE member_sid='${sid}'`;

  const saltRounds = 10;
  let saltPwd = await bcrypt.hash(req.body.member_password, saltRounds);
  console.log(saltPwd);

  const [result] = await db.query(sql, [
    req.body.member_name,
    req.body.member_email,
    saltPwd,
    req.body.member_mobile,
    req.body.member_gender,
    req.body.member_birth,
    req.body.member_pet,
    req.body.member_level,
    req.body.member_ID,
    req.body.member_profile,
    req.body.member_profile,
  ]);

  res.json({
    success: !!result.changedRows,
    result,
  });
});
