import type { Chapter, Lesson, SimulationId } from '../types';

type LessonSeed = [title: string, brief: string, duration?: number];

const simulationById: Record<string, SimulationId> = {
  'c01-l02': 'lifecycle',
  'c04-l04': 'consumer-group',
  'c05-l05': 'replication',
};

function makeChapter(
  number: number,
  name: string,
  subtitle: string,
  seeds: LessonSeed[],
): Chapter {
  const chapterId = `c${String(number).padStart(2, '0')}`;
  const lessons: Lesson[] = seeds.map<Lesson>(([title, brief, duration = 12], index) => {
    const lessonNumber = index + 1;
    const id = `${chapterId}-l${String(lessonNumber).padStart(2, '0')}`;
    return {
      id,
      chapterId,
      number: lessonNumber,
      title,
      brief,
      duration,
      level: number <= 2 ? 'Foundation' : number <= 7 ? 'Core' : 'Advanced',
      ...(simulationById[id] ? { simulation: simulationById[id] } : {}),
    };
  });

  return {
    id: chapterId,
    number: String(number).padStart(2, '0'),
    name,
    subtitle,
    lessons,
  };
}

export const chapters: Chapter[] = [
  makeChapter(1, 'Nền tảng Kafka', 'Mô hình log phân tán', [
    ['Kafka là gì? Vì sao không chỉ là Message Queue?', 'Kafka lưu event thành log có thể đọc lại, nên nhiều ứng dụng độc lập cùng khai thác một luồng dữ liệu.', 14],
    ['Producer → Broker → Consumer', 'Theo dấu một record từ lúc ứng dụng gửi đến khi consumer đọc nó từ partition.', 12],
    ['Topic và Event', 'Phân biệt tên luồng dữ liệu với từng sự kiện bất biến được ghi vào luồng đó.', 11],
    ['Partition và Offset', 'Hiểu đơn vị lưu trữ song song và vị trí của record trong một partition.', 13],
    ['Consumer Group: nhiều service cùng đọc một event', 'Tách fan-out theo group và chia tải giữa các thành viên trong cùng một group.', 14],
    ['Ordering trong partition', 'Xác định phạm vi thứ tự Kafka bảo đảm và nơi ứng dụng phải tự xử lý.', 12],
  ]),
  makeChapter(2, 'Dữ liệu được lưu thế nào?', 'Log, segment và retention', [
    ['Hành trình message từ Producer vào Kafka', 'Kết nối thao tác gửi với leader, bản sao và phản hồi mà producer nhận được.', 14],
    ['Append-only Log', 'Kafka ghi nối tiếp vào log partition; record cũ không bị sửa tại chỗ.', 11],
    ['Log Segment và Offset', 'Partition được chia thành các file segment, còn offset xác định vị trí logic của record.', 12],
    ['Retention', 'Dữ liệu bị dọn theo chính sách thời gian hoặc dung lượng ở cấp partition.', 13],
    ['Log Compaction và Tombstone', 'Giữ trạng thái mới nhất theo key và dùng tombstone để biểu diễn xóa có thời hạn.', 14],
  ]),
  makeChapter(3, 'Kafka Producer', 'Gửi record có độ tin cậy', [
    ['Record: Key, Value, Headers', 'Các trường của record mang dữ liệu, định tuyến và metadata do ứng dụng định nghĩa.', 11],
    ['Partition Key và Ordering', 'Key thường đưa record cùng thực thể về cùng partition để giữ thứ tự theo thực thể.', 13],
    ['acks=0, acks=1, acks=all', 'So sánh thời điểm producer coi request thành công với mức xác nhận từ replica.', 15],
    ['Retry và Idempotent Producer', 'Retry xử lý lỗi tạm thời; idempotence ngăn retry của một producer tạo bản ghi trùng trong log.', 14],
    ['Batching, Compression và Throughput', 'Gom record và nén batch để đổi chi phí mạng, CPU, độ trễ và thông lượng.', 13],
    ['Delivery timeout và lỗi producer', 'Phân biệt timeout tổng thể, timeout request và lỗi cần retry hay đưa ra ứng dụng.', 14],
  ]),
  makeChapter(4, 'Kafka Consumer', 'Đọc, xử lý và tiến offset', [
    ['Consumer Poll và Fetch Message', 'Consumer chủ động fetch theo vị trí đọc và xử lý record trong vòng lặp poll.', 12],
    ['Consumer Group và Partition Assignment', 'Coordinator phân partition cho thành viên; mỗi partition chỉ thuộc một thành viên trong group tại một thời điểm.', 14],
    ['Auto Commit vs Manual Commit', 'Offset commit là điểm tiếp tục đọc; vị trí commit quyết định cửa sổ mất hoặc lặp khi lỗi.', 15],
    ['Consumer Rebalance', 'Thành viên hoặc partition thay đổi khiến group phân công lại và có thể tạm dừng xử lý.', 15],
    ['Consumer Lag và cách đo', 'Lag là chênh lệch giữa vị trí consumer và vị trí cuối có thể đọc; cần diễn giải theo partition.', 12],
    ['Offset ban đầu và auto.offset.reset', 'Chính sách reset chỉ áp dụng khi không có offset hợp lệ trong các điều kiện tương ứng.', 13],
  ]),
  makeChapter(5, 'Replication & High Availability', 'Replica, ISR và failover', [
    ['Replication Factor', 'Số replica được cấu hình cho mỗi partition, ảnh hưởng dung lượng và khả năng chịu lỗi.', 12],
    ['Leader và Follower', 'Leader phục vụ đọc ghi partition; follower sao chép log để có thể tham gia failover.', 12],
    ['ISR — In-Sync Replicas', 'ISR là các replica còn theo kịp điều kiện đồng bộ của partition.', 13],
    ['min.insync.replicas và acks=all', 'Kết hợp điều kiện xác nhận từ producer với số replica tối thiểu để chấp nhận ghi.', 15],
    ['Broker Crash và Leader Failover', 'Khi leader mất, controller chọn replica đủ điều kiện; kết quả phụ thuộc chính sách và trạng thái replica.', 14],
  ]),
  makeChapter(6, 'Đảm bảo dữ liệu & tính nhất quán', 'Từ delivery đến nghiệp vụ', [
    ['At-most-once vs At-least-once', 'Vị trí commit so với xử lý tạo ra khác biệt giữa có thể mất và có thể lặp record.', 14],
    ['Crash trước/sau Offset Commit', 'Dựng lại timeline lỗi để dự đoán record sẽ bị bỏ qua hay xử lý lại.', 13],
    ['Idempotency khi ghi Database', 'Đặt khóa nghiệp vụ và ràng buộc duy nhất để lần xử lý lặp không nhân đôi hiệu ứng.', 15],
    ['Exactly-once và Kafka Transactions', 'Transactions phối hợp ghi Kafka và offset trong một phạm vi được Kafka quản lý.', 16],
    ['Transactional Outbox: DB + Kafka', 'Ghi thay đổi nghiệp vụ và outbox cùng transaction DB, rồi relay phát event theo cách có thể retry.', 15],
    ['Ordering, duplicate và event đến trễ', 'Thiết kế consumer theo key, version hoặc watermark khi thứ tự toàn cục không tồn tại.', 14],
  ]),
  makeChapter(7, 'Retry & Failure Recovery', 'Phục hồi mà không nghẽn luồng', [
    ['Transient Error vs Permanent Error', 'Tách lỗi có thể tự hết sau thời gian khỏi dữ liệu hoặc điều kiện cần can thiệp.', 11],
    ['Retry và Exponential Backoff', 'Tăng khoảng chờ có giới hạn và jitter để tránh dồn tải vào dịch vụ đang phục hồi.', 12],
    ['Retry Topic và Dead Letter Topic', 'Đưa lỗi sang luồng khác để tiếp tục xử lý partition chính và giữ dấu vết.', 14],
    ['Poison Message làm nghẽn Partition', 'Một record không xử lý được có thể chặn tiến độ tuần tự của partition nếu chiến lược lỗi không phù hợp.', 13],
    ['Replay Event và Reset Offset', 'Đọc lại dữ liệu cần kiểm soát phạm vi, hiệu ứng phụ và khả năng idempotent của consumer.', 14],
  ]),
  makeChapter(8, 'Scaling & Performance', 'Thông lượng, độ trễ và tải', [
    ['Partition và giới hạn Consumer Parallelism', 'Trong một group, số consumer đang xử lý song song bị giới hạn bởi số partition được gán.', 12],
    ['Hot Key và Hot Partition', 'Phân bố key lệch có thể tạo một partition quá tải dù tổng cluster còn tài nguyên.', 13],
    ['Backpressure: Consumer xử lý không kịp', 'Tốc độ đầu vào vượt khả năng xử lý làm lag tăng và có thể đẩy áp lực sang dependency.', 13],
    ['Tuning Batch Size, Linger và Fetch', 'Điều chỉnh batch và fetch bằng phép đo độ trễ, kích thước record và năng lực mạng.', 15],
    ['Load Test: hàng nghìn event mỗi giây', 'Xây kịch bản có tải ổn định, burst, key skew và failure để đọc đúng điểm nghẽn.', 14],
  ]),
  makeChapter(9, 'Kafka Ecosystem', 'Kết nối và xử lý stream', [
    ['Kafka Connect: Source và Sink', 'Connector chuyển dữ liệu giữa Kafka và hệ thống khác qua worker, task và cấu hình connector.', 13],
    ['Debezium: CDC từ MySQL/PostgreSQL', 'CDC phát thay đổi từ log giao dịch; schema, snapshot và quyền truy cập ảnh hưởng vận hành.', 14],
    ['Schema Registry và Schema Evolution', 'Schema có version giúp producer và consumer phối hợp thay đổi định dạng theo compatibility policy.', 14],
    ['Kafka Streams: Window, Join, Aggregation', 'Ứng dụng stream xử lý dữ liệu liên tục với state, thời gian sự kiện và window.', 15],
    ['Event-driven Architecture và Saga', 'Event kết nối các service độc lập; saga điều phối bước nghiệp vụ và hành động bù khi thất bại.', 15],
  ]),
  makeChapter(10, 'Kafka Production', 'Vận hành có quan sát', [
    ['KRaft Controller và Cluster Metadata', 'KRaft quản lý metadata cluster bằng quorum controller và metadata log.', 14],
    ['Monitoring: Lag, ISR, Broker Health', 'Kết hợp tín hiệu consumer, replica và broker để phân biệt backlog với mất khả năng phục vụ.', 14],
    ['Capacity Planning: Disk, Network, Partitions', 'Ước lượng retention, replication, lưu lượng và overhead trước khi cấp tài nguyên.', 15],
    ['Rolling Deployment và Consumer Rebalance', 'Triển khai tuần tự cần giới hạn thời gian dừng và kiểm soát tác động rebalance.', 13],
    ['Security, Disaster Recovery và Incident Handling', 'Bảo vệ listener, xác thực và quyền truy cập; sự cố cần runbook phục hồi đã diễn tập.', 16],
    ['Quota và cách ly client', 'Quota giới hạn tài nguyên theo client hoặc user để một workload không lấn át cluster.', 12],
  ]),
  makeChapter(11, 'System Design thực chiến', 'Áp dụng vào luồng nghiệp vụ', [
    ['Chuyển năm học: một event đến 10 microservices', 'Thiết kế topic, key, group và schema cho nhiều consumer độc lập cùng nhận một thay đổi.', 16],
    ['Thanh toán: Eventual Consistency và Idempotency', 'Xử lý retry giữa payment, ledger và notification mà không tính tiền hai lần.', 16],
    ['Notification: API bên thứ ba sập', 'Cách ly dependency chậm bằng retry có giới hạn, outbox và dead-letter workflow.', 15],
    ['Analytics: Replay 30 ngày dữ liệu', 'Chọn retention, consumer group mới và cách bảo vệ hệ thống downstream khi replay.', 15],
    ['Thiết kế hệ thống Kafka chịu tải lớn', 'Bắt đầu từ throughput, key distribution, partition count, replication và SLO.', 17],
    ['Hợp đồng event và chiến lược nâng phiên bản', 'Thay đổi schema theo compatibility, consumer rollout và thời gian hỗ trợ phiên bản cũ.', 15],
  ]),
];

export const lessons: Lesson[] = chapters.flatMap((chapter) => chapter.lessons);

export function getLesson(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}

export function getChapterForLesson(lesson: Lesson): Chapter {
  return chapters.find((chapter) => chapter.id === lesson.chapterId) ?? chapters[0];
}
