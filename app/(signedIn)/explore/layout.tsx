import NavBar from "@/ui/NavBar";

export default function SignedInRootLayout({ children }) {
  return (
    <>
      <NavBar title="Exploration" />
      <div className="bg-base-100 flex-1">{children}</div>
    </>
  );
}
