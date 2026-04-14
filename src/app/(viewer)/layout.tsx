// Bare layout for Apple-style scroll viewer — no nav, full black screen
export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black text-white overflow-x-hidden">
      {children}
    </div>
  );
}
