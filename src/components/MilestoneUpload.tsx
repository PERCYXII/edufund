import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

interface MilestoneUploadProps {
    campaignId: string;
    studentId: string;
    milestonePercentage: number;
    onSuccess: () => void;
}

const MilestoneUpload: React.FC<MilestoneUploadProps> = ({ campaignId, studentId, milestonePercentage, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const toast = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `milestones/${studentId}/${campaignId}_${milestonePercentage}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // Update campaign milestone record
            // If it doesn't exist, the trigger might have created it as 'pending_upload'
            const { data: milestoneRecord } = await supabase
                .from('campaign_milestones')
                .select('id')
                .eq('campaign_id', campaignId)
                .eq('milestone_percentage', milestonePercentage)
                .single();

            if (milestoneRecord) {
                const { error: updateError } = await supabase
                    .from('campaign_milestones')
                    .update({
                        proof_url: publicUrl,
                        status: 'pending_review',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', milestoneRecord.id);

                if (updateError) throw updateError;
            } else {
                // Fallback: create if missing (though trigger should handle it)
                const { error: insertError } = await supabase
                    .from('campaign_milestones')
                    .insert({
                        campaign_id: campaignId,
                        milestone_percentage: milestonePercentage,
                        proof_url: publicUrl,
                        status: 'pending_review'
                    });

                if (insertError) throw insertError;
            }

            toast.success("Milestone proof uploaded successfully! Our team will review it shortly.");
            onSuccess();
        } catch (error: any) {
            console.error("Error uploading milestone proof:", error);
            toast.error("Failed to upload proof: " + (error.message || "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-4">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                Upload Milestone Proof ({milestonePercentage}%)
            </h4>
            <p className="text-sm text-gray-600 mb-6">
                Please upload your most recent university fee statement or proof of payment for the funds received so far.
            </p>

            <div className="space-y-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                        }`}
                >
                    <input
                        type="file"
                        id="milestone-file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="milestone-file" className="cursor-pointer block">
                        {file ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle size={32} className="text-primary-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                <span className="text-xs text-gray-500 mt-1">Click to change file</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Click to upload doc</span>
                                <span className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (max 5MB)</span>
                            </div>
                        )}
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        className="btn btn-primary"
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <span>Submit for Review</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    Once uploaded, the administrative team will review your document. If approved, your campaign will be unpaused and you can continue receiving donations.
                </p>
            </div>
        </div>
    );
};

export default MilestoneUpload;
