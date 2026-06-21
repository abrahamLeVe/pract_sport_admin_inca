import { getOrders } from "@/lib/data/orders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersClient } from "../_components/orders-client";

export const metadata = {
  title: "Pedidos | Admin Inca",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
          <CardDescription>
            Gestiona los pedidos de la tienda, revisa los pagos y actualiza los
            estados de envío.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersClient data={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
