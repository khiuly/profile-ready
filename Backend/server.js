import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fetch, { FormData, File } from "node-fetch";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

if (!REMOVE_BG_API_KEY) {
  console.warn(
    "WARNING: REMOVE_BG_API_KEY is not set. /api/remove-bg จะใช้ไม่ได้จนกว่าจะตั้งค่าใน .env"
  );
}

// CORS เผื่อเรียกจาก Live Server (พอร์ต 5500) มาหา backend (พอร์ต 3000)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// helper แปลง buffer → data URL
function bufferToDataUrl(buffer, mimeType) {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

app.get("/", (req, res) => {
  res.send("Profile Ready backend with remove.bg is running");
});

// ===== endpoint ลบพื้นหลังด้วย remove.bg =====
app.post("/api/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์ภาพก่อน" });
    }
    if (!REMOVE_BG_API_KEY) {
      return res
        .status(500)
        .json({ error: "missing REMOVE_BG_API_KEY on server" });
    }

    // สร้างไฟล์จาก buffer เพื่อส่งไปใน FormData
    const buffer = req.file.buffer;
    const mimeType = req.file.mimetype || "image/png";
    const filename = req.file.originalname || "upload.png";

    const file = new File([buffer], filename, { type: mimeType });

    const formData = new FormData();
    formData.append("image_file", file);
    formData.append("size", "auto"); // ให้ remove.bg เลือกขนาดที่เหมาะสม

    const apiRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("remove.bg error:", apiRes.status, errText);
      return res
        .status(500)
        .json({ error: "ลบพื้นหลังไม่สำเร็จ", detail: errText });
    }

    // ได้เป็น binary PNG กลับมา
    const arrayBuffer = await apiRes.arrayBuffer();
    const bufferOut = Buffer.from(arrayBuffer);

    // เปลี่ยนเป็น data URL ส่งกลับไปให้ frontend
    const dataUrl = bufferToDataUrl(bufferOut, "image/png");

    // ให้ฟรอนต์ใช้ key ชื่อ output เหมือนเดิม
    return res.json({ output: dataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend with remove.bg listening on port", PORT);
});
