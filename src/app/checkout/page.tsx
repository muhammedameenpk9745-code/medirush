'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, CheckCircle2, AlertCircle, ArrowLeft, Plus, Edit2, Trash2, ShieldCheck, FileText, Building2, Check, RefreshCw } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { PrescriptionUploader } from '@/components/prescription/PrescriptionUploader';
import { AddAddressModal } from '@/components/checkout/AddAddressModal';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { calculateDeliveryFee } from '@/lib/constants/delivery';
import { createCustomerOrders } from '@/lib/supabase/orders';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { items, subtotal, hasPrescriptionRequiredItems, clearCart, removeFromCart } = useCart();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any | null>(null);

  // Delivery Availability & Coverage State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(true);
  const [sellerDeliveryResults, setSellerDeliveryResults] = useState<any[]>([]);

  // Prescription State
  const [uploadedPrescriptionId, setUploadedPrescriptionId] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Saved Addresses
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_default', { ascending: false });

    if (data && data.length > 0) {
      setAddresses(data);
      if (!selectedAddressId) {
        setSelectedAddressId(data[0].id);
      }
    } else {
      setAddresses([]);
      setSelectedAddressId('');
    }
  }, [supabase, user, selectedAddressId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Check delivery availability whenever selected address or cart items change
  useEffect(() => {
    if (!selectedAddressId || items.length === 0) {
      setIsDeliveryAvailable(null);
      setSellerDeliveryResults([]);
      return;
    }

    const selected = addresses.find((a) => a.id === selectedAddressId);
    if (!selected) return;

    setIsCheckingAvailability(true);

    const storeIds = Array.from(new Set(items.map((i) => i.storeId).filter(Boolean)));

    if (storeIds.length === 0) {
      setIsDeliveryAvailable(true);
      setIsCheckingAvailability(false);
      return;
    }

    const checkDelivery = async () => {
      try {
        const res = await fetch('/api/location/check-delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeIds,
            customerAddress: {
              address_line_1: selected.address_line_1 || '',
              address_line_2: selected.address_line_2 || selected.street_area || '',
              locality: selected.locality || selected.city || '',
              post_office: selected.post_office || '',
              district: selected.district || selected.city || '',
              city: selected.city || '',
              state: selected.state || '',
              country: selected.country || 'India',
              pincode: selected.pincode || '',
              latitude: selected.latitude || null,
              longitude: selected.longitude || null,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          setIsDeliveryAvailable(data.allAvailable);
          setSellerDeliveryResults(data.results || []);
        } else {
          const cleanPin = (selected.pincode || '').replace(/\D/g, '');
          setIsDeliveryAvailable(cleanPin.length === 6);
        }
      } catch {
        setIsDeliveryAvailable(true);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkDelivery();
  }, [selectedAddressId, addresses, items]);

  // Remove items from unavailable sellers
  const handleRemoveUnavailableItems = () => {
    const unavailableStoreIds = sellerDeliveryResults
      .filter((r) => !r.isAvailable)
      .map((r) => r.storeId);

    const itemsToRemove = items.filter((item) => unavailableStoreIds.includes(item.storeId));
    itemsToRemove.forEach((item) => removeFromCart(item.id));
  };

  // Delete Saved Address
  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this delivery address?')) return;

    await supabase.from('addresses').delete().eq('id', id);
    if (selectedAddressId === id) {
      setSelectedAddressId('');
    }
    await fetchAddresses();
  };

  // Open Edit Modal
  const handleEditAddress = (addr: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddressToEdit(addr);
    setIsAddressModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setAddressToEdit(null);
    setIsAddressModalOpen(true);
  };

  // Handle Address Saved Callback
  const handleAddressSaved = (savedRecord: any) => {
    fetchAddresses();
    if (savedRecord && savedRecord.id) {
      setSelectedAddressId(savedRecord.id);
    }
  };

  const deliveryFee = calculateDeliveryFee(subtotal);
  const grandTotal = subtotal + deliveryFee;

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a delivery address before continuing.');
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setErrorMessage('Please select a valid delivery address to continue.');
      return;
    }

    if (isDeliveryAvailable === false) {
      setErrorMessage('Delivery is currently unavailable at this location. Please select another address.');
      return;
    }

    if (hasPrescriptionRequiredItems && !uploadedPrescriptionId) {
      setErrorMessage('Your cart contains prescription medicines. Please upload a valid doctor prescription.');
      return;
    }

    setIsSubmittingOrder(true);
    setErrorMessage(null);

    const result = await createCustomerOrders({
      addressId: selectedAddressId,
      paymentMethod,
      prescriptionId: uploadedPrescriptionId,
      items,
    });

    if (!result.success || !result.orderIds || result.orderIds.length === 0) {
      setErrorMessage(result.error || 'Failed to place order. Please try again.');
      setIsSubmittingOrder(false);
      return;
    }

    const mainOrderId = result.orderIds[0];

    if (paymentMethod === 'COD') {
      clearCart();
      router.push(`/order-success/${mainOrderId}`);
      return;
    }

    // Online Payment via Server-Side Razorpay Order & Verification
    try {
      const createRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInINR: grandTotal,
          orderId: mainOrderId,
          notes: { customerId: user?.id || '' },
        }),
      });

      const createData = await createRes.json();

      if (!createData.success) {
        setErrorMessage(createData.error || 'Failed to initialize online payment gateway.');
        setIsSubmittingOrder(false);
        return;
      }

      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded && !createData.isMockProvider) {
        setErrorMessage('Failed to load Razorpay payment gateway. Please check connection.');
        setIsSubmittingOrder(false);
        return;
      }

      if (createData.isMockProvider || !(window as any).Razorpay) {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: createData.razorpayOrderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'sig_mock_development_test',
            orderId: mainOrderId,
            customerId: user?.id,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          clearCart();
          router.push(`/order-success/${mainOrderId}`);
        } else {
          setErrorMessage(verifyData.error || 'Mock payment verification failed.');
          setIsSubmittingOrder(false);
        }
        return;
      }

      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency || 'INR',
        name: 'MediRush Healthcare',
        description: `Payment for Order #${mainOrderId.substring(0, 8)}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: profile?.full_name || '',
          email: user?.email || '',
          contact: profile?.phone || '',
        },
        theme: {
          color: '#16B67A',
        },
        handler: async function (response: any) {
          setIsSubmittingOrder(true);
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: mainOrderId,
                customerId: user?.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              router.push(`/order-success/${mainOrderId}`);
            } else {
              setErrorMessage(verifyData.error || 'Payment signature verification failed on server.');
              setIsSubmittingOrder(false);
            }
          } catch {
            setErrorMessage('Error communicating with payment verification server.');
            setIsSubmittingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmittingOrder(false);
            setErrorMessage('Payment process was cancelled. Order remains pending.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred initiating online payment.');
      setIsSubmittingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
        <Header />
        <main className="grow max-w-7xl mx-auto w-full p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-[#0B2540]">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">Add medicines or healthcare products to proceed with checkout.</p>
          <Link href="/products">
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Products Catalog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Cart
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2540]">Order Delivery & Payment</h1>
              <p className="text-xs text-slate-500">Confirm delivery address, prescription, and payment method</p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left 2 Columns: Steps */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: DELIVERY ADDRESS SECTION */}
            <div className="bg-white border border-[#E2EAE6] rounded-3xl p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2EAE6] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#E8F8F1] text-[#16B67A] font-black text-xs flex items-center justify-center border border-[#16B67A]/30">
                    1
                  </div>
                  <h3 className="text-sm font-extrabold text-[#0B2540]">
                    Select Delivery Address
                  </h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4 text-[#16B67A]" />}
                  onClick={handleOpenAddModal}
                  className="border-[#16B67A]/40 text-[#0F8F68] hover:bg-[#E8F8F1]"
                >
                  Add New Address
                </Button>
              </div>

              {/* Saved Address Cards */}
              <div className="space-y-3 pt-1">
                {addresses.length === 0 ? (
                  <div className="p-6 bg-[#F7FAF9] border border-dashed border-[#E2EAE6] rounded-2xl text-center space-y-3">
                    <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No saved delivery addresses found.</p>
                    <p className="text-[11px] text-slate-400">Click &quot;Add New Address&quot; to specify where your medicines should be delivered.</p>
                    <Button variant="primary" size="sm" onClick={handleOpenAddModal} leftIcon={<Plus className="w-4 h-4" />}>
                      Add New Delivery Address
                    </Button>
                  </div>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#E8F8F1]/50 border-[#16B67A] ring-1 ring-[#16B67A] shadow-soft-sm'
                            : 'bg-white border-[#E2EAE6] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="delivery_address"
                              value={addr.id}
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-[#16B67A] focus:ring-[#16B67A]"
                            />
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#0B2540] text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                                  {addr.label || 'HOME'}
                                </span>
                                {addr.is_default && (
                                  <span className="bg-[#E8F8F1] text-[#0F8F68] border border-[#16B67A]/30 text-[10px] font-bold px-2 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="font-extrabold text-[#0B2540] pt-0.5">
                                {addr.full_name} <span className="text-slate-400 font-normal">• +91 {addr.phone}</span>
                              </p>
                              <p className="text-slate-600 font-medium">
                                {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                              </p>
                              <p className="text-slate-600 font-medium">
                                {addr.post_office ? `${addr.post_office} P.O., ` : ''}{addr.city || addr.district}, {addr.state} — <strong className="text-[#0B2540]">{addr.pincode}</strong>
                              </p>

                              {addr.landmark && (
                                <p className="text-[11px] text-slate-500 italic pt-0.5">
                                  Landmark: {addr.landmark}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleEditAddress(addr, e)}
                              className="p-1.5 text-slate-400 hover:text-[#0B2540] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Delivery Availability & Seller Coverage Badges */}
              {selectedAddressId && (
                <div className="pt-3 border-t border-[#E2EAE6] space-y-2">
                  {isCheckingAvailability ? (
                    <p className="text-xs text-[#16B67A] font-bold flex items-center gap-1.5 p-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating seller delivery coverage & distance...</span>
                    </p>
                  ) : sellerDeliveryResults.length > 0 ? (
                    <div className="space-y-2">
                      {sellerDeliveryResults.map((result) => (
                        <div
                          key={result.storeId}
                          className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                            result.isAvailable
                              ? 'bg-[#E8F8F1] border-[#16B67A]/30 text-[#0F8F68]'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {result.isAvailable ? (
                              <CheckCircle2 className="w-4 h-4 text-[#16B67A] shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-[#0B2540] block">{result.storeName}</span>
                              <span className="font-medium text-[11px] leading-relaxed block">{result.reasonMessage}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase border shrink-0 ${
                            result.isAvailable
                              ? 'bg-white border-[#16B67A]/40 text-[#0F8F68]'
                              : 'bg-white border-rose-300 text-rose-700'
                          }`}>
                            {result.coverageType}
                          </span>
                        </div>
                      ))}

                      {!isDeliveryAvailable && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                          <p className="font-extrabold text-amber-900">
                            ✕ Some products in your cart cannot be delivered to this address.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleOpenAddModal}
                              className="bg-white hover:bg-slate-50 text-[#0B2540] border border-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-2xs"
                            >
                              Change Delivery Address
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveUnavailableItems}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-2xs"
                            >
                              Remove Unavailable Items
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isDeliveryAvailable ? (
                    <div className="p-3 bg-[#E8F8F1] border border-[#16B67A]/30 rounded-xl text-xs text-[#0F8F68] font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#16B67A] shrink-0" />
                      <span>✓ MediRush Express Delivery available to this address</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Delivery is currently unavailable at this location.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: PRESCRIPTION ATTACHMENT */}
            {hasPrescriptionRequiredItems && (
              <PrescriptionUploader
                onPrescriptionUploaded={(rxId) => setUploadedPrescriptionId(rxId)}
              />
            )}

            {/* STEP 3: PAYMENT METHOD */}
            <div className="bg-white border border-[#E2EAE6] rounded-3xl p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2EAE6] pb-3">
                <div className="w-7 h-7 rounded-xl bg-[#E8F8F1] text-[#16B67A] font-black text-xs flex items-center justify-center border border-[#16B67A]/30">
                  {hasPrescriptionRequiredItems ? '3' : '2'}
                </div>
                <h3 className="text-sm font-extrabold text-[#0B2540]">
                  Payment Method
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-[#E8F8F1]/50 border-[#16B67A] ring-1 ring-[#16B67A]'
                      : 'bg-white border-[#E2EAE6]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-0.5 text-[#16B67A] focus:ring-[#16B67A]"
                  />
                  <div>
                    <p className="font-extrabold text-[#0B2540]">Cash / UPI on Delivery (COD)</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">Pay cash or scan rider QR code upon medicine delivery</p>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'bg-[#E8F8F1]/50 border-[#16B67A] ring-1 ring-[#16B67A]'
                      : 'bg-white border-[#E2EAE6]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    className="mt-0.5 text-[#16B67A] focus:ring-[#16B67A]"
                  />
                  <div>
                    <p className="font-extrabold text-[#0B2540]">Online UPI / Cards / NetBanking</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">Instant secure payment gateway powered by Razorpay</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout Button */}
          <div className="bg-white border border-[#E2EAE6] rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6 sticky top-24">
            <h3 className="text-base font-extrabold text-[#0B2540] border-b border-[#E2EAE6] pb-3">
              Order Total Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-bold text-[#0B2540]">₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600 font-medium">
                <span>Express Delivery Fee</span>
                <span className="font-bold text-[#0B2540]">
                  {deliveryFee === 0 ? <span className="text-[#16B67A]">FREE</span> : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E2EAE6] flex justify-between text-base font-black text-[#0B2540]">
                <span>Total Amount Payable</span>
                <span className="text-2xl text-[#0B2540]">₹{grandTotal}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full font-extrabold text-sm py-4 shadow-soft-sm hover:shadow-card-hover cursor-pointer"
              isLoading={isSubmittingOrder}
              disabled={!selectedAddressId || isDeliveryAvailable === false}
              onClick={handlePlaceOrder}
            >
              {paymentMethod === 'ONLINE' ? 'Continue to Payment (Razorpay) →' : 'Confirm & Place Order (COD) →'}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-[#16B67A]" />
              <span>100% Encrypted & Safe Prescription Orders</span>
            </div>
          </div>

        </div>

      </main>

      {/* Add / Edit Address Modal */}
      <AddAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={handleAddressSaved}
        addressToEdit={addressToEdit}
      />

      <Footer />
      <MobileNavigation />
    </div>
  );
}
