# Routing

## Route đã xác nhận
- Task type: `feature` — tạo website học Kafka mới, không phải bugfix/regression.
- Rigor: `R3` — feature nhiều phần, có requirement/spec/plan/tasks và cần lưu kết quả qua nhiều phiên.
- Workflow: `feature` + `hermes-codex-collaboration`, standard feature lane.
- Orchestration: `single-agent`, `max_parallel_subagents=0`; một pass review/verification sau implementation theo plan, không dùng multi-agent.
- Budget đề xuất cho execution brief implementation: tối đa 5 vòng mỗi lát, 200 tool calls tổng, 120 phút, tối đa 2 retries mỗi bước, 1 lần replan; không tự tăng budget.
- Gate A: người dùng xác nhận `approved: yes` trong prompt `#vault #code` ngày 2026-11-19. Gate B chỉ khi cần thêm file hoặc mở rộng scope. Không hỏi duyệt lại plan.
- Jev advisory: không bắt buộc. Không ghi Obsidian; write-back chỉ task pack cục bộ.
- Verification path: rà scope/diff → `npm run build` → `docker compose config` → build/run web container và HTTP → kiểm tra UI desktop/viewport hẹp bằng REA nếu khả dụng. Không thêm/chạy unit test; ghi rõ check thiếu và residual risk.
- Evidence từ khảo sát hiện tại nằm trong `context-package.md`; Kafka root chưa có source/Git, Redis Deep Dive chỉ là source tham khảo.

## Lệch brief đầu phiên và giới hạn hiện hành
- Brief đầu phiên gắn `bugfix / R4 / task-intake`, model lane `coding-small`, runtime `readonly-researcher`; khác với route task pack `feature / R3`.
- Router V2 phù hợp với `feature / R3`: đây là sản phẩm học tập local, không có auth, dữ liệu nghiệp vụ, migration, deploy hay multi-agent implementation để cần R4.

## Bàn giao implementation
- Approval: `passed` — người dùng đã duyệt kế hoạch và cho phép sửa code trong scope; không xin duyệt lại kế hoạch hoặc xin cấp quyền `scoped-coder`.
- Runtime dự kiến theo router: `scoped-coder` cho implementation; đây là lựa chọn routing, không phải một bước cấp quyền riêng của người dùng. Đối chiếu brief thực tế từng lượt; báo rõ mâu thuẫn nếu có, không tự hứa rằng mở chat mới sẽ giải quyết.
- Trạng thái: chưa triển khai; giữ nguyên phạm vi, yêu cầu và verification trong task pack.