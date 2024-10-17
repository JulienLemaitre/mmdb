export default function AuthLayout({ children }) {
  return (
    <>
      <div className="navbar bg-base-100 px-4">
        <div className="flex-1 px-2 mx-2 text-center flex justify-center">
          <a className="btn btn-ghost normal-case text-xl" href="/">
            MM Database
          </a>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <div className="flex flex-col items-stretch gap-6 w-full max-w-xs">
          {children}
        </div>
      </div>
    </>
  );
}
