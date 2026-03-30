import { supabase } from '../lib/supabase';

/**
 * Estados válidos y transiciones de la máquina de estados de orden.
 *
 * pending_payment → paid | failed | cancelled
 * paid            → ready_for_dispatch | cancelled
 * ready_for_dispatch → shipped | cancelled
 * shipped         → delivered
 * delivered / failed / cancelled → (terminal)
 */
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  ready_for_dispatch: 'Listo para despacho',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
};

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'bg-yellow-100 text-yellow-700';
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'ready_for_dispatch':
      return 'bg-indigo-100 text-indigo-700';
    case 'shipped':
      return 'bg-blue-100 text-blue-700';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'failed':
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Avanza el estado de una orden llamando al RPC de Supabase.
 * Valida transiciones en el servidor.
 */
export async function advanceOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  actorRole: 'buyer' | 'vendor' | 'system',
  note?: string,
) {
  const { data, error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_actor_id: actorId,
    p_actor_role: actorRole,
    p_note: note ?? null,
  });

  if (error) throw new Error(error.message);
  return data as { order_id: string; previous_status: string; new_status: string };
}

/**
 * Obtiene la bitácora de eventos de una orden.
 */
export async function getOrderEvents(orderId: string) {
  const { data, error } = await supabase
    .from('order_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
