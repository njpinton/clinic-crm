'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointment, Appointment } from '@/lib/api/appointments';
import { getInvoiceByAppointment, createInvoice, addItemToInvoice, recordPayment, Invoice } from '@/lib/api/billing';

export default function BillingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Item State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;
      try {
        setIsLoading(true);
        // 1. Get Appointment
        const appt = await getAppointment(params.id, accessToken);
        setAppointment(appt);

        // 2. Get Invoice
        let inv = await getInvoiceByAppointment(params.id, accessToken);
        
        // 3. If no invoice, create one
        if (!inv) {
          inv = await createInvoice({
            appointment: appt.id,
            patient: appt.patientId // assuming patientId is available
          }, accessToken);
        }
        setInvoice(inv);
      } catch (err) {
        console.error(err);
        setError('Failed to load billing information.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [accessToken, params.id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !accessToken) return;

    try {
      setIsAddingItem(true);
      await addItemToInvoice(invoice.id, {
        description,
        quantity: 1,
        unit_price: parseFloat(amount),
      }, accessToken);
      
      // Refresh invoice
      const updated = await getInvoiceByAppointment(params.id, accessToken);
      setInvoice(updated);
      setDescription('');
      setAmount('');
    } catch (err) {
      alert('Failed to add item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !accessToken) return;

    try {
      setIsPaying(true);
      await recordPayment(invoice.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod
      }, accessToken);
      
      // Refresh invoice
      const updated = await getInvoiceByAppointment(params.id, accessToken);
      setInvoice(updated);
      setPaymentAmount('');
    } catch (err) {
      alert('Failed to record payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!appointment || !invoice) return <div className="p-8 text-center">Error loading billing</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoice</h1>
          <p className="text-gray-600 mt-1">Invoice #{invoice.invoice_number}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Status</div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
            invoice.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {invoice.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Invoice Items</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No items added yet</td>
                  </tr>
                ) : (
                  invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Item Form */}
          {invoice.status !== 'paid' && (
            <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add Charge</h3>
              <form onSubmit={handleAddItem} className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description (e.g., Consultation Fee)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                    step="0.01"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Payments & Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Due</span>
                <span className="font-medium text-gray-900">${invoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="font-medium text-green-600">${invoice.paid_amount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                <span>Balance Due</span>
                <span className="text-blue-600">${invoice.balance_due.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Record Payment */}
          {invoice.balance_due > 0 && (
            <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder={invoice.balance_due.toFixed(2)}
                    max={invoice.balance_due}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="gcash">GCash</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Record Payment
                </button>
              </form>
            </div>
          )}
          
          <div className="text-center">
             <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => window.print()}
             >
                Print Receipt
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
