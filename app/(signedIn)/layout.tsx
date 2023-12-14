import NavBar from "@/app/NavBar";

export default function SignedInRootLayout({ children }) {
  return (
    <>
      <NavBar title="Explore data" />
      <div className="bg-gray-100 flex-1">{children}</div>
    </>
  );
}
