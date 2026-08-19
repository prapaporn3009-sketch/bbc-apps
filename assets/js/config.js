/**
 * ============================================================================
 * APP PORTAL - CONFIGURATION FILE (config.js)
 * ============================================================================
 * กำหนดค่าการเชื่อมต่อ Google Apps Script (GAS) Web App URL และค่าเริ่มต้นของระบบ
 */

const CONFIG = {
  // วาง URL ของ Google Apps Script Web App ที่ได้จากการ Deploy ที่นี่
  // ตัวอย่าง: "https://script.google.com/macros/s/AKfyxxxxxxxxxxxxxxxxxxxxxxPKsE/exec"
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbyF5ZSGwXrbmus7BboNUtm-FuhjMG99GHVmlg2F66w2Nk4r-sK8LSML36pm04BPPKsE/exec",

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

  
