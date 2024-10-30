const express = require("express");
const connection = require("../database");
const router = express.Router();
const { isAdmin, isUser } = require('./middleware'); // Import isAdmin middleware

router.get('/addroompage', (req, res) => {
    res.render('addroom');
})

router.get('/readrooms', isAdmin, async (req, res, next) => {
    try {
        const query = 'SELECT * FROM Rooms where status="1"';
        const [rows, fields] = await connection.execute(query);
        // console.log("r",rows,"f",fields)
        res.render('adminroom', { rooms: rows }); // ส่งข้อมูล Rooms ไปยังหน้า adminroom.ejs
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/searchrooms', isAdmin, async (req, res, next) => {
    try {
        let query = 'SELECT * FROM Rooms WHERE status = "1"'; // เริ่มต้นด้วยการเลือกห้องทั้งหมดที่สถานะเป็น "1"

        const searchTerm = req.query.searchTerm; // รับค่าคำค้นหาจาก query parameter

        if (searchTerm) {
            // หากมีคำค้นหาจากผู้ใช้
            query += ` AND (roomname LIKE '%${searchTerm}%' OR capacity LIKE '%${searchTerm}%')`; // เพิ่มเงื่อนไขในการค้นหาด้วยชื่อห้องหรือความจุ
        }

        const [rows, fields] = await connection.execute(query);

        res.render('adminroom', { rooms: rows }); // ส่งข้อมูล Rooms ไปยังหน้า adminroom.ejs
    } catch (error) {
        res.status(500).json(error);
    }
});

// router.post('/api/add_timeslots', (req, res) => {
//     const { date, startTime, endTime, roomId } = req.body;

//     // เปลี่ยน StartTime เป็น Timestamp เพื่อให้ง่ายต่อการคำนวณ
//     const startTimestamp = new Date(`2000-01-01T${startTime}`);
//     const endTimestamp = new Date(`2000-01-01T${endTime}`);
//     console.log(endTimestamp,date,roomId)

//     // แปลงเวลาเป็นระยะเวลาในนาที
//     const startMinutes = startTimestamp.getHours() * 60 + startTimestamp.getMinutes();
//     const endMinutes = endTimestamp.getHours() * 60 + endTimestamp.getMinutes();

//     const timeslots = [];
//     console.log(endMinutes)

//     // สร้าง Timeslots จาก StartTime ถึง EndTime ทีละชั่วโมง
//     for (let i = startMinutes; i < endMinutes; i += 60) {
//         const slotStartTime = new Date(`2000-01-01T${startTime}`);
//         const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60000); // เพิ่ม 60 นาทีให้กับเวลาเริ่มต้น
//         timeslots.push([date, slotStartTime, slotEndTime, roomId, '1']); // '1' คือสถานะที่เป็นไปได้ (status)
//         slotStartTime.setMinutes(slotStartTime.getMinutes() + 60); // เลื่อนไปอีก 60 นาที
//     }
//     console.log(timeslots)
//     const queryString = `INSERT INTO AvailableTimeslots (date, startTime, endTime, roomid, status) VALUES ?`;

//     connection.query(queryString, [timeslots], (err, result) => {
//         if (err) {
//             console.error('Error adding timeslots:', err);
//             res.status(500).json({ error: 'Internal server error' });
//             return;
//         }

//         res.json({ message: 'Timeslots added successfully' });
//     });
// });
//รอนาน แต่เข้า
// router.post('/api/add_timeslots', (req, res) => {
//     const { date, startTime, endTime, roomId } = req.body;
//     console.log(date, startTime, endTime, roomId)
//     // ตรวจสอบว่ามีค่าที่ถูกต้องและไม่ใช่ค่าว่าง
//     if (!date || !startTime || !endTime || !roomId) {
//         res.status(400).json({ error: 'Missing required fields' });
//         return;
//     }

//     // แปลงค่า startTime และ endTime เป็นรูปแบบที่ถูกต้อง
//     const startTimestamp = new Date(`2000-01-01T${startTime}`);
//     const endTimestamp = new Date(`2000-01-01T${endTime}`);
//     console.log(startTimestamp, endTimestamp)
//     // ตรวจสอบว่า startTime และ endTime เป็นรูปแบบที่ถูกต้องหรือไม่
//     if (isNaN(startTimestamp.getTime()) || isNaN(endTimestamp.getTime())) {
//         res.status(400).json({ error: 'Invalid startTime or endTime format' });
//         return;
//     }

//     // สร้างรายการ timeslots
//     const timeslots = [];

//     // สร้าง Timeslots จาก StartTime ถึง EndTime ทีละชั่วโมง
//     for (let i = startTimestamp; i < endTimestamp; i.setHours(i.getHours() + 1)) {
//         const slotStartTime = new Date(i);
//         const slotEndTime = new Date(i.getTime() + 60 * 60000); // เพิ่ม 60 นาทีให้กับเวลาเริ่มต้น
//         timeslots.push([date, slotStartTime, slotEndTime, roomId, '1']); // '1' คือสถานะที่เป็นไปได้ (status)
//     }
//     console.log(timeslots)

//     const queryString = `INSERT INTO AvailableTimeslots (date, startTime, endTime, roomid, status) VALUES ?`;

//     connection.query(queryString, [timeslots], (err, result) => {
//         if (!err) {
//             return res.status(200).json({ message: "success" });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }

//         // res.json({ message: 'Timeslots added successfully' });
//     });
// });

//ได้ เหมือนใช้ promise จะไม่เป็นปัญหา callback เป็นปัญหา
// router.post('/api/add_timeslots', isAdmin ,async (req, res) => {
//     const { date, startTime, endTime, roomId } = req.body;

//     // ตรวจสอบค่าที่ส่งมา
//     if (!date || !startTime || !endTime || !roomId) {
//       res.status(400).json({ error: 'Missing required fields' });
//       return;
//     }

//     const startTimestamp = new Date(`2000-01-01T${startTime}`);
//     const endTimestamp = new Date(`2000-01-01T${endTime}`);

//     // ตรวจสอบว่า startTime และ endTime เป็นรูปแบบที่ถูกต้องหรือไม่
//     if (isNaN(startTimestamp.getTime()) || isNaN(endTimestamp.getTime())) {
//       res.status(400).json({ error: 'Invalid startTime or endTime format' });
//       return;
//     }

//     const timeslots = [];

//     // สร้าง Timeslots จาก StartTime ถึง EndTime ทีละชั่วโมง
//     for (let i = startTimestamp; i < endTimestamp; i.setHours(i.getHours() + 1)) {
//       const slotStartTime = new Date(i);
//       const slotEndTime = new Date(i.getTime() + 60 * 60000); // เพิ่ม 60 นาทีให้กับเวลาเริ่มต้น
//       timeslots.push([date, slotStartTime, slotEndTime, roomId, '1']); // '1' คือสถานะที่เป็นไปได้ (status)
//     }

//     const queryString = `INSERT INTO AvailableTimeslots (date, startTime, endTime, roomid, status) VALUES ?`;

//     try {
//       await connection.query(queryString, [timeslots]);
//       res.status(200).json({ message: 'Timeslots added successfully' });
//     } catch (error) {
//       console.error('MySQL Error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });


//เวลา เก็บ user ด้วย
//ไปเพิ่มเงื่อนไขวัน ห้อง เวลา ซ้ำ

router.post('/add_timeslots', isAdmin, async (req, res) => {
    const { date, startTime, endTime, roomId } = req.body;
    const userId = req.session.userID; // รับไอดีผู้ใช้จาก session

    // ตรวจสอบค่าที่ส่งมา
    if (!date || !startTime || !endTime || !roomId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const startTimestamp = new Date(`2000-01-01T${startTime}`);
    const endTimestamp = new Date(`2000-01-01T${endTime}`);

    // ตรวจสอบว่า startTime และ endTime เป็นรูปแบบที่ถูกต้องหรือไม่
    if (isNaN(startTimestamp.getTime()) || isNaN(endTimestamp.getTime())) {
        res.status(400).json({ error: 'Invalid startTime or endTime format' });
        return;
    }

    const timeslots = [];

    // สร้าง Timeslots จาก StartTime ถึง EndTime ทีละชั่วโมง
    for (let i = startTimestamp; i < endTimestamp; i.setHours(i.getHours() + 1)) {
        const slotStartTime = new Date(i);
        const slotEndTime = new Date(i.getTime() + 60 * 60000); // เพิ่ม 60 นาทีให้กับเวลาเริ่มต้น
        timeslots.push([date, slotStartTime, slotEndTime, roomId, '1', userId]); // เพิ่ม userId ใน timeslot
    }

    const queryString = `INSERT INTO AvailableTimeslots (date, startTime, endTime, roomid, status, userId) VALUES ?`;

    try {
        await connection.query(queryString, [timeslots]);
        res.status(200).json({ message: 'Timeslots added successfully' });
    } catch (error) {
        console.error('MySQL Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//ลองหลายวัน

router.post('/add_timeslots_range', isAdmin, async (req, res) => {
    const { startdates, enddates, startTime, endTime, roomId } = req.body;
    const userId = req.session.userID;

    try {
        const roomIds = Array.isArray(roomId) ? roomId : [roomId]; // ตรวจสอบว่า roomId เป็นอาร์เiมั้ย

        const timeslotData = [];

        // วน date เพิ่มทีละวัน
        for (let date = new Date(startdates); date <= new Date(enddates); date.setDate(date.getDate() + 1)) {
            //ววน เวลา
            for (let i = new Date(`${date.toISOString().split('T')[0]}T${startTime}`); i < new Date(`${date.toISOString().split('T')[0]}T${endTime}`); i.setHours(i.getHours() + 1)) {
                const slotStartTime = new Date(i);
                const slotEndTime = new Date(i.getTime() + 60 * 60000); // 60 minutes
                //วนเข้า timeslotData
                for (const id of roomIds) {
                    timeslotData.push([date.toISOString().split('T')[0], slotStartTime, slotEndTime, id, '1', userId]);
                }
            }
        }

        const queryString = `INSERT INTO AvailableTimeslots (date, startTime, endTime, roomid, status, userId) VALUES ?`;
        await connection.query(queryString, [timeslotData]);

        res.status(200).json({ message: 'Timeslots added successfully' });
    } catch (error) {
        console.error('MySQL Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




//สถานะรอบเวลา
router.put('/timeslots/:timeslotID', isAdmin, async (req, res) => {
    const timeslotID = req.params.timeslotID;

    try {
        const [result] = await connection.execute(
            'UPDATE AvailableTimeslots SET status = 0 WHERE timeslotID = ?',
            [timeslotID]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: `Timeslot with ID ${timeslotID} updated successfully` });
        } else {
            res.status(404).json({ error: `Timeslot with ID ${timeslotID} not found` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//ไปเพิ่มเงื่อนไข ห้อง ซ้ำ
// router.post('/addrooms', isAdmin, async (req, res) => {
//     const { roomname, capacity, description, roomtype ,status} = req.body;
//     const userId = req.session.userID;

//     const queryString = `INSERT INTO Rooms (roomname,capacity,description,roomtype,userId,status) VALUES (?,?,?,?,?,?)`;
//     try {
//         // await connection.query(queryString, [room]);
//         await connection.query(queryString, [roomname, capacity, description, roomtype, userId,"1"]);
//         res.redirect('/admin/readrooms');
//         //  res.status(200).json({ message: 'Rooms added successfully' });
//     } catch (error) {
//         console.error('MySQL Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


router.post('/addrooms', isAdmin, async (req, res) => {
    const { roomname, capacity, description, roomtype, status } = req.body;
    const userId = req.session.userID;

    try {
        // ตรวจสอบว่ามีห้องที่มีชื่อซ้ำกันหรือไม่
        const [existingRooms] = await connection.execute('SELECT * FROM Rooms WHERE roomname = ?', [roomname]);

        // ถ้ามีห้องที่มีชื่อเหมือนกันในฐานข้อมูลอยู่แล้ว
        if (existingRooms.length > 0) {
            return res.status(400).json({ error: 'Room with the same name already exists' });
        }

        // หากไม่มีห้องที่มีชื่อเหมือนกันในฐานข้อมูล
        const queryString = 'INSERT INTO Rooms (roomname, capacity, description, roomtype, userId, status) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.query(queryString, [roomname, capacity, description, roomtype, userId, status || '1']);
        
        res.redirect('/admin/readrooms');
        //  res.status(200).json({ message: 'Rooms added successfully' });
    } catch (error) {
        console.error('MySQL Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.put('/rooms/:roomId', isAdmin, async (req, res) => {
    const roomId = req.params.roomId; // รับค่า ID ของห้องที่ต้องการแก้ไขจาก URL
    const { roomname, capacity, description, roomtype } = req.body;
    const userId = req.session.userID;

    // ตรวจสอบค่าที่ส่งมา
    if (!roomname || !capacity || !description || !roomtype) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const queryString = `UPDATE Rooms SET roomname=?, capacity=?, description=?, roomtype=?, userId=? WHERE roomId=?`;
    const values = [roomname, capacity, description, roomtype, userId, roomId];

    try {
        await connection.query(queryString, values);
        res.status(200).json({ message: 'Room updated successfully' });
    } catch (error) {
        console.error('MySQL Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.put('/roomsdelete/:roomId', isAdmin, async (req, res) => {
    const roomId = req.params.roomId; // รับค่า ID ของห้องที่ต้องการแก้ไขจาก URL
    // const { status } = req.body;

    const queryString = `UPDATE Rooms SET status=? WHERE roomId=?`;
    const values = ["0", roomId];

    try {
        await connection.query(queryString, values);
        res.status(200).json({ message: 'Room updated successfully' });
    } catch (error) {
        console.error('MySQL Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//
const updateTimeslotStatus = async () => {
    try {
        // ดึงข้อมูลทุกวันเวลาที่มีสถานะเป็น 1
        const query = 'SELECT * FROM AvailableTimeslots WHERE status = "1" or status = "2"';
        const [rows, fields] = await connection.execute(query);
        //split bo dai
        // const rows = await connection.execute(query);

        // วันที่ปัจจุบัน
        const currentDate = new Date();
        const thaiTime = new Date(currentDate.getTime() + (7 * 60 * 60 * 1000)); // เพิ่ม 7 ชั่วโมง (7 * 60 * 60 * 1000 milliseconds) เพื่อแปลงเป็นเวลาในโซนเวลาของไทย

        // console.log(currentDate)
        // console.log(thaiTime)

        // วนลูปผ่านข้อมูลทุกวันเวลา
        for (const timeslot of rows) {
            const { date, endTime, timeslotID } = timeslot;

            // แปลงเวลาจาก UTC เป็น milliseconds
            const utcTime = new Date(date).getTime();

            // คำนวณ timezone offset และแปลงเวลาเป็น milliseconds ใน timezone ของประเทศไทย
            const thaiTime2 = new Date(utcTime + (7 * 60 * 60 * 1000));
            // console.log(date, endTime, thaiTime2)

            const [hours, minutes, seconds] = endTime.split(':').map(Number);

            thaiTime2.setUTCHours(hours);
            thaiTime2.setUTCMinutes(minutes);
            thaiTime2.setUTCSeconds(seconds);
            // console.log(thaiTime2)
            // console.log(thaiTime)

            // เช็คว่าวันที่เป็นวันที่ผ่านมาหรือไม่
            if (thaiTime > thaiTime2) {
                // ถ้าเป็นวันที่ผ่านมาแล้ว ให้ปรับสถานะของวันเวลานี้เป็น 0
                await connection.execute('UPDATE AvailableTimeslots SET status = "0" WHERE timeslotID = ?', [timeslotID]);
            }
        }
    } catch (error) {
        console.error('MySQL Error:', error);
    }
};

//ลแง readtime
// router.get('/readtime', isAdmin, async (req, res) => {
//     // const userId = req.session.userID;

//     try {
//         const query = `
//         SELECT AvailableTimeslots.*, Rooms.*, AvailableTimeslots.status AS statustime,
//                DATE_FORMAT(AvailableTimeslots.date, '%d-%m-%Y') AS formattedDate
//         FROM AvailableTimeslots
//         JOIN Rooms ON AvailableTimeslots.roomID = Rooms.roomid 
//         WHERE AvailableTimeslots.status = "1" OR AvailableTimeslots.status = "2"        
//         `;
//         const [availableTimeslots] = await connection.execute(query);

//         res.render('admin-home', { availableTimeslots });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

module.exports = { router, updateTimeslotStatus };

// module.exports = router ; 
