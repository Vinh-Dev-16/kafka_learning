# Kafka Deep Dive · Local Learning Lab

A Vietnamese, offline-first Kafka learning site with 11 chapters, 61 self-contained lessons, three SVG simulations, a drag-and-connect design sandbox, practice questions, progress, and per-lesson notes.

The site is a learning model only. It does not start Kafka, expose a backend, store data outside the browser, or connect to a database or external service. Progress, notes, and the design sandbox stay in this browser's local storage.

## Run with Docker Desktop

1. Start Docker Desktop.
2. Run `scripts/Open-Kafka-Learning.bat`, or from this folder run `docker compose up -d --build`.
3. Open <http://127.0.0.1:5178>.
4. Run `scripts/Stop-Kafka-Learning.bat` or `docker compose down` when finished.

Compose publishes only on loopback and uses the project name `kafka-deep-dive-learning`, so stop affects this web project only. The first build needs the Node and Nginx images plus npm packages; after the image is built, the lesson content and UI require no network connection.

## Run in development

Requires Node.js 22 and npm.

```powershell
npm ci
npm run dev
```

Vite listens on `127.0.0.1:5173`. Use `npm run build` to create the static site in `dist/`.

## Learning features

- Expandable 11-chapter course outline with lesson progress.
- Structured lesson content: concept, mechanism, application, limits, example, takeaway, interview prompt, and a self-check with answer explanation.
- Three step-based simulations: record lifecycle, consumer group rebalance, and replication/leader failover.
- Design Room with draggable nodes, explicit connections, partition and consumer controls, and a simplified backlog model.
- Ctrl+K lesson search, keyboard navigation, responsive course and notes panels, and reduced-motion support.
- Versioned local storage for progress and notes, with a safe default if saved data is unreadable.

## Scope

This project is an offline illustration. It does not benchmark Kafka behavior or replace official documentation, production configuration review, or a cluster test.
