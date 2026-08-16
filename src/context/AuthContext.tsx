'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: string;
}

export interface SellerStoreData {
  id: string;
  store_name: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  medical_license_number: string;
  gst_number?: string;
  opening_time?: string;
  closing_time?: string;
  min_order_amount?: number;
  delivery_fee?: number;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  store_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface DeliveryPartnerData {
  id: string;
  vehicle_type: string;
  vehicle_number?: string;
  license_number: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  availability_status: 'OFFLINE' | 'ONLINE' | 'BUSY';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  sellerStore: SellerStoreData | null;
  deliveryPartner: DeliveryPartnerData | null;
  role: UserRole;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string, selectedRole?: UserRole) => Promise<{ error: Error | null; role?: UserRole; verificationStatus?: string }>;
  signUpCustomer: (data: { fullName: string; email: string; phone: string; password: string; address?: string; city?: string; state?: string; pincode?: string }) => Promise<{ error: Error | null }>;
  signUpSeller: (data: { ownerName: string; storeName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; medicalLicenseNumber: string; gstNumber?: string; password: string }) => Promise<{ error: Error | null }>;
  signUpDeliveryPartner: (data: { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; vehicleType: string; vehicleNumber: string; licenseNumber: string; password: string }) => Promise<{ error: Error | null }>;
  resetPasswordRequest: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const getRoleDisplayName = (r: UserRole): string => {
  switch (r) {
    case 'SELLER':
      return 'Seller';
    case 'DELIVERY_PARTNER':
      return 'Rider';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'Admin';
    default:
      return 'Customer';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [sellerStore, setSellerStore] = useState<SellerStoreData | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartnerData | null>(null);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const supabase = createClient();

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Parse Supabase URL Hash Errors (#error=access_denied&error_code=otp_expired...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const params = new URLSearchParams(rawHash);
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');

      if (error || errorCode || errorDescription) {
        let userFriendlyMsg = 'An authentication link error occurred.';
        if (errorCode === 'otp_expired' || errorDescription?.toLowerCase().includes('expired')) {
          userFriendlyMsg = 'This verification link has expired. Please request a new verification email.';
        } else if (error === 'access_denied') {
          userFriendlyMsg = 'Access was denied or the authentication link is invalid. Please sign in or request a new reset link.';
        } else if (errorDescription) {
          userFriendlyMsg = errorDescription.replace(/\+/g, ' ');
        }

        setAuthError(userFriendlyMsg);

        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
          // Silent fallback
        }
      }
    }
  }, []);

  const fetchProfileAndRoleDetails = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profData && !profError) {
        const userProfile = profData as UserProfileData;
        setProfile(userProfile);
        setRole(userProfile.role || (currentUser?.user_metadata?.role as UserRole) || 'CUSTOMER');

        if (userProfile.role === 'SELLER') {
          const { data: storeData } = await supabase
            .from('medical_stores')
            .select('*')
            .eq('owner_profile_id', userId)
            .maybeSingle();

          if (storeData) setSellerStore(storeData as SellerStoreData);
        }

        if (userProfile.role === 'DELIVERY_PARTNER') {
          const { data: partnerData } = await supabase
            .from('delivery_partners')
            .select('*')
            .eq('profile_id', userId)
            .maybeSingle();

          if (partnerData) setDeliveryPartner(partnerData as DeliveryPartnerData);
        }
      } else {
        // Fallback for PostgreSQL RLS or missing profile record
        const fallbackRole = (currentUser?.user_metadata?.role as UserRole) || 'CUSTOMER';
        setRole(fallbackRole);
        setProfile({
          id: userId,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email || 'User',
          email: currentUser?.email || '',
          phone: currentUser?.user_metadata?.phone || null,
          avatar_url: null,
          role: fallbackRole,
          status: 'ACTIVE',
        });
      }
    } catch {
      const fallbackRole = (currentUser?.user_metadata?.role as UserRole) || 'CUSTOMER';
      setRole(fallbackRole);
    }
  }, [supabase]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfileAndRoleDetails(session.user.id, session.user);
        }
      } catch {
        // Silent catch
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndRoleDetails(session.user.id, session.user);
      } else {
        setUser(null);
        setProfile(null);
        setSellerStore(null);
        setDeliveryPartner(null);
        setRole('CUSTOMER');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRoleDetails, supabase]);

  // Sign In with 10s Failsafe Timeout & Verification Checking
  const signIn = async (email: string, password: string, selectedRole?: UserRole) => {
    const timeoutPromise = new Promise<{ error: Error | null }>((_, reject) =>
      setTimeout(() => reject(new Error('Login is taking too long. Please check your connection and try again.')), 10000)
    );

    const authPromise = (async () => {
      // If Admin role is selected, authenticate via secure server-side Admin endpoint
      if (selectedRole === 'ADMIN') {
        try {
          const apiRes = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const apiData = await apiRes.json();

          if (!apiRes.ok || apiData.error) {
            return { error: new Error(apiData.error || 'Invalid login credentials') };
          }

          // Fetch current auth session after server cookie setting
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            setRole('ADMIN');
          } else {
            setRole('ADMIN');
          }

          return { error: null, role: 'ADMIN' as UserRole, verificationStatus: 'APPROVED' };
        } catch (adminErr: any) {
          return { error: new Error(adminErr?.message || 'Admin authentication failed') };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed') {
          return { error: new Error('Please verify your email address before signing in.') };
        }
        return { error: new Error(msg || 'Authentication failed. Please check your credentials.') };
      }

      if (!data.user) {
        return { error: new Error('Authentication failed. User session not returned.') };
      }

      // Safe Profile & Role lookup (with user_metadata fallback)
      let userRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'CUSTOMER';
      let isVerified = data.user.email_confirmed_at !== null;

      try {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', data.user.id)
          .single();

        if (!profErr && prof) {
          if (prof.role) userRole = prof.role as UserRole;
          if (typeof prof.email_verified === 'boolean') isVerified = prof.email_verified;
        }
      } catch {
        // Fallback to metadata
      }

      if (!isVerified && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        await supabase.auth.signOut();
        return { error: new Error('Please verify your email before signing in.') };
      }

      // Role Match Verification
      if (selectedRole) {
        const selRoleStr = selectedRole as string;
        const checkRoleStr = userRole as string;
        const isRoleMatch =
          selRoleStr === checkRoleStr ||
          (selRoleStr === 'ADMIN' && (checkRoleStr === 'ADMIN' || checkRoleStr === 'SUPER_ADMIN'));

        if (!isRoleMatch) {
          await supabase.auth.signOut();
          const actualDisplayName = getRoleDisplayName(userRole);
          return {
            error: new Error(`Your account is registered as ${actualDisplayName}. Please select the correct login type.`),
          };
        }
      }

      let verificationStatus = 'APPROVED';
      try {
        if (userRole === 'SELLER') {
          const { data: store } = await supabase
            .from('medical_stores')
            .select('verification_status')
            .eq('owner_profile_id', data.user.id)
            .maybeSingle();
          if (store) verificationStatus = store.verification_status;
        } else if (userRole === 'DELIVERY_PARTNER') {
          const { data: partner } = await supabase
            .from('delivery_partners')
            .select('verification_status')
            .eq('profile_id', data.user.id)
            .maybeSingle();
          if (partner) verificationStatus = partner.verification_status;
        }
      } catch {
        // Fallback
      }

      if (verificationStatus === 'SUSPENDED' || verificationStatus === 'REJECTED') {
        await supabase.auth.signOut();
        return {
          error: new Error(`Your ${getRoleDisplayName(userRole).toLowerCase()} account is currently ${verificationStatus}. Please contact support.`),
        };
      }

      return { error: null, role: userRole, verificationStatus };
    })();

    try {
      const res = await Promise.race([authPromise, timeoutPromise]);
      return res;
    } catch (timeoutErr: any) {
      try {
        await supabase.auth.signOut();
      } catch {}
      return { error: timeoutErr || new Error('Login timed out. Please try again.') };
    }
  };

  // Sign Up Customer
  const signUpCustomer = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => {
    const { data: authResult, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: 'CUSTOMER',
        },
      },
    });

    if (error) return { error };

    if (authResult.user && data.address && data.pincode) {
      try {
        await supabase.from('addresses').insert({
          profile_id: authResult.user.id,
          label: 'Default Address',
          full_name: data.fullName,
          phone: data.phone,
          address_line_1: data.address,
          city: data.city || 'New Delhi',
          state: data.state || 'Delhi',
          pincode: data.pincode,
          is_default: true,
        });
      } catch {}
    }

    return { error: null };
  };

  // Sign Up Seller
  const signUpSeller = async (data: {
    ownerName: string;
    storeName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    medicalLicenseNumber: string;
    gstNumber?: string;
    password: string;
  }) => {
    const { data: authResult, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.ownerName,
          phone: data.phone,
          role: 'SELLER',
        },
      },
    });

    if (error || !authResult.user) return { error: error || new Error('Seller registration failed') };

    const userId = authResult.user.id;

    try {
      await supabase.from('profiles').update({ role: 'SELLER' }).eq('id', userId);
      await supabase.from('medical_stores').insert({
        owner_profile_id: userId,
        store_name: data.storeName,
        owner_name: data.ownerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        medical_license_number: data.medicalLicenseNumber,
        gst_number: data.gstNumber || null,
        verification_status: 'PENDING',
        store_status: 'INACTIVE',
      });
    } catch {}

    return { error: null };
  };

  // Sign Up Delivery Partner
  const signUpDeliveryPartner = async (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    password: string;
  }) => {
    const { data: authResult, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: 'DELIVERY_PARTNER',
        },
      },
    });

    if (error || !authResult.user) return { error: error || new Error('Delivery partner registration failed') };

    const userId = authResult.user.id;

    try {
      await supabase.from('profiles').update({ role: 'DELIVERY_PARTNER' }).eq('id', userId);
      await supabase.from('delivery_partners').insert({
        profile_id: userId,
        phone: data.phone,
        vehicle_type: data.vehicleType,
        vehicle_number: data.vehicleNumber,
        license_number: data.licenseNumber,
        verification_status: 'PENDING',
        availability_status: 'OFFLINE',
      });
    } catch {}

    return { error: null };
  };

  // Forgot Password Request
  const resetPasswordRequest = async (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    return { error };
  };

  // Update Password
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setProfile(null);
    setSellerStore(null);
    setDeliveryPartner(null);
    setRole('CUSTOMER');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        sellerStore,
        deliveryPartner,
        role,
        isLoading,
        authError,
        clearAuthError,
        signIn,
        signUpCustomer,
        signUpSeller,
        signUpDeliveryPartner,
        resetPasswordRequest,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
