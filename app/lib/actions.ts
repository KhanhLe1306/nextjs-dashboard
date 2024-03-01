'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`
    INSERT INTO Invoices (customer_id, amount, status, date) 
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date}) 
  `;
  } catch (e) {
    return {
      message: 'Database error: Failed to Create Invoice',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const EditInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = EditInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  try {
    await sql`
    UPDATE Invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id} 
  `;
  } catch (e) {
    return {
      message: 'Database error: Failed to Update Invoice',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Unable to delete invoice');
  try {
    await sql`DELETE FROM Invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice Deleted' };
  } catch (e) {
    return {
      message: 'Database error: Failed to Delete Invoice',
    };
  }
}
