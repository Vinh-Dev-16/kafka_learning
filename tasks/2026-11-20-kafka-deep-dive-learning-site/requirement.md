# Yêu cầu
11 chương, 61 bài: giữ 55 bài đã cung cấp, bổ sung 6 bài. Không thu hẹp thành 15 bài. Mỗi bài có khái niệm, cơ chế, áp dụng, giới hạn/rủi ro, ví dụ, điểm nhớ, câu hỏi thực tế và tự kiểm tra kèm đáp án; nội dung độc lập, offline, không sinh từ tiêu đề. KidsOnline chỉ là tình huống giả định.

Giao diện Học/Luyện tập/Phòng thiết kế/Tóm tắt, chương trái, học và mô phỏng giữa, ghi chú riêng phải, timeline/tiến độ dưới. Dark, lưới isometric, viền kem, accent xanh/vàng/tím, dễ đọc, responsive. localStorage cho tiến độ, ghi chú, thiết kế. Phòng thiết kế kéo thả và nối Producer/Broker/Topic/Consumer/Database; quiz có đáp án. Sandbox mô phỏng gửi event, đổi partition/consumer, crash broker/consumer, DB chậm; hiển thị offset, lag, ISR, throughput và event log dưới dạng mô hình.

Ba mô phỏng SVG chuyên sâu với node, đường nối, packet chuyển động, trạng thái và điều khiển từng bước: lifecycle produce/consume; group/assignment/commit/rebalance; replication/ISR/acks khi broker lỗi. Các bài còn lại đủ học liệu; không cam kết mô phỏng riêng cho từng bài.

React + TypeScript + Vite, Docker multi-stage/Nginx/Compose và hai launcher; Docker chỉ phục vụ web. Không backend, DB, auth, analytics, dịch vụ ngoài hay Kafka cluster. Không thêm/chạy unit test.
# Catalog

## 1. Nền tảng Kafka
1. Kafka là gì? Vì sao không chỉ là Message Queue?
2. Producer → Broker → Consumer
3. Topic và Event
4. Partition và Offset
5. Consumer Group: nhiều service cùng đọc một event
6. Ordering trong partition

## 2. Dữ liệu được lưu thế nào?
1. Hành trình message từ Producer vào Kafka
2. Append-only Log
3. Log Segment và Offset
4. Retention
5. Log Compaction và Tombstone

## 3. Kafka Producer
1. Record: Key, Value, Headers
2. Partition Key và Ordering
3. acks=0, acks=1, acks=all
4. Retry và Idempotent Producer
5. Batching, Compression và Throughput
6. Delivery timeout và lỗi producer

## 4. Kafka Consumer
1. Consumer Poll và Fetch Message
2. Consumer Group và Partition Assignment
3. Auto Commit vs Manual Commit
4. Consumer Rebalance
5. Consumer Lag và cách đo
6. Offset ban đầu và auto.offset.reset

## 5. Replication & High Availability
1. Replication Factor
2. Leader và Follower
3. ISR — In-Sync Replicas
4. min.insync.replicas và acks=all
5. Broker Crash và Leader Failover

## 6. Đảm bảo dữ liệu & tính nhất quán
1. At-most-once vs At-least-once
2. Crash trước/sau Offset Commit
3. Idempotency khi ghi Database
4. Exactly-once và Kafka Transactions
5. Transactional Outbox: DB + Kafka
6. Ordering, duplicate và event đến trễ

## 7. Retry & Failure Recovery
1. Transient Error vs Permanent Error
2. Retry và Exponential Backoff
3. Retry Topic và Dead Letter Topic
4. Poison Message làm nghẽn Partition
5. Replay Event và Reset Offset

## 8. Scaling & Performance
1. Partition và giới hạn Consumer Parallelism
2. Hot Key và Hot Partition
3. Backpressure: Consumer xử lý không kịp
4. Tuning Batch Size, Linger và Fetch
5. Load Test: hàng nghìn event mỗi giây

## 9. Kafka Ecosystem
1. Kafka Connect: Source và Sink
2. Debezium: CDC từ MySQL/PostgreSQL
3. Schema Registry và Schema Evolution
4. Kafka Streams: Window, Join, Aggregation
5. Event-driven Architecture và Saga

## 10. Kafka Production
1. KRaft Controller và Cluster Metadata
2. Monitoring: Lag, ISR, Broker Health
3. Capacity Planning: Disk, Network, Partitions
4. Rolling Deployment và Consumer Rebalance
5. Security, Disaster Recovery và Incident Handling
6. Quota và cách ly client

## 11. System Design thực chiến
1. Chuyển năm học: một event đến 10 microservices
2. Thanh toán: Eventual Consistency và Idempotency
3. Notification: API bên thứ ba sập
4. Analytics: Replay 30 ngày dữ liệu
5. Thiết kế hệ thống Kafka chịu tải lớn
6. Hợp đồng event và chiến lược nâng phiên bản
