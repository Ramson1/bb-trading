export function GameView() {
  return (
    <div className="game-view" style={{ height: '100vh', width: '100%' }}>
      <webview
        src="https://www.ilotbet.com/aviator/"
        style={{ width: '100%', height: '100%' }}
        allowpopups
      />
    </div>
  );
}