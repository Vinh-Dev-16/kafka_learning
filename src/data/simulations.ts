import type { SimulationDefinition } from '../types';

export const simulations: Record<string, SimulationDefinition> = {
  lifecycle: {
    id: 'lifecycle',
    title: 'Từ produce đến xử lý',
    subtitle: 'Lifecycle của một record trên một partition',
    nodes: [
      { id: 'producer', label: 'Producer', kind: 'client' },
      { id: 'leader', label: 'Broker · leader', kind: 'broker' },
      { id: 'topic', label: 'Topic partition', kind: 'topic' },
      { id: 'consumer', label: 'Consumer group', kind: 'client' },
      { id: 'database', label: 'Database', kind: 'database' },
    ],
    edges: [
      { from: 'producer', to: 'leader' },
      { from: 'leader', to: 'topic' },
      { from: 'topic', to: 'consumer' },
      { from: 'consumer', to: 'database' },
    ],
    steps: [
      { title: '1 · Tạo record', description: 'Ứng dụng serialize key và value rồi chọn partition. Mô hình giả định key đưa event đến partition 2.', event: 'OrderPaid · key=order-42', activeNodes: ['producer'], metrics: [{ label: 'Partition', value: '2' }, { label: 'Offset', value: 'chưa cấp' }], facts: ['Payload được serialize ở client.', 'Kafka chưa biết logic nghiệp vụ của event.'] },
      { title: '2 · Gửi đến leader', description: 'Metadata cho producer biết broker leader của partition đích; producer gửi request chứa batch.', event: 'ProduceRequest → broker-1', activeNodes: ['producer', 'leader'], metrics: [{ label: 'Partition', value: '2' }, { label: 'Request', value: 'đang gửi', tone: 'warn' }], facts: ['Producer gửi theo partition leader.', 'Lỗi mạng ở đây chưa nói chắc broker đã ghi hay chưa.'] },
      { title: '3 · Append vào log', description: 'Leader append record và gán offset tiếp theo của partition. Offset 184 là tọa độ cục bộ của partition 2.', event: 'append · partition 2 · offset 184', activeNodes: ['leader', 'topic'], metrics: [{ label: 'Partition', value: '2' }, { label: 'Offset', value: '184' }], facts: ['Log được append theo thứ tự.', 'Offset không tạo thứ tự giữa partition 2 và partition khác.'] },
      { title: '4 · Replica xác nhận', description: 'Leader chờ theo cấu hình acks. Với acks=all, ACK set là ISR hiện tại; min.insync.replicas đặt ngưỡng chấp nhận ghi.', event: 'ACK: leader + 1 ISR replica', activeNodes: ['leader', 'topic'], metrics: [{ label: 'Acks', value: 'all' }, { label: 'ISR', value: '2 / 3', tone: 'good' }], facts: ['Mô hình giả định ISR có hai replica.', 'acks=all không mặc định nghĩa là mọi replica cấu hình.'] },
      { title: '5 · Consumer fetch', description: 'Consumer group fetch từ committed position. Record có thể được trả cho ứng dụng trước khi nó commit offset.', event: 'Fetch · offset 184', activeNodes: ['topic', 'consumer'], metrics: [{ label: 'Position', value: '184' }, { label: 'Committed', value: '184', tone: 'warn' }], facts: ['Fetch position và committed offset khác nhau.', 'Crash trước commit có thể dẫn đến đọc lại.'] },
      { title: '6 · Side effect và commit', description: 'Ứng dụng ghi database rồi commit offset kế tiếp. Crash sau DB commit nhưng trước offset commit có thể tạo lần xử lý lặp.', event: 'DB commit → offset 185', activeNodes: ['consumer', 'database', 'topic'], metrics: [{ label: 'DB write', value: 'xong', tone: 'good' }, { label: 'Committed', value: '185', tone: 'good' }], facts: ['Kafka không tự atomic với database ngoài.', 'Idempotency ở DB giúp xử lý an toàn khi event được đọc lại.'] },
    ],
  },
  'consumer-group': {
    id: 'consumer-group',
    title: 'Assignment và rebalance',
    subtitle: 'Một member rời group trong lúc có lag',
    nodes: [
      { id: 'member-a', label: 'Member A', kind: 'client' },
      { id: 'member-b', label: 'Member B', kind: 'client' },
      { id: 'coordinator', label: 'Group coordinator', kind: 'broker' },
      { id: 'partition', label: 'orders · P0 / P1', kind: 'topic' },
      { id: 'store', label: '__consumer_offsets', kind: 'topic' },
    ],
    edges: [
      { from: 'coordinator', to: 'member-a' },
      { from: 'coordinator', to: 'member-b' },
      { from: 'member-a', to: 'partition' },
      { from: 'member-b', to: 'partition' },
      { from: 'coordinator', to: 'store' },
    ],
    steps: [
      { title: '1 · Assignment ổn định', description: 'Hai member chia bốn partition. Mỗi partition chỉ được gán cho một member trong group ở trạng thái này.', event: 'A: P0,P1 · B: P2,P3', activeNodes: ['member-a', 'member-b', 'partition'], metrics: [{ label: 'Members', value: '2' }, { label: 'Partitions', value: '4' }], facts: ['Assignment phụ thuộc assignor.', 'Group khác vẫn có thể đọc các partition này.'] },
      { title: '2 · Member A ngừng heartbeat', description: 'Coordinator không còn nhận tín hiệu member A theo điều kiện group protocol, nên bắt đầu đổi membership.', event: 'member-a → timeout', activeNodes: ['member-a', 'coordinator'], metrics: [{ label: 'Group state', value: 'preparing rebalance', tone: 'warn' }, { label: 'Lag P0', value: '120' }], facts: ['Timeout không đồng nghĩa record mất.', 'Thời gian phát hiện phụ thuộc protocol và cấu hình.'] },
      { title: '3 · Thu hồi partition', description: 'Assignment cũ được dừng hoặc thu hồi theo protocol. Consumer có thể cần hoàn tất revoke callback và commit offset.', event: 'revoke P0, P1', activeNodes: ['member-b', 'coordinator', 'partition', 'store'], metrics: [{ label: 'Assigned', value: 'đang đổi', tone: 'warn' }, { label: 'Committed P0', value: '410' }], facts: ['Record đang xử lý có thể cần replay.', 'Commit trong revoke callback chỉ thành công khi member còn quyền commit hợp lệ.'] },
      { title: '4 · Tính assignment mới', description: 'Coordinator/assignor phân lại partition cho member còn hoạt động. Ở ví dụ này B nhận cả bốn partition.', event: 'B ← P0,P1,P2,P3', activeNodes: ['member-b', 'coordinator', 'partition'], metrics: [{ label: 'Members', value: '1' }, { label: 'Partitions per member', value: '4', tone: 'warn' }], facts: ['Parallelism giảm khi member rời group.', 'Nếu số consumer vượt partition, consumer dư có thể không nhận partition.'] },
      { title: '5 · Đọc từ committed offset', description: 'B bắt đầu lại từ offset đã commit của mỗi partition. Các record xử lý xong nhưng chưa commit có thể xuất hiện lại.', event: 'P0 resumes at offset 410', activeNodes: ['member-b', 'partition', 'store'], metrics: [{ label: 'Start offset', value: '410' }, { label: 'Possible replay', value: 'yes', tone: 'warn' }], facts: ['Offset commit là checkpoint group.', 'Side effect cần idempotent để chịu replay.'] },
      { title: '6 · Group ổn định lại', description: 'Member B xử lý backlog; sau khi member A hồi phục, group có thể rebalance lần nữa để chia tải.', event: 'assignment stable · lag drains', activeNodes: ['member-a', 'member-b', 'partition'], metrics: [{ label: 'Group state', value: 'stable', tone: 'good' }, { label: 'Lag', value: 'đang giảm', tone: 'good' }], facts: ['Theo dõi rebalance rate cùng lag.', 'Mô hình bỏ qua chi tiết protocol và cooperative assignment.'] },
    ],
  },
  replication: {
    id: 'replication',
    title: 'Replication, ISR và failover',
    subtitle: 'Broker leader lỗi khi producer đang ghi',
    nodes: [
      { id: 'producer', label: 'Producer', kind: 'client' },
      { id: 'broker-a', label: 'Broker A · leader', kind: 'broker' },
      { id: 'broker-b', label: 'Broker B · follower', kind: 'broker' },
      { id: 'broker-c', label: 'Broker C · follower', kind: 'broker' },
      { id: 'partition', label: 'events · P2', kind: 'topic' },
    ],
    edges: [
      { from: 'producer', to: 'broker-a' },
      { from: 'broker-a', to: 'partition' },
      { from: 'broker-b', to: 'partition' },
      { from: 'broker-a', to: 'broker-b' },
      { from: 'broker-a', to: 'broker-c' },
    ],
    steps: [
      { title: '1 · Replica khỏe', description: 'Partition có replication factor 3. Leader A và follower B nằm trong ISR; follower C đang chậm nên ngoài ISR.', event: 'ISR = {A, B}', activeNodes: ['broker-a', 'broker-b', 'broker-c', 'partition'], metrics: [{ label: 'RF', value: '3' }, { label: 'ISR', value: '2 / 3', tone: 'warn' }], facts: ['ISR có thể thay đổi theo trạng thái replica.', 'Replica ngoài ISR vẫn được cấu hình nhưng chưa theo kịp.'] },
      { title: '2 · Producer gửi với acks=all', description: 'Producer gửi batch đến leader A. ACK phải đáp ứng ISR hiện tại và min.insync.replicas.', event: 'ProduceRequest → A', activeNodes: ['producer', 'broker-a', 'partition'], metrics: [{ label: 'acks', value: 'all' }, { label: 'min ISR', value: '2' }], facts: ['acks=all chờ toàn bộ ISR hiện tại.', 'Ngưỡng min ISR không yêu cầu mọi replica ngoài ISR.'] },
      { title: '3 · Append và replicate', description: 'A append record; B fetch và append bản sao. Khi cả A và B xác nhận, điều kiện min ISR=2 được đáp ứng.', event: 'append → replicate → ACK', activeNodes: ['producer', 'broker-a', 'broker-b', 'partition'], metrics: [{ label: 'ISR ACK', value: '2 / 2', tone: 'good' }, { label: 'Write', value: 'accepted', tone: 'good' }], facts: ['Ví dụ giả định B đã xác nhận.', 'C vẫn chưa thuộc ISR.'] },
      { title: '4 · Leader A gặp sự cố', description: 'Broker A mất kết nối sau khi record được xác nhận. Controller cập nhật metadata và chọn replica đủ điều kiện nếu có.', event: 'broker-a → unavailable', activeNodes: ['broker-a', 'broker-b', 'broker-c', 'partition'], metrics: [{ label: 'Leader', value: 'election pending', tone: 'warn' }, { label: 'Producer', value: 'refresh metadata', tone: 'warn' }], facts: ['Producer có thể tạm gặp lỗi retryable.', 'Unclean election có thể chọn replica ngoài ISR và tăng rủi ro mất record.'] },
      { title: '5 · B trở thành leader', description: 'Trong mô hình, controller bầu B trong ISR làm leader mới; C vẫn cần bắt kịp theo trạng thái mới.', event: 'leader: A → B', activeNodes: ['broker-b', 'broker-c', 'partition'], metrics: [{ label: 'Leader', value: 'B', tone: 'good' }, { label: 'ISR', value: 'B', tone: 'warn' }], facts: ['Failover phụ thuộc election policy và replica health.', 'Record đã ACK có mức bảo vệ khác record chưa được xác nhận.'] },
      { title: '6 · Metadata refresh và tiếp tục ghi', description: 'Producer cập nhật metadata rồi retry request theo chính sách. Nếu ISR thấp hơn min ISR, acks=all có thể bị từ chối.', event: 'retry → new leader B', activeNodes: ['producer', 'broker-b', 'partition'], metrics: [{ label: 'Metadata', value: 'refreshed', tone: 'good' }, { label: 'Write availability', value: 'depends on ISR', tone: 'warn' }], facts: ['Availability phụ thuộc số ISR còn sống và min ISR.', 'Đây là minh họa, không mô phỏng đầy đủ protocol controller.'] },
    ],
  },
};
