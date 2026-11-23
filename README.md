# แอพแมว (Pet tracking)

เว็บแอพส่วนตัวสำหรับดูแลน้องแมว 5 ตัว เก็บข้อมูลใน Google Sheet ของเจ้าของเอง

- `index.html`: หน้าเว็บไฟล์เดียว โฮสต์บน GitHub Pages
- `apps-script/Code.gs`: หลังบ้านที่ Google Apps Script (JSON API ใช้ API KEY)

## เวอร์ชันแรก
- โปรไฟล์น้อง (วันเกิด อายุ สายพันธุ์ สี เพศ ทำหมัน ไมโครชิป แฮชแท็ก) และรูปน้อง
- บัตรประจำตัว: รูปหน้า-หลัง, ชื่อเจ้าของ, ที่อยู่, วันออกบัตร
- น้ำหนัก: บันทึก ลบ กราฟรายตัวและกราฟรวม (ย้ายข้อมูลจากชีต Pet tracking เดิมมาทั้งหมด)
- ดูแล / สุขภาพ / ค่าใช้จ่าย: เวอร์ชันถัดไป

## ติดตั้งหลังบ้าน
1. สร้างโปรเจกต์ที่ script.google.com แล้ววาง `apps-script/Code.gs`
2. รัน `setup()` หนึ่งครั้ง จะสร้าง Google Sheet "Pet tracking app", โฟลเดอร์ "Pet tracking app – รูป" และ API KEY (ดูใน Execution log)
3. Deploy › New deployment › Web app · Execute as: Me · Who has access: Anyone
4. เปิดหน้าเว็บ ใส่ Web app URL + API KEY หรือใช้ลิงก์ `#setup=` (base64url ของ `{"u":url,"k":key}`)

รูปทั้งหมดเก็บในโฟลเดอร์ Drive ของเจ้าของ ไม่ได้แชร์สาธารณะ หน้าเว็บขอดูรูปผ่าน API ที่ต้องใช้ API KEY เท่านั้น
ลืม API KEY: รันฟังก์ชัน `showApiKey`
