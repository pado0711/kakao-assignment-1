import './App.css';

const App = () => (
  <main className="app-shell">
    <section className="todo-card" aria-labelledby="app-title">
      <header className="app-header">
        <p className="eyebrow">TODO LIST</p>
        <h1 id="app-title">오늘의 할 일</h1>
        <p className="header-copy">작은 일부터 차근차근 기록해 보세요.</p>
      </header>
    </section>
  </main>
);

export default App;
