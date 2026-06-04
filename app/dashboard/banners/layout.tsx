interface BannersLayoutProps {
  children: React.ReactNode;
}

export default function BannersLayout({ children }: BannersLayoutProps) {
  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Carrusel de Banners (Web Cliente)
        </h1>
      </div>

      {children}
    </div>
  );
}
