'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ShoppingBag, Clock, CheckCircle2, PackageCheck, AlertCircle, FileText, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SellerOrdersPage() {
  const { sellerStore } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Prescription Modal & Rx Data
  const [activePrescriptionOrder, setActivePrescriptionOrder] = useState<any | null>(null);
  const [rxRecord, setRxRecord] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifyingRx, setIsVerifyingRx] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!sellerStore) return;
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(product_name, image_url, prescription_required)), customers(profile_id)')
        .eq('store_id', sellerStore.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [sellerStore, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenRxModal = async (order: any) => {
    setActivePrescriptionOrder(order);
    setRejectReason('');
    setRxRecord(null);

    const { data: rx } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    if (rx) setRxRecord(rx);
  };

  const handleApprovePrescription = async (order: any) => {
    setIsVerifyingRx(true);
    const now = new Date().toISOString();

    // 1. Update prescription record
    if (rxRecord?.id) {
      await supabase
        .from('prescriptions')
        .update({
          status: 'APPROVED',
          reviewed_at: now,
        })
        .eq('id', rxRecord.id);
    }

    // 2. Update order record status
    await supabase
      .from('orders')
      .update({
        prescription_status: 'APPROVED',
        order_status: 'CONFIRMED',
      })
      .eq('id', order.id);

    // 3. Emit Customer Notification
    const customerProfileId = (order.customers as any)?.profile_id;
    if (customerProfileId) {
      await supabase.from('notifications').insert({
        profile_id: customerProfileId,
        type: 'PRESCRIPTION_APPROVED',
        title: 'Prescription Verified & Approved',
        message: `Your prescription for Order #${order.order_number || order.id.substring(0, 8)} was verified by the pharmacist. Medicines are being prepared.`,
        order_id: order.id,
      });
    }

    setIsVerifyingRx(false);
    setActivePrescriptionOrder(null);
    await fetchOrders();
  };

  const handleRejectPrescription = async (order: any) => {
    setIsVerifyingRx(true);
    const now = new Date().toISOString();
    const reason = rejectReason.trim() || 'Prescription image unreadable or invalid doctor signature.';

    // 1. Update prescription record
    if (rxRecord?.id) {
      await supabase
        .from('prescriptions')
        .update({
          status: 'REJECTED',
          review_notes: reason,
          reviewed_at: now,
        })
        .eq('id', rxRecord.id);
    }

    // 2. Update order record status
    await supabase
      .from('orders')
      .update({
        prescription_status: 'REJECTED',
        order_status: 'CANCELLED',
      })
      .eq('id', order.id);

    // 3. Emit Customer Notification
    const customerProfileId = (order.customers as any)?.profile_id;
    if (customerProfileId) {
      await supabase.from('notifications').insert({
        profile_id: customerProfileId,
        type: 'PRESCRIPTION_REJECTED',
        title: 'Prescription Verification Failed',
        message: `Order #${order.order_number || order.id.substring(0, 8)} declined by pharmacist: ${reason}`,
        order_id: order.id,
      });
    }

    setIsVerifyingRx(false);
    setActivePrescriptionOrder(null);
    await fetchOrders();
  };

  // Order Status Transition Handler
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: nextStatus })
      .eq('id', orderId)
      .eq('store_id', sellerStore?.id);

    if (!error) {
      await fetchOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatusFilter === 'ALL') return true;
    return o.order_status === selectedStatusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pharmacy Order Pipeline</h1>
        <p className="text-sm text-slate-500">Accept customer orders, verify doctor prescriptions, prepare medicines, and trigger rider pickup</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-soft-sm flex items-center gap-2 overflow-x-auto text-xs">
        {[
          { label: 'All Orders', value: 'ALL' },
          { label: 'Pending Verification', value: 'PLACED' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Preparing', value: 'PREPARING' },
          { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
          { label: 'Delivered', value: 'DELIVERED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedStatusFilter === tab.value
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200/80">
            Loading pharmacy order queue...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No orders found</p>
            <p className="text-xs text-slate-500">Orders placed by local customers will appear in this pipeline.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const hasRxItem = ord.prescription_required || ord.order_items?.some((i: any) => i.products?.prescription_required);

            return (
              <div
                key={ord.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 hover:border-brand-200 transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-base">
                        #{ord.order_number || ord.id.substring(0, 8)}
                      </span>
                      <span className="bg-brand-50 text-brand-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-brand-200 uppercase">
                        {ord.order_status}
                      </span>
                      {hasRxItem && (
                        <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-[10px] border border-red-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Rx ({ord.prescription_status})</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Placed on {new Date(ord.created_at).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">₹{ord.total_amount}</p>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase">Payment: {ord.payment_status}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items ({ord.order_items?.length || 0}):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ord.order_items?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{item.product_name_snapshot || item.products?.product_name || 'Medicine'}</p>
                          <p className="text-[10px] text-slate-500">Qty: {item.quantity} x ₹{item.unit_price}</p>
                        </div>
                        <span className="font-extrabold text-slate-900">₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Pipeline Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {hasRxItem && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="w-4 h-4 text-red-600" />}
                        onClick={() => handleOpenRxModal(ord)}
                      >
                        {ord.prescription_status === 'APPROVED' ? 'View Verified Rx' : 'Verify Doctor Prescription'}
                      </Button>
                    )}
                  </div>

                  {/* Status Change Action Buttons */}
                  <div className="flex items-center gap-2">
                    {ord.order_status === 'PLACED' && !hasRxItem && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<X className="w-4 h-4" />}
                          onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Check className="w-4 h-4" />}
                          onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}
                        >
                          Accept Order
                        </Button>
                      </>
                    )}

                    {ord.order_status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Clock className="w-4 h-4" />}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                      >
                        Start Packing Medicines
                      </Button>
                    )}

                    {ord.order_status === 'PREPARING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<PackageCheck className="w-4 h-4" />}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                      >
                        Mark Ready for Rider Pickup
                      </Button>
                    )}

                    {ord.order_status === 'READY_FOR_PICKUP' && (
                      <div className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ready for Rider Dispatch</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Interactive Pharmacist Prescription Verification Modal */}
      {activePrescriptionOrder && (
        <Modal
          isOpen={Boolean(activePrescriptionOrder)}
          onClose={() => setActivePrescriptionOrder(null)}
          title={`Pharmacist Rx Verification — Order #${activePrescriptionOrder.order_number || activePrescriptionOrder.id.substring(0, 8)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
              <strong>Pharmacist Responsibility:</strong> Inspect doctor name, qualification, and dosage instructions against the ordered medicine list below before approving this prescription.
            </div>

            {/* File Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="font-bold text-slate-900 flex items-center justify-between">
                <span>Customer Uploaded Prescription:</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Status: {activePrescriptionOrder.prescription_status}</span>
              </p>

              {rxRecord?.file_url ? (
                <div className="w-full h-48 bg-white border border-slate-200 rounded-xl overflow-hidden relative">
                  <a href={rxRecord.file_url} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full">
                    <Image src={rxRecord.file_url} alt="Prescription" fill className="object-contain p-2" />
                  </a>
                </div>
              ) : (
                <p className="text-slate-500 italic p-4 text-center bg-white rounded-xl border">
                  Prescription file stored on record.
                </p>
              )}
            </div>

            {/* Rejection Note Input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Rejection Reason (Required only if declining):</label>
              <input
                type="text"
                placeholder="e.g. Doctor stamp missing or medicine names unreadable"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Pharmacist Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="danger"
                size="md"
                className="w-1/2"
                isLoading={isVerifyingRx}
                onClick={() => handleRejectPrescription(activePrescriptionOrder)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Reject Prescription
              </Button>

              <Button
                variant="primary"
                size="md"
                className="w-1/2"
                isLoading={isVerifyingRx}
                onClick={() => handleApprovePrescription(activePrescriptionOrder)}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve & Confirm Order
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
