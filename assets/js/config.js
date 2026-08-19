/**
 * ============================================================================
 * APP PORTAL - CONFIGURATION FILE (config.js)
 * ============================================================================
 * กำหนดค่าการเชื่อมต่อ Google Apps Script (GAS) Web App URL และค่าเริ่มต้นของระบบ
 */

const CONFIG = {
  // วาง URL ของ Google Apps Script Web App ที่ได้จากการ Deploy ที่นี่
  // ตัวอย่าง: ""
  GAS_API_URL: "",

  // ฟังก์ชันดึง API URL (ตรวจสอบค่าที่บันทึกไว้ใน LocalStorage หรือใช้ค่าจากไฟล์นี้)
  getApiUrl: function () {
    const savedUrl = localStorage.getItem("app_portal_gas_url");
    if (savedUrl && savedUrl.trim() !== "") {
      return savedUrl.trim();
    }
    return this.GAS_API_URL ? this.GAS_API_URL.trim() : "";
  },

  // ฟังก์ชันบันทึก API URL ลงใน LocalStorage
  setApiUrl: function (url) {
    if (url && url.trim() !== "") {
      localStorage.setItem("app_portal_gas_url", url.trim());
    } else {
      localStorage.removeItem("app_portal_gas_url");
    }
  },

  // ข้อมูลจำลองเริ่มต้น (Fallback Mock Data) สำหรับแสดงผลกรณีที่ยังไม่ได้เชื่อมต่อ Google Apps Script
  DEFAULT_DATA: {
    settings: {
      system_name: "ศูนย์รวมบริการดิจิทัล",
      system_icon: "assets/uploads/system_logo.png",
      system_footer: "พัฒนาด้วยความใส่ใจ • รวดเร็ว ปลอดภัย และเสถียร",
      popup_enabled: "0",
      popup_title: "ประกาศสำคัญ",
      popup_content: "ยินดีต้อนรับสู่ระบบศูนย์รวมบริการดิจิทัลรูปแบบใหม่",
      popup_image: "",
      popup_link: "",
      marquee_enabled: "1",
      marquee_text: "ยินดีต้อนรับเข้าสู่ระบบบริการดิจิทัล ให้บริการตลอด 24 ชั่วโมง สะดวก รวดเร็ว ปลอดภัย",
      marquee_color: "danger",
      welcome_banner_image: ""
    },
    categories: [
      { id: 1, name: "ทั่วไป" },
      { id: 2, name: "บริการภายใน" },
      { id: 3, name: "บริการภายนอก" },
      { id: 4, name: "ระบบสารสนเทศ" }
    ],
    apps: [
      {
        id: 1,
        name: "ระบบสารบรรณอิเล็กทรอนิกส์",
        description: "จัดการเอกสารและหนังสือเวียนราชการ",
        url: "https://www.google.com",
        icon: "",
        sort_order: 1,
        open_mode: "new_tab",
        category: "บริการภายใน",
        is_favorite: 1
      },
      {
        id: 2,
        name: "ระบบลาออนไลน์",
        description: "ยื่นใบลาและตรวจสอบวันลาคงเหลือ",
        url: "https://www.google.com",
        icon: "",
        sort_order: 2,
        open_mode: "new_tab",
        category: "บริการภายใน",
        is_favorite: 1
      },
      {
        id: 3,
        name: "ระบบจองห้องประชุม",
        description: "ตรวจสอบตารางและจองห้องประชุมออนไลน์",
        url: "https://www.google.com",
        icon: "",
        sort_order: 3,
        open_mode: "new_tab",
        category: "บริการภายใน",
        is_favorite: 0
      },
      {
        id: 4,
        name: "เว็บไซต์หลักหน่วยงาน",
        description: "ข่าวสารและข้อมูลองค์กร",
        url: "https://www.google.com",
        icon: "",
        sort_order: 4,
        open_mode: "new_tab",
        category: "ทั่วไป",
        is_favorite: 1
      },
      {
        id: 5,
        name: "ระบบแจ้งซ่อมไอที",
        description: "แจ้งปัญหาอุปกรณ์และระบบเครือข่าย",
        url: "https://www.google.com",
        icon: "",
        sort_order: 5,
        open_mode: "new_tab",
        category: "ระบบสารสนเทศ",
        is_favorite: 0
      },
      {
        id: 6,
        name: "บริการประชาชน e-Service",
        description: "ช่องทางยื่นคำร้องออนไลน์สำหรับประชาชน",
        url: "https://www.google.com",
        icon: "",
        sort_order: 6,
        open_mode: "new_tab",
        category: "บริการภายนอก",
        is_favorite: 1
      }
    ],
    news: [
      {
        id: 1,
        title: "เปิดใช้งานศูนย์รวมบริการดิจิทัลโฉมใหม่",
        content: "ระบบให้บริการบุคลากรและประชาชนรูปแบบใหม่ เชื่อมต่อฐานข้อมูล Google Sheets และ Google Drive รวดเร็ว เสถียร เข้าถึงได้ตลอด 24 ชั่วโมง",
        image: "",
        sort_order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "แนะนำการติดตั้งแอปบนหน้าจอหลัก (PWA)",
        content: "เพิ่มทางลัดลงบนหน้าจอมือถือหรือเดสก์ท็อปของคุณ เพื่อการเข้าถึงบริการทั้งหมดได้อย่างสะดวกรวดเร็วเสมือนแอปพลิเคชันจริง",
        image: "",
        sort_order: 2,
        created_at: new Date().toISOString()
      }
    ],
    calendar: [
      {
        id: 1,
        event_title: "ประชุมคณะกรรมการประจำเดือน",
        event_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        event_time: "09:30 - 12:00 น.",
        description: "ประชุมติดตามผลการดำเนินงาน ณ ห้องประชุมใหญ่ และออนไลน์ผ่านระบบ Zoom"
      },
      {
        id: 2,
        event_title: "วันหยุดราชการประจำเดือน",
        event_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        event_time: "ตลอดวัน",
        description: "ปิดทำการ 1 วัน ติดต่อเรื่องเร่งด่วนผ่านช่องทางออนไลน์"
      },
      {
        id: 3,
        event_title: "กำหนดส่งรายงานผลการปฏิบัติงาน",
        event_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        event_time: "ก่อน 16:30 น.",
        description: "ส่งแบบรายงานผลการปฏิบัติราชการประจำไตรมาสผ่านระบบสารบรรณ"
      }
    ]
  }
};
