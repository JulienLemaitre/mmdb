export default function Glossary() {
  return (
    <div className="text-sm">
      <h2 className="mb-4 text-2xl font-bold">Glossary</h2>
      <dl className="grid grid-cols-1 gap-4">
        <div>
          <dt className="font-bold mb-2">Piece</dt>
          <dd className="pl-6">
            <p>
              The <em>Piece</em> entity is used to identify a composition in
              order to reference it in editions, books, etc.
            </p>
            <p>
              example: <em>Goldberg Variations</em>
            </p>
          </dd>
        </div>
        <div>
          <dt className="font-bold mb-2">Piece Version</dt>
          <dd className="pl-6">
            <p>
              The <em>Piece Version</em> is a set of properties related to
              instrumentation and time signature.
            </p>
            <p>
              example: <em>Goldberg Variations</em>
            </p>
          </dd>
        </div>
      </dl>
    </div>
  );
}
