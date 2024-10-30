const express = require("express");
const connection = require("../database");
const router = express.Router();
const { isUser } = require('./middleware');

// router.post('/bookings',isUser, async (req, res) => {
//     const description = req.body.booking.description;
//     const timeslots = req.body.bookingdetail;
//     const userId = req.session.userID; // รับไอดีผู้ใช้จาก session

//     const bookingdetail = [];

//     try {
//         // เริ่ม Transaction
//         await connection.query('START TRANSACTION');

//         // เพิ่มข้อมูลในตาราง Bookings
//         const [bookingResult] = await connection.execute(
//             'INSERT INTO Bookings (userID ,status, description, created_at) VALUES (?,?, ?, CURRENT_TIMESTAMP)',
//             [userId,1, description]
//         );

//         const bookingID = bookingResult.insertId;

//         // สร้าง array ของคำสั่ง SQL สำหรับการเพิ่มข้อมูลในตาราง Bookingdetail
//         for (const slot of timeslots) {
//             bookingdetail.push([bookingID, slot.timeslotID]);
//         }

//         // เพิ่มข้อมูลในตาราง Bookingdetail ด้วยการ execute ทีละแถว
//         for (const detail of bookingdetail) {
//             await connection.execute(
//                 'INSERT INTO Bookingdetail (bookingID, timeslotID, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
//                 detail
//             );
//         }

//         // Commit Transaction เมื่อไม่มีข้อผิดพลาดเกิดขึ้น
//         await connection.query('COMMIT');

//         res.status(200).json({ message: 'Booking successful' });
//     } catch (error) {
//         // ยกเลิกการเปลี่ยนแปลงทั้งหมดที่เกิดขึ้น
//         await connection.query('ROLLBACK');

//         console.error('Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

//เพิ่มเรื่องสถานะ ได้แล้ว

