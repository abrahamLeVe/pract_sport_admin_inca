interface ProductsLayoutProps {
  children: React.ReactNode;
}

export default function ProductsLayout({ children }: ProductsLayoutProps) {
  return <div className="w-full space-y-4 p-6">{children}</div>;
}
