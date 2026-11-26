# 👑 RELEASE NOTES — Vua Chính Tả (`LIVE-CHINHTA-TIKTOK` v1.0.0)

<div align="center">
  <img src="./docs/media/vuachinhta_brand_banner.png" alt="Vua Chính Tả Brand Banner" width="100%" />
  <br /><br />
  <a href="./Record_2026-vua-chinh-ta.mp4">
    <img src="./docs/media/vuachinhta_demo_preview.gif" alt="Video Demo Thực Tế Vua Chính Tả TikTok LIVE" width="320" />
  </a>
</div>

> **Tác giả / Author:** **Duong Birken** — [https://duongbirken.deta.vn](https://duongbirken.deta.vn)  
> **Kho mã nguồn / Repository:** [https://github.com/duongbirken2510/LIVE-CHINHTA-TIKTOK](https://github.com/duongbirken2510/LIVE-CHINHTA-TIKTOK)  
> **Video Demo Phiên LIVE Thực Tế:** [`Record_2026-vua-chinh-ta.mp4`](./Record_2026-vua-chinh-ta.mp4)  
> **Cổng mặc định / Default Port:** `http://localhost:4016` (Admin) · `http://lvh.me:4016/?view=stage` (TikTok LIVE Studio `1080 × 1920`)

---

## 🇻🇳 Điểm Mới Nổi Bật (v1.0.0)
1. **Cơ chế Gameplay theo vòng (`Vòng 1 & 3 Gõ 1/2 · Vòng 2 & 4 Gõ A/B`) & Luật "Bút Sa Gà Chết" (`ChinhTaEngine`):**
   - Khóa chặt lựa chọn đầu tiên của mỗi người chơi (`lockedChoices`), chống spam cả 2 đáp án (`kind: 'locked_wrong'`).
   - Học Giả MC tự động giới thiệu luật chơi ở đầu mỗi vòng và tại màn hình chuyển vòng.
2. **Mở Đáp Án Siêu Tốc `4 Giây` Đồng Bộ Cả 4 Vòng & 16 Lời Khen Xoay Vòng:**
   - Bỏ hoàn toàn phần đọc giải thích từ điển lê thê; MC chỉ đọc đúng 1 câu chốt kết quả ngắn gọn trong `3.5 – 4 giây`.
   - Vòng 3 và Vòng 4 hiển thị thêm 1 thanh ngang 1 dòng đối chiếu từ đúng hoặc *Từ Thuần Việt · Từ Hán Việt*.
   - Xoay vòng 16 mẫu lời khen người mở hàng + 4 mẫu lời khen chuỗi 3 câu đúng (`+100đ`).
3. **Kho Đề Khủng 1.550 Câu Hỏi Độc Nhất & Vòng 4 Phân Tích Từ Thuần Việt – Hán Việt `×2`:**
   - **Vòng 1 (`420 câu`):** Phụ âm đầu dễ nhầm (`S/X, Ch/Tr, D/Gi/R, L/N, G/Gh, Ng/Ngh, V/D` · Trống Đồng Đông Sơn).
   - **Vòng 2 (`450 câu`):** Dấu Hỏi/Ngã & Vần cuối (`?/~, c/t, n/ng, i/y, ao/au, ai/ay, iu/iêu, uôn/uân` · Đêm Rằm Chị Hằng).
   - **Vòng 3 (`360 câu`):** Bắt lỗi chính tả trong câu văn (`[1] ĐÚNG CHÍNH TẢ` vs `[2] SAI CHÍNH TẢ` · Khuê Văn Các).
   - **Vòng 4 (`320 câu · ×2 Điểm`):** Phân tích nguồn gốc **Từ Thuần Việt & Từ Hán Việt** (`160 câu Dạng 4A` + `160 câu Dạng 4B` · Ngọ Môn Kinh Thành Huế).
4. **Miễn Trừ 5 Giây Đầu Bù Trễ OBS (`buTreObsMs: 5000`), Atomic WAV Header Patching & `Voice-Sync Hold`.**
5. **Bản Ghi Video Phiên LIVE Thực Tế (`Record_2026-vua-chinh-ta.mp4`) & Bộ Cài Windows 1-Click (`Vua-Chinh-Ta-Setup-v1.0.exe`).**

---

## 🇬🇧 Release Highlights (v1.0.0)
- **Per-Round 1-Tap Choice Engine (`1/2` for Rounds 1 & 3 · `A/B` for Rounds 2 & 4)** with **"Bút Sa Gà Chết" First-Choice Lock** and fast **`4-second` answer reveals**.
- **1,550 Unique Vietnamese Orthography & Etymology Questions** across 4 heritage-themed rounds, including a 320-question **Native Vietnamese vs. Sino-Vietnamese Analysis Round (`×2` Points)**.
- **5-Second OBS Stream Latency Grace Window** + **Atomic WAV Header Patching & Blob Audio Playback** + **16 Rotating Scholarly Praises**.

---

## 👨‍💻 Tác Giả & Liên Hệ / Author & Contact

| 🇻🇳 Lời nhắn từ Tác giả | 🇬🇧 Note from the Author |
| :--- | :--- |
| **Vua Chính Tả (`LIVE-CHINHTA-TIKTOK`)** được phát triển bởi **Duong Birken**. Hãy tặng 1 **⭐ Star** trên GitHub hoặc ghé thăm [https://duongbirken.deta.vn](https://duongbirken.deta.vn) để kết nối nhé! | **Vua Chính Tả (`LIVE-CHINHTA-TIKTOK`)** is created by **Duong Birken**. Give it a **⭐ Star** on GitHub or visit [https://duongbirken.deta.vn](https://duongbirken.deta.vn)! |