router.post('/bookings', isUser, async (req, res) => {
    const description = req.body.booking.description;
    const timeslots = req.body.bookingdetail;
    const userId = req.session.userID; // รับไอดีผู้ใช้จาก session

    const bookingdetail = [];

    try {
        // เริ่ม Transaction
        await connection.query('START TRANSACTION');

        const unavailableRooms = [];

        // ตรวจสอบสถานะของห้องประชุมที่ผู้ใช้ร้องขอจอง
        for (const slot of timeslots) {
            const [availableRooms] = await connection.execute(
                'SELECT * FROM AvailableTimeslots WHERE timeslotID = ? AND status = "1"',
                [slot.timeslotID]
            );

            // ถ้าห้องประชุมไม่ว่าง
            if (availableRooms.length === 0) {
                unavailableRooms.push(slot.timeslotID);
            }
        }

        // ถ้ามีห้องที่ไม่ว่าง
        if (unavailableRooms.length > 0) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'Meeting room is not available', unavailableRooms });
        }

        // เพิ่มข้อมูลในตาราง Bookings
        const [bookingResult] = await connection.execute(
            'INSERT INTO Bookings (userID ,status, description, created_at) VALUES (?,?, ?, CURRENT_TIMESTAMP)',
            [userId, 1, description]
        );

        const bookingID = bookingResult.insertId;

        // สร้าง array ของคำสั่ง SQL สำหรับการเพิ่มข้อมูลในตาราง Bookingdetail
        for (const slot of timeslots) {
            bookingdetail.push([bookingID, slot.timeslotID]);
        }

        // เพิ่มข้อมูลในตาราง Bookingdetail ด้วยการ execute ทีละแถว
        for (const detail of bookingdetail) {
            await connection.execute(
                'INSERT INTO Bookingdetail (bookingID, timeslotID, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                detail
            );

            // อัปเดตสถานะของ timeslot ที่ผู้ใช้ร้องขอมาเพื่อจอง
            await connection.execute(
                'UPDATE AvailableTimeslots SET status = 2 WHERE timeslotID = ? AND status = "1"',
                [detail[1]]
            );
        }

        // Commit Transaction เมื่อไม่มีข้อผิดพลาดเกิดขึ้น
        await connection.query('COMMIT');

        res.status(200).json({ message: 'Booking successful' });
    } catch (error) {
        // ยกเลิกการเปลี่ยนแปลงทั้งหมดที่เกิดขึ้น
        await connection.query('ROLLBACK');

        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//booking ที่ตัวเองจอง

//ยังไม่จอย
// router.get('/bookings', isUser, async (req, res) => {
//     const userId = req.session.userID;

//     try {
//         const [bookings] = await connection.execute(
//             'SELECT * FROM Bookings WHERE userID = ?',
//             [userId]
//         );

//         // สร้างอาร์เรย์เพื่อเก็บข้อมูลการจองทั้งหมด
//         const userBookings = [];

//         // วนลูปผ่านการจองทั้งหมดของผู้ใช้
//         for (const booking of bookings) {
//             const [bookingDetails] = await connection.execute(
//                 'SELECT * FROM Bookingdetail WHERE bookingID = ?',
//                 [booking.bookingID]
//             );

//             // เพิ่มข้อมูลการจองและรายละเอียดการจองในอาร์เรย์ผลลัพธ์
//             userBookings.push({
//                 booking,
//                 bookingDetails
//             });
//         }

//         res.status(200).json(userBookings);
//         res.render('user-bookings', { userBookings });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

//จอยได้แล้ว แต่ยังไม่ดูดีเทล

router.get('/bookings', isUser, async (req, res) => {
    const userId = req.session.userID;

    try {
        const [bookings] = await connection.execute(
            'SELECT b.*, r.*, at.* ,DATE_FORMAT(b.created_at, "%d-%m-%Y"), b.status as bstatus FROM Bookings b ' +
            'JOIN Bookingdetail bd ON b.bookingID = bd.bookingID ' +
            'JOIN AvailableTimeslots at ON bd.timeslotID = at.timeslotID ' +
            'JOIN Rooms r ON at.roomID = r.roomid ' +
            'WHERE b.userID = ?',
            [userId]
        );

        const userBookings = {};
        for (const booking of bookings) {
            const { bookingID, roomname, endTime, startTime, timeslotID } = booking;

            if (!userBookings[bookingID]) {
                const created_at = booking.created_at
                const day = created_at.getDate();
                const month = created_at.getMonth() + 1; // เพิ่ม 1 เนื่องจากเดือนใน JavaScript เริ่มต้นที่ 0
                const year = created_at.getFullYear();

                const formattedCreatedAt = `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year}`;

                userBookings[bookingID] = {
                    bookingID,
                    status: booking.bstatus,
                    description: booking.description,
                    created_at: formattedCreatedAt,
                    bookingDetails: []
                };
                //  console.log( userBookings[bookingID].status)

            }

            userBookings[bookingID].bookingDetails.push({
                timeslotID,
                roomname,
                startTime,
                endTime
            });
        }
        
        // แปลง object เป็น array เพื่อส่งไปยัง EJS
        const userBookingsArray = Object.values(userBookings);
        //  res.status(200).json(userBookings);

        res.render('user-bookings', { userBookings: userBookingsArray });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



//ยกเลิกจอง
// router.put('/bookings/:bookingID', isUser, async (req, res) => {
//     const userID = req.session.userID; // รับ userID จาก session
//     const bookingID = req.params.bookingID;

//     try {
//         // ค้นหา booking โดยใช้ bookingID
//         const [booking] = await connection.execute(
//             'SELECT * FROM Bookings WHERE bookingID = ?',
//             [bookingID]
//         );

//         // ตรวจสอบว่า bookingID ที่ต้องการยกเลิกมีข้อมูลใน deleted_at หรือไม่
//         if (booking.deleted_at  !== null) {
//             return res.status(400).json({ error: 'Booking already canceled' }); // ถ้ามีข้อมูลใน deleted_at แสดงว่ายกเลิกไปแล้ว ให้ส่งข้อความ error และสถานะ 400 Bad Request
//         }

//         // ตรวจสอบว่า userID ของผู้ใช้ที่ทำการยกเลิกตรงกับ userID ที่เป็นเจ้าของการจองหรือไม่
//         if (booking.userID !== userID) {
//             return res.status(403).json({ error: 'Unauthorized' }); // ถ้าไม่ตรงกันให้ส่งข้อความ error และสถานะ 403 Forbidden
//         }

//         // เริ่ม Transaction
//         await connection.query('START TRANSACTION');

//         // อัปเดต status และเวลาที่ยกเลิกของการจอง
//         await connection.execute(
//             'UPDATE Bookings SET status = 0, deleted_at = CURRENT_TIMESTAMP WHERE bookingID = ?',
//             [bookingID]
//         );

//         // ค้นหา timeslotID ที่เกี่ยวข้องกับ bookingID ในตาราง Bookingdetail
//         const [bookingDetails] = await connection.execute(
//             'SELECT timeslotID FROM Bookingdetail WHERE bookingID = ?',
//             [bookingID]
//         );

//         // เปลี่ยน status ในตาราง AvailableTimeslots เป็น 1 สำหรับทุก timeslotID ที่เกี่ยวข้อง
//         for (const detail of bookingDetails) {
// await connection.execute(
//     'UPDATE Bookingdetail SET deleted_at = CURRENT_TIMESTAMP WHERE detailID = ?',
//     [detail.detailID]
// );

//             await connection.execute(
//                 'UPDATE AvailableTimeslots SET status = 1 WHERE timeslotID = ?',
//                 [detail.timeslotID]
//             );
//         }

//         // Commit Transaction เมื่อไม่มีข้อผิดพลาดเกิดขึ้น
//         await connection.query('COMMIT');

//         res.status(200).json({ message: 'Booking canceled successfully' });
//     } catch (error) {
//         // Rollback Transaction เมื่อเกิดข้อผิดพลาด
//         await connection.query('ROLLBACK');

//         console.error('Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.put('/bookings/:bookingID', isUser, async (req, res) => {
    const userID = req.session.userID; // Get userID from session
    const bookingID = req.params.bookingID;

    try {
        // Search
        const [booking] = await connection.execute(
            'SELECT * FROM Bookings WHERE bookingID = ?',
            [bookingID]
        );

        // Check if the booking to be canceled has data in deleted_at
        if (booking[0].deleted_at !== null) {
            return res.status(400).json({ error: 'Booking already canceled' });
        }

        // Check if the userID of the user 
        if (booking[0].userID !== userID) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Start Transaction
        await connection.query('START TRANSACTION');

        // Update status and cancellation time of the booking
        await connection.execute(
            'UPDATE Bookings SET status = 0, deleted_at = CURRENT_TIMESTAMP WHERE bookingID = ?',
            [bookingID]
        );

        // Find timeslotIDs associated with the bookingID in the Bookingdetail table
        const [bookingDetails] = await connection.execute(
            'SELECT * FROM Bookingdetail WHERE bookingID = ?',
            [bookingID]
        );

        for (const detail of bookingDetails) {
            await connection.execute(
                'UPDATE Bookingdetail SET deleted_at = CURRENT_TIMESTAMP WHERE bookingdetailID = ?',
                [detail.bookingdetailID]
            );
            await connection.execute(
                'UPDATE AvailableTimeslots SET status = 1 WHERE timeslotID = ?',
                [detail.timeslotID]
            );
        }

        // Commit Transaction if no errors occur
        await connection.query('COMMIT');

        res.status(200).json({ message: 'Booking canceled successfully' });
    } catch (error) {
        // Rollback Transaction if an error occurs
        await connection.query('ROLLBACK');

        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//timeไม่ได้
// router.get('/readtime', isUser, async (req, res) => {
//     const userId = req.session.userID;

//     try {
//         const query = 'SELECT  timeslotID  FROM AvailableTimeslots WHERE status = "1" or status = "2"';
//         const [AvailableTimeslots] = await connection.execute(query);

//         // const [AvailableTimeslots] = await connection.execute(
//         //     'SELECT  r.*, bd.*, at.* FROM Bookings b ' +
//         //     'JOIN Bookingdetail bd ON b.bookingID = bd.bookingID ' +
//         //     'JOIN AvailableTimeslots at ON bd.timeslotID = at.timeslotID ' +
//         //     'JOIN Rooms r ON at.roomID = r.roomid ' +
//         //     'WHERE at.status = "1" OR at.status = "2"'
//         // );

//         // const AvailableTimeslotsOn = {};
//         // for (const at of AvailableTimeslots) {
//         //     const { capacity, roomtype, description, roomname, roomid, endTime, startTime, status, timeslotID } = at;

//         //     if (!AvailableTimeslotsOn[roomid]) {
//         //         AvailableTimeslotsOn[roomid] = {
//         //             roomid,
//         //             capacity,
//         //             roomtype,
//         //             roomname,
//         //             description,
//         //             timedetail:[]
//         //         };
//         //     }
//             console.log(AvailableTimeslots)
//             // AvailableTimeslotsOn[roomid].timedetail.push({
//             //     endTime,
//             //     startTime,
//             //     status,
//             //     timeslotID
//             //             });
//         // }

//         // แปลง object เป็น array เพื่อส่งไปยัง EJS
//         // const userBookingsArray = Object.values(AvailableTimeslotsOn);
//         // Now you can use AvailableTimeslotsOn object as needed

//         // res.status(200).json(AvailableTimeslotsOn);

//         // You can render an EJS file here if needed
//         // res.render('user-bookingrooms', { AvailableTimeslotsOn });

//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

//

router.get('/readtime', isUser, async (req, res) => {
    const userId = req.session.userID;

    try {
        const query = `
        SELECT AvailableTimeslots.*, Rooms.*, AvailableTimeslots.status AS statustime,
               DATE_FORMAT(AvailableTimeslots.date, '%d-%m-%Y') AS formattedDate
        FROM AvailableTimeslots
        JOIN Rooms ON AvailableTimeslots.roomID = Rooms.roomid 
        WHERE AvailableTimeslots.status = "1"         
        `;
        const [availableTimeslots] = await connection.execute(query);

        res.render('user-bookingrooms', { availableTimeslots });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//สถานะการจอง user ในกรณีเลยเวลามาเช็คอิน ต้องปล่อยว่าง
const updateTimeslotStatuslate = async () => {
    try {
        const q = `SELECT b.*, r.*, bd.*, at.* FROM Bookings b 
        JOIN Bookingdetail bd ON b.bookingID = bd.bookingID 
        JOIN AvailableTimeslots at ON bd.timeslotID = at.timeslotID 
        JOIN Rooms r ON at.roomID = r.roomid 
        WHERE b.status = "1"`
        const [rows, fields] = await connection.execute(q);

        const currentTime = new Date();
        const thaiTime = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours to convert to Thai time zone

        // console.log(thaiTime);

        // await connection.query('START TRANSACTION');

        for (const booking of rows) {
            const { date, startTime, timeslotID, bookingdetailID, bookingID, status } = booking;

            const [hours, minutes, seconds] = startTime.split(':').map(Number);

            // แปลงเวลาจาก UTC เป็น milliseconds
            const utcTime = new Date(date).getTime();

            // คำนวณ timezone offset และแปลงเวลาเป็น milliseconds ใน timezone ของประเทศไทย
            const fifteenMinutesBeforeStartTime = new Date(utcTime + (7 * 60 * 60 * 1000));

            // const fifteenMinutesBeforeStartTime = new Date(date); // สร้างวัตถุ Date ใหม่จากค่า date เพื่อปรับเปลี่ยนค่าได้
            // console.log("date", fifteenMinutesBeforeStartTime);

            fifteenMinutesBeforeStartTime.setUTCHours(hours);
            fifteenMinutesBeforeStartTime.setUTCMinutes(minutes + 15); // ลบ 15 นาทีจากนาทีเริ่มต้น
            fifteenMinutesBeforeStartTime.setUTCSeconds(seconds);

            // console.log("date", fifteenMinutesBeforeStartTime);
            // console.log("bk", bookingID, "statustime", status);


            // const startTime = new Date(booking.startTime);
            // const fifteenMinutesBeforeStartTime = new Date(startTime.getTime() + 15 * 60000);

            if (thaiTime >= fifteenMinutesBeforeStartTime) {

                console.log(thaiTime)
                console.log(fifteenMinutesBeforeStartTime)
                console.log(bookingID)
                console.log(timeslotID)

                await connection.execute(
                    'UPDATE Bookings SET status = 0 ,deleted_at = CURRENT_TIMESTAMP WHERE bookingID = ?',
                    [bookingID]
                );

                const [bookingDetails] = await connection.execute(
                    'SELECT * FROM Bookingdetail WHERE bookingID = ?',
                    [bookingID]
                );

                for (const detail of bookingDetails) {
                    //
                    await connection.execute(
                        'UPDATE Bookingdetail SET deleted_at = CURRENT_TIMESTAMP WHERE bookingdetailID = ?',
                        [detail.bookingdetailID]
                    );

                    await connection.execute(
                        'UPDATE AvailableTimeslots SET status = 1 WHERE timeslotID = ?',
                        [detail.timeslotID]
                    );
                }
            }
        }

        // await connection.query('COMMIT');
    } catch (error) {
        // await connection.query('ROLLBACK');
        console.error('Error:', error);
    }
}

//มาตามจอง
router.put('/bookingcheck/:bookingID', isUser, async (req, res) => {
    const bookingID = req.params.bookingID;

    try {
        const [result] = await connection.execute(
            'UPDATE Bookings SET status = 3 WHERE bookingID = ?',
            [bookingID]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: `Timeslot with ID updated successfully` });
        } else {
            res.status(404).json({ error: `Timeslot with ID  not found` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { updateTimeslotStatuslate, router };
