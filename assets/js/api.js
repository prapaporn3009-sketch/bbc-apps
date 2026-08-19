/**
 * ============================================================================
 * APP PORTAL - API CLIENT SERVICE (api.js)
 * ============================================================================
 * เชื่อมต่อกับ Google Apps Script Web App API ผ่าน HTTP GET และ POST
 * รองรับการ Cache ข้อมูล, การจัดการออฟไลน์ และแปลงไฟล์รูปภาพเป็น Base64
 */

const API = {
  // ฟังก์ชันส่งคำขอ GET ไปยัง Google Apps Script
  async get(action, params = {}) {
    const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.getApiUrl() : (localStorage.getItem("app_portal_gas_url") || "");
    if (!apiUrl) {
      console.warn("⚠️ ยังไม่ได้กำหนด Google Apps Script API URL, ใช้งานข้อมูลจำลอง (Fallback)");
      return null;
    }

    const queryParams = new URLSearchParams({ action, ...params });
    const fullUrl = `${apiUrl}?${queryParams.toString()}`;

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        redirect: "follow"
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API GET [${action}] Error:`, error);
      throw error;
    }
  },

  // ฟังก์ชันส่งคำขอ POST ไปยัง Google Apps Script
  async post(action, payload = {}) {
    const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.getApiUrl() : (localStorage.getItem("app_portal_gas_url") || "");
    if (!apiUrl) {
      throw new Error("กรุณาตั้งค่า Google Apps Script API URL ก่อนทำรายการ");
    }

    // แนบข้อมูลผู้ดูแลระบบที่ล็อกอินอยู่ (ถ้ามี) สำหรับการบันทึก Log
    const currentUser = this.getCurrentUser();
    const bodyData = {
      action,
      admin_username: currentUser ? currentUser.username : "anonymous",
      ...payload
    };

    try {
      // ส่งด้วย Content-Type text/plain เพื่อป้องกันปัญหา CORS Preflight ใน Web App ของ GAS
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(bodyData),
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`HTTP POST Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result && result.status === 'error') {
        throw new Error(result.message || "เกิดข้อผิดพลาดในการทำรายการ");
      }
      return result;
    } catch (error) {
      console.error(`API POST [${action}] Error:`, error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // PUBLIC DATA FETCHING
  // --------------------------------------------------------------------------

  // ดึงข้อมูลทั้งหมดในครั้งเดียวสำหรับหน้าหลัก (Settings, Apps, Categories, News, Calendar)
  async getInitialData(forceRefresh = false) {
    // ตรวจสอบ Cache ใน LocalStorage ก่อนถ้าไม่ใช่การรีเฟรชบังคับ
    if (!forceRefresh) {
      const cached = localStorage.getItem("app_portal_cache_initial");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // หากแคชยังไม่หมดอายุ (เช่น ไม่เกิน 5 นาที) หรือเป็นกรณีออฟไลน์
          if (parsed && parsed.data) {
            // ดึงข้อมูลใหม่เบื้องหลัง (Background refresh)
            this.fetchInitialDataBackground();
            return parsed.data;
          }
        } catch (e) {}
      }
    }

    try {
      const res = await this.get("getInitialData");
      if (res && res.status === "success" && res.data) {
        localStorage.setItem("app_portal_cache_initial", JSON.stringify({
          time: Date.now(),
          data: res.data
        }));
        return res.data;
      }
    } catch (err) {
      console.warn("ไม่สามารถติดต่อ API ได้ ใช้ข้อมูลจาก Cache หรือ Default:", err);
    }

    // หากติดต่อ API ไม่ได้ ให้ใช้ Cache ล่าสุด (ถ้ามี)
    const cached = localStorage.getItem("app_portal_cache_initial");
    if (cached) {
      try {
        return JSON.parse(cached).data;
      } catch (e) {}
    }

    return {
      settings: {},
      categories: [],
      apps: [],
      news: [],
      calendar: []
    };
  },

  async fetchInitialDataBackground() {
    try {
      const res = await this.get("getInitialData");
      if (res && res.status === "success" && res.data) {
        localStorage.setItem("app_portal_cache_initial", JSON.stringify({
          time: Date.now(),
          data: res.data
        }));
      }
    } catch (e) {}
  },

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // --------------------------------------------------------------------------

  async login(username, password) {
    const res = await this.post("login", { username, password });
    if (res && res.status === "success" && res.token) {
      localStorage.setItem("admin_auth_token", res.token);
      localStorage.setItem("admin_auth_user", JSON.stringify(res.user));
      return res;
    } else {
      throw new Error(res.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    }
  },

  logout() {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("admin_auth_user");
  },

  isLoggedIn() {
    return !!localStorage.getItem("admin_auth_token");
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem("admin_auth_user");
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // APPS CRUD
  // --------------------------------------------------------------------------

  async saveApp(appData, imageFile = null) {
    let payload = { data: appData };
    if (imageFile) {
      const fileData = await this.fileToBase64(imageFile);
      payload.imageBase64 = fileData.base64;
      payload.imageName = fileData.name;
      payload.imageMime = fileData.type;
    }
    const res = await this.post("saveApp", payload);
    // เคลียร์แคชหน้าแรกเพื่อให้ดึงข้อมูลใหม่
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  async deleteApp(appId) {
    const res = await this.post("deleteApp", { id: appId });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  // --------------------------------------------------------------------------
  // CATEGORIES CRUD
  // --------------------------------------------------------------------------

  async saveCategory(catData) {
    const res = await this.post("saveCategory", { data: catData });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  async deleteCategory(catId) {
    const res = await this.post("deleteCategory", { id: catId });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  // --------------------------------------------------------------------------
  // NEWS CRUD
  // --------------------------------------------------------------------------

  async saveNews(newsData, imageFile = null) {
    let payload = { data: newsData };
    if (imageFile) {
      const fileData = await this.fileToBase64(imageFile);
      payload.imageBase64 = fileData.base64;
      payload.imageName = fileData.name;
      payload.imageMime = fileData.type;
    }
    const res = await this.post("saveNews", payload);
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  async deleteNews(newsId) {
    const res = await this.post("deleteNews", { id: newsId });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  // --------------------------------------------------------------------------
  // CALENDAR CRUD
  // --------------------------------------------------------------------------

  async saveCalendar(calendarData) {
    const res = await this.post("saveCalendar", { data: calendarData });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  async deleteCalendar(eventId) {
    const res = await this.post("deleteCalendar", { id: eventId });
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  // --------------------------------------------------------------------------
  // SETTINGS MANAGEMENT
  // --------------------------------------------------------------------------

  async saveSettings(settingsData, files = {}) {
    let payload = { data: settingsData };
    if (files.icon) {
      const f = await this.fileToBase64(files.icon);
      payload.iconBase64 = f.base64;
      payload.iconName = f.name;
      payload.iconMime = f.type;
    }
    if (files.popup) {
      const f = await this.fileToBase64(files.popup);
      payload.popupBase64 = f.base64;
      payload.popupName = f.name;
      payload.popupMime = f.type;
    }
    if (files.banner) {
      const f = await this.fileToBase64(files.banner);
      payload.bannerBase64 = f.base64;
      payload.bannerName = f.name;
      payload.bannerMime = f.type;
    }
    const res = await this.post("saveSettings", payload);
    localStorage.removeItem("app_portal_cache_initial");
    return res;
  },

  // --------------------------------------------------------------------------
  // ADMINS & LOGS
  // --------------------------------------------------------------------------

  async getAdmins() {
    return await this.get("getAdmins");
  },

  async saveAdmin(adminData) {
    return await this.post("saveAdmin", { data: adminData });
  },

  async deleteAdmin(adminId) {
    return await this.post("deleteAdmin", { id: adminId });
  },

  async getLogs() {
    return await this.get("getLogs");
  },

  // --------------------------------------------------------------------------
  // UTILITY HELPERS
  // --------------------------------------------------------------------------

  // แปลง Browser File object เป็น Base64 string
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          base64: reader.result,
          name: file.name,
          type: file.type || "image/png"
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  // แสดง Toast Notification แจ้งเตือนบนหน้าจอ
  toast(message, type = "info", duration = 3500) {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 90%;
        width: 380px;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>',
      error: '<i class="fa-solid fa-circle-exclamation" style="color: #ef4444;"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i>',
      info: '<i class="fa-solid fa-circle-info" style="color: #3b82f6;"></i>'
    };

    toast.style.cssText = `
      background: #1e293b;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: auto;
      animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border-left: 4px solid ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#3b82f6"};
    `;

    toast.innerHTML = `
      <div style="font-size: 18px;">${icons[type] || icons.info}</div>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastOut 0.3s ease-forward";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // แสดง Loading Spinner Overlay
  showLoading(text = "กำลังประมวลผล...") {
    let loader = document.getElementById("globalApiLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "globalApiLoader";
      loader.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: white;
        font-family: 'Prompt', sans-serif;
      `;
      loader.innerHTML = `
        <div style="width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div id="globalApiLoaderText" style="font-size: 14px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${text}</div>
      `;
      document.body.appendChild(loader);
    } else {
      document.getElementById("globalApiLoaderText").innerText = text;
      loader.style.display = "flex";
    }
  },

  hideLoading() {
    const loader = document.getElementById("globalApiLoader");
    if (loader) {
      loader.style.display = "none";
    }
  },

  // --------------------------------------------------------------------------
  // THAI DATE & TIME FORMATTERS
  // --------------------------------------------------------------------------

  // ดึงปี พ.ศ. ปัจจุบัน หรือแปลงจากปี ค.ศ.
  formatThaiYear(year = null) {
    if (year !== null) {
      const y = parseInt(year, 10);
      return !isNaN(y) ? (y < 2400 ? y + 543 : y) : new Date().getFullYear() + 543;
    }
    return new Date().getFullYear() + 543;
  },

  // แปลงวันที่และเวลาเป็นรูปแบบไทย (พ.ศ.)
  formatThaiDate(dateInput, includeTime = false, isShortMonth = true) {
    if (!dateInput || dateInput === '-') return '-';

    let d;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      const str = String(dateInput).trim();
      if (!str || str === '-') return '-';

      // กรณี YYYY-MM-DD หรือ YYYY-MM-DD HH:mm:ss
      if (str.includes('-')) {
        const parts = str.split(' ');
        const dateParts = parts[0].split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          let hours = 0, minutes = 0, seconds = 0;
          if (parts[1] && parts[1].includes(':')) {
            const timeParts = parts[1].split(':');
            hours = parseInt(timeParts[0], 10) || 0;
            minutes = parseInt(timeParts[1], 10) || 0;
            seconds = parseInt(timeParts[2], 10) || 0;
          }
          d = new Date(year, month, day, hours, minutes, seconds);
        } else {
          d = new Date(str);
        }
      } else {
        d = new Date(str);
      }
    }

    if (isNaN(d.getTime())) return String(dateInput);

    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const day = d.getDate();
    const month = isShortMonth ? thaiMonthsShort[d.getMonth()] : thaiMonthsFull[d.getMonth()];
    const year = d.getFullYear() < 2400 ? d.getFullYear() + 543 : d.getFullYear();

    if (includeTime) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${hh}:${mm} น.`;
    }

    return `${day} ${month} ${year}`;
  },

  // แปลงเป็นวันที่พร้อมเวลาภาษาไทยแบบย่อ
  formatThaiDateTime(dateInput) {
    return this.formatThaiDate(dateInput, true, true);
  },

  // แปลงเป็นวันที่ภาษาไทยแบบเต็ม (เช่น 19 สิงหาคม 2569)
  formatThaiDateFull(dateInput, includeTime = false) {
    return this.formatThaiDate(dateInput, includeTime, false);
  }
};
