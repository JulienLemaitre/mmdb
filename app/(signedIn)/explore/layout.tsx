import NavBar from "@/app/NavBar";

export default function SignedInRootLayout({ children }) {
  return (
    <>
      <NavBar title="Exploration" />
      <div className="bg-zinc-50 dark:bg-zinc-800 flex-1">{children}</div>
    </>
  );
}
