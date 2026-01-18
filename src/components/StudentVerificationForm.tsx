import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, GraduationCap, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import type { User } from '../types';

interface StudentVerificationFormProps {
    user: User | null;
    onSuccess: () => void;
}

const StudentVerificationForm: React.FC<StudentVerificationFormProps> = ({ user, onSuccess }) => {
    const toast = useToast();
    const [verificationSubmitting, setVerificationSubmitting] = useState(false);
    const [verificationFormData, setVerificationFormData] = useState({
        idDocument: null as File | null,
        enrollmentDocument: null as File | null,
        feeStatement: null as File | null
    });

    const withTimeout = async <T,>(promise: PromiseLike<T> | Promise<T>, ms: number = 30000): Promise<T> => {
        return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timed out. Please check your internet connection.')), ms))
        ]);
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerificationSubmitting(true);
        try {
            const files = {
                id: verificationFormData.idDocument,
                enrollment: verificationFormData.enrollmentDocument,
                feeStatement: verificationFormData.feeStatement
            };

            for (const [type, file] of Object.entries(files)) {
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `verification/${user?.id}/${type}_${Date.now()}.${fileExt}`;

                    const { error: uploadError, data } = await withTimeout(supabase.storage
                        .from('documents')
                        .upload(fileName, file));

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(data.path);

                    await supabase.from('verification_requests').insert({
                        student_id: user?.id,
                        document_type: type,
                        document_url: publicUrl,
                        status: 'pending'
                    });
                }
            }

            // Update student status
            await supabase
                .from('students')
                .update({ verification_status: 'pending' })
                .eq('id', user?.id);

            // Notify Admins
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const notifs = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'New Verification Request 🛡️',
                    message: `${user?.student?.firstName || 'Student'} has submitted profile verification documents.`,
                    type: 'info'
                }));
                await supabase.from('notifications').insert(notifs);
            }

            toast.success("Verification documents submitted successfully!");
            onSuccess(); // Triggers reload or state update in parent
        } catch (error: any) {
            console.error("Verification submit error:", error);
            toast.error("Failed to submit verification: " + error.message);
        } finally {
            setVerificationSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleVerificationSubmit} className="space-y-8" noValidate>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-lg">
                    <AlertCircle size={20} />
                    Verified Student Advantage
                </h4>
                <p className="text-blue-800">
                    Donors are most likely to fund students who have verified their enrollment status.
                    By uploading your documents, you unlock the full potential of EduFund.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="form-group space-y-2">
                    <label className="form-label font-medium text-gray-700">ID Document / Passport *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors text-center cursor-pointer relative bg-gray-50 hover:bg-white group">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
                            required
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 20 * 1024 * 1024) {
                                        toast.error("File size exceeds 20MB limit.");
                                        e.target.value = '';
                                        return;
                                    }
                                    setVerificationFormData(prev => ({ ...prev, idDocument: file }));
                                }
                            }}
                        />
                        <div className="flex flex-col items-center">
                            <FileText size={32} className="text-gray-400 group-hover:text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                                {verificationFormData.idDocument ? verificationFormData.idDocument.name : 'Click to Upload ID'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">PDF, JPG or PNG</span>
                        </div>
                    </div>
                </div>

                <div className="form-group space-y-2">
                    <label className="form-label font-medium text-gray-700">Proof of Enrollment *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors text-center cursor-pointer relative bg-gray-50 hover:bg-white group">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
                            required
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 20 * 1024 * 1024) {
                                        toast.error("File size exceeds 20MB limit.");
                                        e.target.value = '';
                                        return;
                                    }
                                    setVerificationFormData(prev => ({ ...prev, enrollmentDocument: file }));
                                }
                            }}
                        />
                        <div className="flex flex-col items-center">
                            <GraduationCap size={32} className="text-gray-400 group-hover:text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                                {verificationFormData.enrollmentDocument ? verificationFormData.enrollmentDocument.name : 'Click to Upload Proof'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">Official University Letterhead</span>
                        </div>
                    </div>
                </div>

                <div className="form-group space-y-2 md:col-span-2">
                    <label className="form-label font-medium text-gray-700">Fee Statement (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors text-center cursor-pointer relative bg-gray-50 hover:bg-white group">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 20 * 1024 * 1024) {
                                        toast.error("File size exceeds 20MB limit.");
                                        e.target.value = '';
                                        return;
                                    }
                                    setVerificationFormData(prev => ({ ...prev, feeStatement: file }));
                                }
                            }}
                        />
                        <div className="flex flex-col items-center">
                            <DollarSign size={32} className="text-gray-400 group-hover:text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 flex items-center gap-2">
                                {verificationFormData.feeStatement && <CheckCircle size={16} className="text-green-500" />}
                                {verificationFormData.feeStatement ? verificationFormData.feeStatement.name : 'Click to Upload Fee Statement'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">Latest Financial Statement</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    className="btn btn-primary px-8 py-3 rounded-lg font-semibold shadow-lg shadow-primary-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={verificationSubmitting}
                >
                    {verificationSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Uploading...
                        </div>
                    ) : (
                        'Submit Verification Documents'
                    )}
                </button>
            </div>
        </form>
    );
};

export default StudentVerificationForm;
