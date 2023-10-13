export default function ContributeLayout({ children }) {
  // SideBar layout
  return (
    <div className="flex h-full">
      <aside className="bg-base-100 w-80 p-10">
        <ul className="steps steps-vertical">
          <li className="step step-primary">Composer</li>
          <li className="step step-primary">Piece</li>
          <li className="step">MM Source</li>
          <li className="step">Metronome marks</li>
        </ul>
      </aside>
      <main className="flex-1 bg-base-200 p-10">{children}</main>
    </div>
  );
}
