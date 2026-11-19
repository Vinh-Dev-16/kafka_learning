# Kế hoạch sau duyệt

Người dùng đã duyệt kế hoạch và cho phép triển khai trong scope đã ghi. Không yêu cầu phê duyệt lại hoặc cấp quyền riêng cho profile `scoped-coder`. Các bước và tiêu chí bên dưới giữ nguyên.
1. Kiểm tra lại scope, môi trường, Redis và thử REA thụ động nếu có endpoint. Đối chiếu Kafka với tài liệu chính thức hiện hành.
2. Tạo nền Vite và catalog typed; viết và rà từng bài độc lập, đủ trường và ví dụ, không sinh nội dung từ tiêu đề.
3. Dựng shell responsive, ghi chú/tiến độ localStorage, luyện tập, tóm tắt và phòng thiết kế.
4. Xây ba state machine SVG, timeline và sandbox; mô phỏng chỉ minh họa, không đo hệ thống thật.
5. Đóng gói Docker multi-stage, Nginx, Compose, launcher và README; bind loopback và đặt project name riêng.
6. Rà 61 bài và scope; chạy npm run build, docker compose config, build/chạy container và kiểm tra HTTP. REA/UI desktop và hẹp nếu môi trường cho phép; người dùng đã cho phép thao tác trình duyệt. Không unit test.
7. Ghi kết quả thực, cảnh báo, hạn chế và rủi ro vào task pack; dừng container kiểm tra do task tạo.

Rủi ro: khối lượng 61 bài cần rà kỹ; mô hình có giả định; localStorage không đồng bộ; lần đầu dựng có thể cần mạng tải dependency/image. Không suy đoán nghiệp vụ KidsOnline thật.
