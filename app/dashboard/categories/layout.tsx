interface CategoriesLayoutProps {
  children: React.ReactNode;
}

export default function CategoriesLayout({ children }: CategoriesLayoutProps) {
  return <div className="w-full space-y-4 p-6">{children}</div>;
}
