export default function NavBar({ title }: { title: string }) {
  return (
    <div className="navbar bg-base-100 px-4">
      <div className="flex-none">
        <span className="text-lg font-bold">{title}</span>
      </div>
      <div className="flex-1 px-2 mx-2 text-center flex justify-center">
        <a className="btn btn-ghost normal-case text-xl" href="/">
          MM Database
        </a>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src="https://ui-avatars.com/api/?name=Julien+Lemaître" />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
