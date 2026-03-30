import { supabase } from '../lib/supabase';

export type EvidenceType = 'photo' | 'signature' | 'note';

export interface DeliveryEvidenceInput {
  orderId: string;
  uploadedBy: string;
  evidenceType: EvidenceType;
  fileUrl?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Sube evidencia de entrega (foto, firma o nota) a la tabla delivery_evidence.
 */
export async function uploadDeliveryEvidence(input: DeliveryEvidenceInput) {
  const { data, error } = await supabase
    .from('delivery_evidence')
    .insert({
      order_id: input.orderId,
      uploaded_by: input.uploadedBy,
      evidence_type: input.evidenceType,
      file_url: input.fileUrl ?? null,
      note: input.note ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene toda la evidencia de entrega para una orden.
 */
export async function getDeliveryEvidence(orderId: string) {
  const { data, error } = await supabase
    .from('delivery_evidence')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sube un archivo de evidencia al bucket de Supabase Storage
 * y retorna la URL pública.
 */
export async function uploadEvidenceFile(
  orderId: string,
  userId: string,
  fileBase64: string,
  contentType: string = 'image/jpeg',
): Promise<string> {
  const ext = contentType.split('/')[1] || 'jpg';
  const filePath = `delivery/${orderId}/${userId}_${Date.now()}.${ext}`;

  // Importar decode desde base64-arraybuffer como ya se usa en add-product.tsx
  const { decode } = await import('base64-arraybuffer');

  const { error } = await supabase.storage
    .from('listoshop-evidenciasdeentrega')
    .upload(filePath, decode(fileBase64), { contentType });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('listoshop-evidenciasdeentrega')
    .getPublicUrl(filePath);

  return publicUrl;
}
