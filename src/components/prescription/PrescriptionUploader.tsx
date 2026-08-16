'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface PrescriptionUploaderProps {
  onPrescriptionUploaded: (prescriptionId: string, fileUrl: string) => void;
}

export const PrescriptionUploader: React.FC<PrescriptionUploaderProps> = ({ onPrescriptionUploaded }) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMessage('Prescription file size must be under 10 MB.');
        return;
      }

      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('medirush-prescriptions')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) {
        setErrorMessage(uploadErr.message || 'Prescription upload failed.');
        setIsUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('medirush-prescriptions')
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      // 2. Fetch Customer ID
      const { data: custData } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!custData) {
        setErrorMessage('Customer record missing.');
        setIsUploading(false);
        return;
      }

      // 3. Create Prescription Record
      const { data: rxRecord, error: rxErr } = await supabase
        .from('prescriptions')
        .insert({
          customer_id: custData.id,
          file_url: fileUrl,
          status: 'PENDING',
        })
        .select()
        .single();

      if (rxErr || !rxRecord) {
        setErrorMessage(rxErr?.message || 'Failed to record prescription metadata.');
        setIsUploading(false);
        return;
      }

      setUploadedUrl(fileUrl);
      onPrescriptionUploaded(rxRecord.id, fileUrl);
    } catch {
      setErrorMessage('Error uploading prescription.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <span>Upload Doctor Prescription</span>
        </h3>
        <p className="text-xs text-slate-500">Upload a clear photo or PDF of your doctor&apos;s prescription (JPG, PNG, PDF up to 10MB)</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploadedUrl ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">Prescription Attached & Uploaded Successfully</span>
          </div>

          <button
            onClick={() => {
              setUploadedUrl(null);
              setFile(null);
            }}
            className="text-red-600 font-bold hover:underline text-xs"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-6 text-center space-y-3">
            {filePreview ? (
              <div className="w-32 h-32 mx-auto relative rounded-xl overflow-hidden border border-slate-200">
                <Image src={filePreview} alt="Prescription preview" fill className="object-cover" />
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                <FileText className="w-5 h-5 text-brand-600" />
                <span>{file.name}</span>
              </div>
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            )}

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
          </div>

          {file && (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isUploading}
              onClick={handleUpload}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Confirm & Upload Prescription
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
