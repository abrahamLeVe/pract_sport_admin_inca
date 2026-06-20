import { getOrderById } from "@/lib/data/orders";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { EditOrderForm } from "../../_components/edit-order-form";

export const metadata = {
  title: "Detalle del Pedido | Admin Inca",
};

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const orderId = parseInt(params.id, 10);

  if (isNaN(orderId)) {
    return notFound();
  }

  // Traemos el pedido con todos sus productos desde PostgreSQL
  const order = await getOrderById(orderId);

  if (!order) {
    return notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/orders">Pedidos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.order_number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Pedido {order.order_number}
        </h2>
      </div>

      {/* Le pasamos la data real al formulario cliente */}
      <EditOrderForm initialData={order} />
    </div>
  );
}
