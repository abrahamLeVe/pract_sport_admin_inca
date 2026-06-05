interface BrandsLayoutProps {
  children: React.ReactNode;
}

export default function BrandsLayout({ children }: BrandsLayoutProps) {
  return <div className="w-full space-y-4 p-6">{children}</div>;
}
