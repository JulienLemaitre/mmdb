import NavBar from "@/app/NavBar";

export default function SignedInRootLayout({ children }) {
  return (
    <>
      <NavBar title="Insert new data" />
      <div className="bg-red-100 flex-1">{children}</div>
    </>
  );
}
