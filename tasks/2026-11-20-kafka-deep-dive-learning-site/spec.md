# Đặc tả
- ID bài ổn định, nội dung typed theo từng trường và quiz có đáp án; rà 61 ID và từng trường.
- Mô phỏng có state bước, node/edge, packet, failure, log; trước/sau/phát/dừng/reset; dừng khi đổi bài và hỗ trợ reduced motion.
- Lifecycle gồm metadata, phân partition, gửi, append, ack, fetch, xử lý; commit khác xử lý.
- Group có gán độc quyền trong group, offset tiếp theo, crash, rebalance và duplicate; nêu giả định protocol.
- Replication thể hiện leader/follower/ISR, min.insync.replicas và acks; acks=all không có nghĩa mọi replica; failover tùy cấu hình.
- Viewport hẹp mở/đóng panel, điều khiển có nhãn và keyboard; localStorage có version và fallback khi dữ liệu lỗi.
- README hướng dẫn cổng, launcher, offline và lỗi Docker. Stop chỉ tác động compose project website.
- Tiêu chí: đủ bài và nội dung; ba kịch bản và bốn chế độ dùng được; không cần mạng khi học sau build; build, compose, container/HTTP và UI được ghi nhận theo kết quả thực.

## Bản thiết kế giao diện chi tiết theo ảnh và DOM tham khảo
- Header cố định chiều cao gọn: logo Kafka Deep Dive bên trái, bốn mục ở giữa, tìm kiếm bài/khái niệm với Ctrl+K; trạng thái đang chọn có nền xanh olive.
- Desktop: sidebar chương có thể thu/mở và số bài hoàn thành; trung tâm là breadcrumb, tiêu đề, mô tả ngắn, badge thời lượng/cấp độ/số bước; bên phải là thẻ bước hiện tại, nội dung giải thích, ý chính, nút trước/tiếp và danh sách mục tiêu.
- Sân khấu có nền lưới isometric, thanh metric phía trên, nút phát lại/phát, chú giải màu phía dưới; SVG tự vẽ có chiều sâu, nhãn rõ, packet di chuyển trên connector. Timeline đánh số và tên bước nằm dưới sân khấu, chọn được bước; nêu trạng thái tại mỗi bước.
- Màu chủ đạo than tối, viền kem dịu, olive cho lựa chọn, vàng cho chú ý, tím cho ý chính; dùng font dễ đọc tiếng Việt, phân cấp chữ rõ ràng. Giữ nội dung và nhãn riêng của Kafka.
- Mỗi mô phỏng có dữ liệu bước và lời giải thích đồng bộ; nội dung bài giảng chi tiết truy cập ngay trong bài bên cạnh/tiếp sau mô phỏng, không hy sinh kiến thức để dành chỗ cho hình.
- Layout rộng ba cột; tablet thu gọn sidebar; điện thoại dùng panel mở/đóng và nội dung xếp dọc. Rà cả tràn chữ, thao tác bằng bàn phím và reduced motion.
- Phân biệt quan sát từ ảnh/DOM với đề xuất thiết kế; chưa xác minh hành vi tất cả nút của trang tham khảo.
