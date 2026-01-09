import React, { useState, useEffect } from 'react';
import AdminReports from '../components/AdminReports';
import AdminSettings from '../components/AdminSettings';
import { useNavigate, Link } from 'react-router-dom';
import {
    Home,
    Users,
    GraduationCap,
    Building,
    DollarSign,
    BarChart3,
    Settings,
    Bell,

    FileText,
    CheckCircle,
    XCircle,
    LogOut,
    Eye,
    User,
    Landmark,
    Trash2,
    Edit,
    Archive,
    RotateCcw,
    LayoutDashboard,
    ShieldCheck,
    ArrowLeft,
    Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { supabase } from '../lib/supabase';
import type { VerificationRequest, Student, University, CampaignWithStudent } from '../types';
import DocumentViewerModal from '../components/DocumentViewerModal';
import './AdminDashboard.css';

const REJECTION_REASONS = [
    "Details don't match name",
    "Details don't match student number",
    "Details don't match university name",
    "Details don't match email",
    "Documents are unclear/unreadable",
    "Documents are not certified",
    "Incomplete documentation"
];

// Extended type for frontend display including relationships
interface ExtendedVerification extends VerificationRequest {
    student?: Student & { university?: University };
}

const AdminDashboard: React.FC = () => {
    const { user, isLoading: authLoading, logout } = useAuth();
    const toast = useToast(); // Use the hook directly as 'toast' so toast.success() works
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showNotificationsList, setShowNotificationsList] = useState(false);
    const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // State
    const [verifications, setVerifications] = useState<ExtendedVerification[]>([]);
    const [recentCampaigns, setRecentCampaigns] = useState<CampaignWithStudent[]>([]);
    const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
    const [pendingDonations, setPendingDonations] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]); // New state for transactions tab
    const [universities, setUniversities] = useState<University[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [disabledProfiles, setDisabledProfiles] = useState<any[]>([]);
    const [stats, setStats] = useState({
        pendingVerifications: 0,
        pendingCampaignsCount: 0,
        activeCampaigns: 0,
        totalFunded: 0,
        totalUniversities: 0,
        disabledCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedReason, setSelectedReason] = useState<string>('');

    // Document Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerTitle, setViewerTitle] = useState('Document Preview');


    // Redirect if not admin
    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!authLoading && user?.role === 'admin') {
            fetchDashboardData();
            fetchAdminNotifications();

            // Subscribe to notifications
            const channel = supabase
                .channel('admin-notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    setAdminNotifications(prev => [payload.new, ...prev]);
                })
                .subscribe();

            // Subscribe to campaign changes
            const campaignChannel = supabase
                .channel('admin-campaign-changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'campaigns'
                }, () => {
                    fetchDashboardData();
                })
                .subscribe();

            // Subscribe to verification request changes
            const verifChannel = supabase
                .channel('admin-verif-changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'verification_requests'
                }, () => {
                    fetchDashboardData();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(campaignChannel);
                supabase.removeChannel(verifChannel);
            };
        } else if (!authLoading && (!user || user.role !== 'admin')) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchAdminNotifications = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setAdminNotifications(data);
    };

    const markAllNotificationsAsRead = async () => {
        if (!user) return;
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id);

        setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {

            // 1. Fetch Pending Verifications
            // ... (existing code for verifications) ...

            // 3. Fetch Pending Donations
            const { data: donationsData } = await supabase
                .from('donations')
                .select(`
                *,
                campaign:campaigns (
                    title,
                    student:students (
                        first_name, last_name
                    )
                )
            `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            setPendingDonations(donationsData || []);

            const { data: verifData, error: verifError } = await supabase
                .from('verification_requests')
                .select(`
                    id, student_id, document_type, document_url, id_url, enrollment_url, academic_record_url, fee_statement_url, status, submitted_at,
                    student:students (
                        id, first_name, last_name, university_id, student_number, course, year_of_study, verification_status,
                        university:universities (name)
                    )
                `)
                .eq('status', 'pending');

            if (verifError) throw verifError;

            // Map to ExtendedVerification
            const mappedVerifications: ExtendedVerification[] = (verifData || []).map((v: any) => ({
                id: v.id,
                studentId: v.student_id,
                documentType: v.document_type,
                documentUrl: v.document_url,
                idUrl: v.id_url,
                enrollmentUrl: v.enrollment_url,
                transcriptUrl: v.academic_record_url,
                feeStatementUrl: v.fee_statement_url,
                status: v.status,
                submittedAt: v.submitted_at,
                student: v.student ? {
                    ...v.student,
                    firstName: v.student.first_name,
                    lastName: v.student.last_name,
                    universityId: v.student.university_id,
                    studentNumber: v.student.student_number,
                    yearOfStudy: v.student.year_of_study,
                    verificationStatus: v.student.verification_status,
                    university: v.student.university ? {
                        name: v.student.university.name,
                    } : undefined
                } : undefined
            }));

            setVerifications(mappedVerifications);

            // 2a. Fetch Pending Campaigns (Explicitly)
            const { data: pendingData } = await supabase
                .from('campaigns')
                .select(`
                    *,
                    student:students (
                        first_name, last_name, course, student_number,
                        university:universities (name)
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            // 2b. Fetch Recent Active/Other Campaigns
            const { data: recentData } = await supabase
                .from('campaigns')
                .select(`
                    *,
                    student:students (
                        first_name, last_name, course, student_number,
                        university:universities (name)
                    )
                `)
                .neq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(10);

            // Process Pending
            if (pendingData) {
                // Fetch verification docs for these students to display in the dashboard
                const studentIds = pendingData.map((c: any) => c.student_id).filter(id => id);

                let campaignDocs: any[] = [];
                if (studentIds.length > 0) {
                    const { data: docs } = await supabase
                        .from('verification_requests')
                        .select('student_id, id_url, enrollment_url, academic_record_url, fee_statement_url')
                        .in('student_id', studentIds)
                        .order('created_at', { ascending: false });

                    if (docs) campaignDocs = docs;
                }

                const mappedPending: any[] = pendingData.map((c: any) => {
                    // Find matching docs (stats with most recent due to order)
                    const doc = campaignDocs.find(d => d.student_id === c.student_id);

                    return {
                        id: c.id,
                        studentId: c.student_id,
                        goal: c.goal_amount || 0,
                        raised: c.raised_amount || 0,
                        isUrgent: c.is_urgent,
                        title: c.title,
                        status: c.status,
                        images: c.images,
                        // Use campaign specific doc if available, otherwise fallback to student verification doc
                        feeStatementUrl: c.fee_statement_url || doc?.fee_statement_url,
                        idUrl: c.id_url || doc?.id_url,
                        enrollmentUrl: c.enrollment_url || doc?.enrollment_url,
                        invoiceUrl: c.invoice_url,
                        student: {
                            firstName: c.student?.first_name || 'Unknown',
                            lastName: c.student?.last_name || 'Student',
                            course: c.student?.course || 'N/A',
                            studentNumber: c.student?.student_number || 'N/A',
                            email: c.student?.email || 'N/A',
                            universityName: c.student?.university?.name || 'Unknown'
                        }
                    };
                });
                setPendingCampaigns(mappedPending);
            }

            // Process Recent
            if (recentData) {
                const mappedRecent: any[] = recentData.map((c: any) => ({
                    id: c.id,
                    studentId: c.student_id,
                    goal: c.goal_amount || 0,
                    raised: c.raised_amount || 0,
                    isUrgent: c.is_urgent,
                    title: c.title,
                    status: c.status,
                    images: c.images,
                    // Docs not strictly specific for recent list but fine to keep consistent if needed
                    student: {
                        firstName: c.student?.first_name || 'Unknown',
                        lastName: c.student?.last_name || 'Student',
                        course: c.student?.course || 'N/A',
                        // Keep recent simple or match
                        studentNumber: c.student?.student_number,
                        email: c.student?.email,
                        universityName: c.student?.university?.name
                    }
                }));
                setRecentCampaigns(mappedRecent);
            }

            // 3. Fetch Pending Donations (already done above, but keeping this block for clarity if it was intended to be separate)
            // const { data: donData } = await supabase
            //     .from('donations')
            //     .select(`
            //         *,
            //         campaign:campaigns (title)
            //     `)
            //     .eq('status', 'pending')
            //     .order('created_at', { ascending: false });

            // if (donData) {
            //     setPendingDonations(donData);
            // }

            // 4. Fetch Universities
            const { data: uniData } = await supabase
                .from('universities')
                .select('*');

            if (uniData) {
                const mappedUnis: University[] = uniData.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    bankName: u.bank_name,
                    accountNumber: u.account_number,
                    branchCode: u.branch_code,
                    accountName: u.account_name
                }));
                setUniversities(mappedUnis);
            }

            // 5. Fetch All Students
            const { data: studentsData } = await supabase
                .from('students')
                .select(`
                    *,
                    university:universities(name),
                    campaigns(id)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (studentsData) {
                const mappedStudents: any[] = studentsData.map((s: any) => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    email: s.email,
                    phone: s.phone,
                    universityId: s.university_id,
                    studentNumber: s.student_number,
                    course: s.course,
                    yearOfStudy: s.year_of_study,
                    verificationStatus: s.verification_status,
                    university: s.university ? { name: s.university.name } : undefined,
                    campaignId: s.campaigns?.[0]?.id
                }));
                setStudents(mappedStudents);
            }

            // 6. Fetch Disabled Profiles
            const { data: disabledData } = await supabase
                .from('disabled_profiles')
                .select('*')
                .order('disabled_at', { ascending: false });

            if (disabledData) {
                setDisabledProfiles(disabledData);
            }

            // 7. Calculate Stats
            const { data: campaignStats } = await supabase
                .from('campaigns')
                .select('raised_amount, status');

            const activeCampaignsData = campaignStats?.filter(c => c.status === 'active') || [];
            const pendingCampaignsData = campaignStats?.filter(c => c.status === 'pending') || [];

            // USE RPC for proper total calculation
            const { data: totalRaisedData, error: rpcError } = await supabase.rpc('get_total_donations');
            let totalFunded = 0;
            if (!rpcError && totalRaisedData !== null) {
                totalFunded = totalRaisedData;
            } else {
                // Fallback
                const { data: donations } = await supabase.from('donations').select('amount');
                totalFunded = donations ? donations.reduce((acc, curr) => acc + curr.amount, 0) : 0;
            }

            // 8. Fetch All Transactions for History Tab
            const { data: allTrans } = await supabase
                .from('donations')
                .select(`
                    *,
                    campaign:campaigns (
                        title,
                        type,
                        student:students (
                            first_name, last_name, student_number,
                            university:universities (name)
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (allTrans) setAllTransactions(allTrans);

            setStats({
                // Stats
                pendingVerifications: mappedVerifications.length + pendingCampaignsData.length + (donationsData?.length || 0), // Include donations
                pendingCampaignsCount: pendingCampaignsData.length,
                activeCampaigns: activeCampaignsData.length,
                totalFunded: totalFunded,
                totalUniversities: uniData?.length || 0,
                disabledCount: disabledData?.length || 0
            });

        } catch (error) {
            console.error("Error fetching admin dashboard data:", error);
            toast.error("Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleApprove = async (id: string) => {
        try {
            // Update request status
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('id', id);

            if (reqError) throw reqError;

            // Update student status
            const verification = verifications.find(v => v.id === id);
            if (verification?.studentId) {
                await supabase
                    .from('students')
                    .update({ verification_status: 'approved' })
                    .eq('id', verification.studentId);
            }

            // Update local state
            setVerifications(prev => prev.filter(v => v.id !== id));
            setStats(prev => ({ ...prev, pendingVerifications: Math.max(0, prev.pendingVerifications - 1) }));
            toast.success("Verification approved!");

        } catch (error) {
            console.error("Error approving verification:", error);
            toast.error("Failed to approve verification.");
        }
    };

    const handleReject = (id: string) => {
        setRejectingId(id);
    };

    const confirmReject = async () => {
        if (!rejectingId || !selectedReason) return;
        try {
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: selectedReason,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', rejectingId);

            if (reqError) throw reqError;

            // Get verification details to find student ID
            const verification = verifications.find(v => v.id === rejectingId);

            if (verification?.studentId) {
                // Update student status
                await supabase
                    .from('students')
                    .update({ verification_status: 'rejected' })
                    .eq('id', verification.studentId);

                // Automatically reject any pending campaigns for this student
                // since their identity/verification was rejected
                await supabase
                    .from('campaigns')
                    .update({ status: 'rejected' })
                    .eq('student_id', verification.studentId)
                    .eq('status', 'pending');
            }

            setVerifications(prev => prev.filter(v => v.id !== rejectingId));
            setStats(prev => ({ ...prev, pendingVerifications: Math.max(0, prev.pendingVerifications - 1) }));
            setRejectingId(null);
            setSelectedReason('');
            toast.success("Verification rejected.");

            // Refresh to see campaign status changes
            fetchDashboardData();
        } catch (error) {
            console.error("Error rejecting verification:", error);
            toast.error("Failed to reject verification.");
        }
    };

    const handleEditUniversity = async (uni: University) => {
        const newName = prompt("New University Name:", uni.name);
        if (!newName) return;

        try {
            const { error } = await supabase
                .from('universities')
                .update({ name: newName })
                .eq('id', uni.id);

            if (error) throw error;
            setUniversities(prev => prev.map(u => u.id === uni.id ? { ...u, name: newName } : u));
            toast.success("University name updated.");
        } catch (error) {
            console.error("Error editing university:", error);
            toast.error("Failed to edit university.");
        }
    };

    const handleDeleteUniversity = async (id: string) => {
        if (!confirm("Are you sure you want to delete this university? All associated students will lose their university link.")) return;

        try {
            const { error } = await supabase
                .from('universities')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setUniversities(prev => prev.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, totalUniversities: prev.totalUniversities - 1 }));
            toast.success("University deleted.");
        } catch (error) {
            console.error("Error deleting university:", error);
            toast.error("Failed to delete university. It might have linked students.");
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!confirm("Are you sure you want to disable this student profile? It will be moved to the archive and can be restored within 60 days.")) return;

        try {
            // Reset status to pending before archiving - this ensures if they are restored, they need re-approval
            await supabase
                .from('students')
                .update({ verification_status: 'pending' })
                .eq('id', id);

            const { error } = await supabase.rpc('archive_profile', { p_user_id: id });

            if (error) throw error;

            setStudents(prev => prev.filter(s => s.id !== id));
            toast.success("Profile disabled and moved to archive successfully.");

            // Re-fetch dashboard data to update stats if necessary
            fetchDashboardData();
        } catch (error) {
            console.error("Error archiving student:", error);
            toast.error("Failed to archive student profile.");
        }
    };

    const handleApproveDonation = async (donation: any) => {
        if (!confirm(`Confirm receipt of R${donation.amount}?`)) return;

        try {
            // 1. Update Donation Status
            const { error: donationError } = await supabase
                .from('donations')
                .update({ status: 'received' }) // 'received' implies approved/completed
                .eq('id', donation.id);

            if (donationError) throw donationError;

            // 2. Update Campaign Raised Amount (if applicable)
            if (donation.campaign_id) {
                const { data: campaignData, error: fetchError } = await supabase
                    .from('campaigns')
                    .select('raised_amount')
                    .eq('id', donation.campaign_id)
                    .single();

                if (!fetchError && campaignData) {
                    const newAmount = (campaignData.raised_amount || 0) + donation.amount;
                    await supabase
                        .from('campaigns')
                        .update({ raised_amount: newAmount })
                        .eq('id', donation.campaign_id);
                }
            }

            toast.success("Donation approved successfully.");
            fetchDashboardData();
        } catch (error: any) {
            console.error("Error approving donation:", error);
            toast.error("Failed to approve donation.");
        }
    };

    const handleRejectDonation = async (id: string) => {
        if (!confirm("Reject this donation?")) return;
        try {
            const { error } = await supabase
                .from('donations')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;
            toast.success("Donation rejected.");
            fetchDashboardData();
        } catch (error: any) {
            toast.error("Failed to reject donation.");
        }
    };

    const handleApproveCampaign = async (id: string) => {
        try {
            // Get campaign details first
            const campaign = pendingCampaigns.find(c => c.id === id) || recentCampaigns.find(c => c.id === id);

            if (!campaign) {
                console.error("Campaign not found");
                return;
            }

            // 1. Approve Campaign
            const { error: campError } = await supabase
                .from('campaigns')
                .update({ status: 'active' })
                .eq('id', id);

            if (campError) throw campError;

            // 2. Approve Student (Verification)
            const { error: studError } = await supabase
                .from('students')
                .update({ verification_status: 'approved' })
                .eq('id', campaign.studentId);

            if (studError) console.error("Error verifying student:", studError);

            // 3. Auto-approve any pending verification requests for this student
            // This ensures they are removed from the "Pending Verifications" list
            await supabase
                .from('verification_requests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('student_id', campaign.studentId)
                .eq('status', 'pending');

            // 4. Notify student
            await supabase.from('notifications').insert({
                user_id: campaign.studentId,
                title: 'Campaign Approved!',
                message: `Your campaign "${campaign.title}" has been approved and is now live! Your account has been verified.`,
                type: 'success'
            });

            fetchDashboardData();
            toast.success("Campaign approved and published!");
        } catch (error) {
            console.error("Error approving campaign:", error);
            toast.error("Failed to approve campaign.");
        }
    };

    const handleRejectCampaign = async (id: string) => {
        const reason = prompt("Please provide a reason for rejecting this campaign:");
        if (!reason) return;

        try {
            // Get campaign details first
            const campaign = pendingCampaigns.find(c => c.id === id) || recentCampaigns.find(c => c.id === id);

            if (!campaign) {
                console.error("Campaign not found");
                return;
            }

            // 1. Reject Campaign
            const { error: campError } = await supabase
                .from('campaigns')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (campError) throw campError;

            // 2. Reject Student (Verification)
            const { error: studError } = await supabase
                .from('students')
                .update({ verification_status: 'rejected' })
                .eq('id', campaign.studentId);

            if (studError) console.error("Error rejecting student:", studError);

            // 3. Auto-reject pending verification requests
            await supabase
                .from('verification_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: `Campaign rejected: ${reason}`,
                    reviewed_at: new Date().toISOString()
                })
                .eq('student_id', campaign.studentId)
                .eq('status', 'pending');

            // 4. Notify student
            await supabase.from('notifications').insert({
                user_id: campaign.studentId,
                title: 'Campaign Rejected',
                message: `Your campaign "${campaign.title}" was not approved. Reason: ${reason}. Please update your documents and try again.`,
                type: 'error'
            });

            fetchDashboardData();
            toast.success("Campaign rejected.");
        } catch (error) {
            console.error("Error rejecting campaign:", error);
            toast.error("Failed to reject campaign.");
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        // Search in both active and pending campaigns
        const campaign = recentCampaigns.find(c => c.id === id) || pendingCampaigns.find(c => c.id === id);
        if (!campaign) return;

        if (!confirm(`Are you sure you want to delete the campaign "${campaign.title}"?`)) return;

        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Reset student verification status
            if (campaign.studentId) {
                await supabase
                    .from('students')
                    .update({ verification_status: 'pending' })
                    .eq('id', campaign.studentId);
            }

            // Notify Student
            await supabase.from('notifications').insert({
                user_id: campaign.studentId,
                title: 'Campaign Deleted by Admin',
                message: `Your campaign "${campaign.title}" has been deleted by an administrator.`,
                type: 'warning'
            });

            // Update both state arrays
            setRecentCampaigns(prev => prev.filter(c => c.id !== id));
            setPendingCampaigns(prev => prev.filter(c => c.id !== id));

            // Refresh stats
            fetchDashboardData();
            toast.success("Campaign deleted.");
        } catch (error) {
            console.error("Error deleting campaign:", error);
            toast.error("Failed to delete campaign. This may be due to active donations or server restrictions.");
        }
    };


    const handleViewDocument = async (urlOrPath: string, docTitle: string = 'Document Preview') => {
        if (!urlOrPath) return;

        let bucket = 'documents';
        let path = urlOrPath;

        // Handle full URLs
        if (urlOrPath.startsWith('http')) {
            try {
                if (urlOrPath.includes('/invoices/')) {
                    bucket = 'invoices';
                    path = urlOrPath.split('/invoices/')[1];
                } else if (urlOrPath.includes('/documents/')) {
                    bucket = 'documents';
                    path = urlOrPath.split('/documents/')[1];
                }
            } catch (e) {
                console.error("Error parsing URL:", e);
            }
        }

        path = decodeURIComponent(path);

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, 60 * 60);

            if (error) throw error;

            if (data?.signedUrl) {
                setViewerUrl(data.signedUrl);
                setViewerTitle(docTitle);
                setViewerOpen(true);
            } else {
                toast.error("Could not generate secure link for this document.");
            }
        } catch (error) {
            console.error("Error viewing document:", error);
            toast.error("Could not open document. Please try again.");
        }
    };

    const handleViewStudent = (student: any) => {
        if (student.campaignId) {
            navigate(`/campaign/${student.campaignId}`);
        } else {
            toast.error(`${student.firstName} ${student.lastName} does not have an active campaign yet.`);
        }
    };

    const handleRestoreProfile = async (archiveId: string) => {
        if (!confirm("Are you sure you want to restore this profile?")) return;

        try {
            const { error } = await supabase.rpc('restore_profile', { p_disabled_id: archiveId });

            if (error) throw error;

            toast.success("Profile restored successfully.");
            fetchDashboardData();
        } catch (error) {
            console.error("Error restoring profile:", error);
            toast.error("Failed to restore profile.");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="admin-loading-overlay">
                <div className="admin-loading-content">
                    <div className="admin-loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                    <img src="/images/logo.png" alt="UniFund" className="admin-loading-logo" />
                    <h2 className="admin-loading-title">Loading Admin Dashboard</h2>
                    <p className="admin-loading-text">Please wait while we fetch your data...</p>
                    <div className="admin-loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    if (user && user.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <XCircle size={40} className="text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        You do not have permission to view this page. This area is restricted to administrators only.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/" className="btn btn-primary px-8 py-3 rounded-xl shadow-lg border-none hover:bg-primary-700 transition-colors bg-primary-600 text-white font-medium">
                            Return to Home
                        </Link>
                        <button onClick={handleLogout} className="btn btn-outline px-8 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="admin-page">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <Link to="/">
                        <img src="/images/logo.png" alt="UniFund Admin" className="admin-brand-image" />
                    </Link>
                </div>

                <div className="px-6 mb-4">
                    <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium p-2 rounded-md hover:bg-primary-50">
                        <Home size={16} />
                        Back to Website
                    </Link>
                </div>

                <div className="admin-sidebar-user-profile">
                    <div className="admin-sidebar-avatar">
                        AD
                    </div>
                    <div className="admin-sidebar-user-info">
                        <span className="admin-sidebar-user-name">Administrator</span>
                        <span className="admin-sidebar-user-role">Super Admin</span>
                    </div>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'verifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('verifications')}
                    >
                        <ShieldCheck size={20} />
                        Pending Verifications
                        {verifications.length > 0 && (
                            <span className="nav-badge">{verifications.length}</span>
                        )}
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'donations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('donations')}
                    >
                        <DollarSign size={20} />
                        Pending Donations
                        {pendingDonations.length > 0 && (
                            <span className="nav-badge">{pendingDonations.length}</span>
                        )}
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}
                    >
                        <Users size={20} strokeWidth={1.5} />
                        Students
                    </button>

                    <button
                        className={`admin-nav-item ${activeTab === 'archive' ? 'active' : ''}`}
                        onClick={() => setActiveTab('archive')}
                    >
                        <Archive size={20} strokeWidth={1.5} />
                        Archive
                        {stats.disabledCount > 0 && <span className="nav-badge">{stats.disabledCount}</span>}
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'universities' ? 'active' : ''}`}
                        onClick={() => setActiveTab('universities')}
                    >
                        <Building size={20} />
                        Universities
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        <DollarSign size={20} />
                        Transactions
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <BarChart3 size={20} />
                        Reports
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={20} />
                        Settings
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout" onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title="Toggle Menu"
                        >
                            <Menu size={24} />
                        </button>
                        {activeTab !== 'dashboard' && (
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className="mobile-back-btn"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div>
                            <h1 className="admin-page-title">
                                {activeTab === 'dashboard' && 'Admin Dashboard'}
                                {activeTab === 'verifications' && 'Pending Student Verifications'}
                                {activeTab === 'donations' && 'Pending Donations'}
                                {activeTab === 'students' && 'Manage Students'}
                                {activeTab === 'universities' && 'Partner Universities'}
                                {activeTab === 'transactions' && 'Transaction History'}
                                {activeTab === 'reports' && 'Platform Reports'}
                                {activeTab === 'settings' && 'Admin Settings'}
                                {activeTab === 'archive' && 'Archived Users'}
                            </h1>
                            <p className="admin-page-subtitle">Manage student verifications and platform operations</p>
                        </div>
                    </div>
                    <div className="admin-header-right">
                        <button
                            className="admin-notification-btn"
                            onClick={() => {
                                setShowNotificationsList(!showNotificationsList);
                                if (!showNotificationsList) markAllNotificationsAsRead();
                            }}
                        >
                            <Bell size={20} />
                            {adminNotifications.filter(n => !n.read).length > 0 && (
                                <span className="notification-count">
                                    {adminNotifications.filter(n => !n.read).length}
                                </span>
                            )}

                            {showNotificationsList && (
                                <NotificationsDropdown onClose={() => setShowNotificationsList(false)} />
                            )}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="admin-content">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Stats Grid */}
                            <div className="admin-stats-grid">
                                <div
                                    className="admin-stat-card warning clickable"
                                    onClick={() => setActiveTab('verifications')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="admin-stat-icon">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="admin-stat-info">
                                        <span className="admin-stat-value">{stats.pendingVerifications}</span>
                                        <span className="admin-stat-label">Pending Verifications</span>
                                    </div>
                                    <span className="admin-stat-tag">Action Needed</span>
                                </div>

                                <div
                                    className="admin-stat-card primary clickable"
                                    onClick={() => setActiveTab('verifications')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="admin-stat-icon">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div className="admin-stat-info">
                                        <span className="admin-stat-value">{pendingCampaigns.length}</span>
                                        <span className="admin-stat-label">Pending Campaigns</span>
                                    </div>
                                    <span className="admin-stat-tag">To Review</span>
                                </div>

                                <div
                                    className="admin-stat-card success clickable"
                                    onClick={() => setActiveTab('donations')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="admin-stat-icon">
                                        <DollarSign size={24} />
                                    </div>
                                    <div className="admin-stat-info">
                                        <span className="admin-stat-value">{pendingDonations.length}</span>
                                        <span className="admin-stat-label">Pending Donations</span>
                                    </div>
                                    <span className="admin-stat-tag">Verify Payment</span>
                                </div>

                                <div
                                    className="admin-stat-card info clickable"
                                    onClick={() => setActiveTab('transactions')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="admin-stat-icon">
                                        <BarChart3 size={24} />
                                    </div>
                                    <div className="admin-stat-info">
                                        <span className="admin-stat-value">
                                            R{stats.totalFunded > 1000000
                                                ? (stats.totalFunded / 1000000).toFixed(1) + 'M'
                                                : stats.totalFunded.toLocaleString()}
                                        </span>
                                        <span className="admin-stat-label">Total Raised</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="admin-section">
                                <h2 className="admin-section-title">Pending Verifications</h2>
                                {verifications.length > 0 ? (
                                    <div className="admin-table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>University</th>
                                                    <th>Document</th>
                                                    <th>Submitted</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {verifications.slice(0, 3).map((verification) => (
                                                    <tr key={verification.id}>
                                                        <td>
                                                            <div className="student-cell">
                                                                <div className="student-avatar-table">
                                                                    {verification.student?.firstName?.[0]}{verification.student?.lastName?.[0]}
                                                                </div>
                                                                <div className="student-info-table">
                                                                    <span className="student-name-table">
                                                                        {verification.student?.firstName} {verification.student?.lastName}
                                                                    </span>
                                                                    <span className="student-email-table">{verification.student?.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="university-cell">
                                                                <span>{verification.student?.university?.name || 'Unknown'}</span>
                                                                <span className="student-course-table">{verification.student?.course}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="document-link"
                                                                onClick={() => handleViewDocument(verification.documentUrl)}
                                                            >
                                                                <FileText size={16} />
                                                                {verification.documentType}
                                                            </button>
                                                        </td>
                                                        <td>{new Date(verification.submittedAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="action-btn approve"
                                                                    onClick={() => handleApprove(verification.id)}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    onClick={() => handleReject(verification.id)}
                                                                >
                                                                    <XCircle size={16} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <CheckCircle size={48} className="empty-icon" />
                                        <h3>All caught up!</h3>
                                        <p>No pending verifications at the moment.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pending Donations */}
                            <div className="admin-section">
                                <h2 className="admin-section-title">Pending Donations (Proofs)</h2>
                                {pendingDonations.length > 0 ? (
                                    <div className="admin-table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Donor</th>
                                                    <th>Campaign</th>
                                                    <th>Amount</th>
                                                    <th>Proof</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingDonations.map((donation) => (
                                                    <tr key={donation.id}>
                                                        <td>{donation.guest_name || 'Anonymous'}</td>
                                                        <td>{donation.campaign?.title || 'Unknown'}</td>
                                                        <td className="font-bold">R{donation.amount}</td>
                                                        <td>
                                                            {donation.proof_of_payment_url && (
                                                                <button
                                                                    className="document-link-pill"
                                                                    onClick={() => handleViewDocument(donation.proof_of_payment_url)}
                                                                >
                                                                    <FileText size={14} /> View Proof
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td>{new Date(donation.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="action-btn approve"
                                                                    onClick={() => handleApproveDonation(donation.id)}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    onClick={() => handleRejectDonation(donation.id)}
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <CheckCircle size={48} className="empty-icon" />
                                        <h3>No pending donations</h3>
                                        <p>Everything is verified.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pending Campaigns (Awaiting Approval) */}
                            <div className="admin-section">
                                <h2 className="admin-section-title">
                                    Pending Campaigns
                                    {pendingCampaigns.length > 0 && (
                                        <span className="badge-count">{pendingCampaigns.length}</span>
                                    )}
                                </h2>
                                {pendingCampaigns.length > 0 ? (
                                    <div className="admin-table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Campaign</th>
                                                    <th>Student</th>
                                                    <th>Goal</th>
                                                    <th>Type</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingCampaigns.map((campaign) => (
                                                    <tr key={campaign.id}>
                                                        <td>
                                                            <div className="campaign-cell">
                                                                <div className="campaign-thumb">
                                                                    {campaign.images?.[0] ? (
                                                                        <img src={campaign.images[0]} alt={campaign.title} />
                                                                    ) : (
                                                                        <GraduationCap size={20} />
                                                                    )}
                                                                </div>
                                                                <span className="campaign-title-cell">{campaign.title}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {campaign.student.firstName} {campaign.student.lastName}
                                                        </td>
                                                        <td className="font-bold">R{campaign.goal.toLocaleString()}</td>
                                                        <td>
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`campaign-type-badge ${campaign.isUrgent ? 'urgent' : 'standard'}`}>
                                                                    {campaign.isUrgent ? 'Quick Assist' : 'Standard'}
                                                                </span>
                                                                <div className="flex gap-1 mt-1">
                                                                    {campaign.idUrl && (
                                                                        <button
                                                                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 flex items-center gap-1"
                                                                            onClick={() => handleViewDocument(campaign.idUrl!, "ID Document")}
                                                                            title="View ID"
                                                                        >
                                                                            <FileText size={10} /> ID
                                                                        </button>
                                                                    )}
                                                                    {campaign.feeStatementUrl && (
                                                                        <button
                                                                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 flex items-center gap-1"
                                                                            onClick={() => handleViewDocument(campaign.feeStatementUrl!, "Fee Statement")}
                                                                            title="View Fee Statement"
                                                                        >
                                                                            <FileText size={10} /> Fees
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="view-btn"
                                                                    title="View Campaign"
                                                                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    className="action-btn approve"
                                                                    onClick={() => handleApproveCampaign(campaign.id)}
                                                                    title="Approve & Publish"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    onClick={() => handleRejectCampaign(campaign.id)}
                                                                    title="Reject Campaign"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <CheckCircle size={48} className="empty-icon" />
                                        <h3>No pending campaigns</h3>
                                        <p>All campaigns have been reviewed.</p>
                                    </div>
                                )}
                            </div>

                            {/* Recent Campaigns */}
                            <div className="admin-section">
                                <h2 className="admin-section-title">Recent Campaigns</h2>
                                <div className="campaigns-list">
                                    {recentCampaigns.map((campaign) => (
                                        <div key={campaign.id} className="campaign-row">
                                            <div className="campaign-row-left">
                                                <div className="campaign-avatar-sm">
                                                    <User size={20} strokeWidth={1.5} />
                                                </div>
                                                <div className="campaign-info-row">
                                                    <span className="campaign-name-row">
                                                        {campaign.student.firstName} {campaign.student.lastName}
                                                    </span>
                                                    <span className="campaign-course-row">{campaign.student.course}</span>
                                                </div>
                                            </div>
                                            <div className="campaign-row-center">
                                                <div className="mini-progress">
                                                    <div
                                                        className="mini-progress-fill"
                                                        style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="campaign-progress-text">
                                                    R{campaign.raised.toLocaleString()} / R{campaign.goal.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="campaign-row-right">
                                                <span className={`campaign-status ${campaign.isUrgent ? 'urgent' : 'active'}`}>
                                                    {campaign.isUrgent ? 'Urgent' : 'Active'}
                                                </span>
                                                <div className="action-buttons">
                                                    <button
                                                        className="view-btn"
                                                        title="View details"
                                                        onClick={() => navigate(`/campaign/${campaign.id}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn reject"
                                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                                        title="Delete Campaign"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Verifications Tab */}
                    {activeTab === 'verifications' && (
                        <div className="admin-section">
                            {/* NEW: Pending Campaigns Section */}
                            {pendingCampaigns.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Campaign Verifications needed</h3>
                                    <div className="admin-table-wrapper mb-6">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>University</th>
                                                    <th>Documents</th>
                                                    <th>Campaign</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingCampaigns.map((campaign) => (
                                                    <tr key={campaign.id}>
                                                        <td>
                                                            <div className="student-cell">
                                                                <div className="student-avatar-table">
                                                                    {campaign.student?.firstName?.[0]}{campaign.student?.lastName?.[0]}
                                                                </div>
                                                                <div className="student-info-table">
                                                                    <span className="student-name-table">
                                                                        {campaign.student?.firstName} {campaign.student?.lastName}
                                                                    </span>
                                                                    <span className="student-email-table">{campaign.student?.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="university-cell">
                                                                <span>{campaign.student?.universityName}</span>
                                                                <span className="student-course-table">{campaign.student?.course}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="document-stack">
                                                                {campaign.feeStatementUrl && (
                                                                    <button className="document-link-pill" onClick={() => handleViewDocument(campaign.feeStatementUrl)} title="Fee Statement">
                                                                        <FileText size={14} /> Fees
                                                                    </button>
                                                                )}
                                                                {campaign.idUrl && (
                                                                    <button className="document-link-pill" onClick={() => handleViewDocument(campaign.idUrl)} title="ID Document">
                                                                        <FileText size={14} /> ID
                                                                    </button>
                                                                )}
                                                                {campaign.enrollmentUrl && (
                                                                    <button className="document-link-pill" onClick={() => handleViewDocument(campaign.enrollmentUrl)} title="Enrollment">
                                                                        <FileText size={14} /> Enroll
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>{campaign.title}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button className="view-btn" onClick={() => navigate(`/campaign/${campaign.id}`)} title="View Details">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button className="action-btn approve" onClick={() => handleApproveCampaign(campaign.id)} title="Approve">
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button className="action-btn reject" onClick={() => handleRejectCampaign(campaign.id)} title="Reject">
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Existing Verifications Table */}
                            {verifications.length > 0 ? (
                                <div className="admin-table-wrapper">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Other Verifications</h3>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>University</th>
                                                <th>Stud. Number</th>
                                                <th>Documents</th>
                                                <th>Submitted</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {verifications.map((verification) => (
                                                <tr key={verification.id}>
                                                    <td>
                                                        <div className="student-cell">
                                                            <div className="student-avatar-table">
                                                                {verification.student?.firstName?.[0]}{verification.student?.lastName?.[0]}
                                                            </div>
                                                            <div className="student-info-table">
                                                                <span className="student-name-table">
                                                                    {verification.student?.firstName} {verification.student?.lastName}
                                                                </span>
                                                                <span className="student-email-table">{verification.student?.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="university-cell">
                                                            <span>{verification.student?.university?.name || 'Unknown'}</span>
                                                            <span className="student-course-table">{verification.student?.course}</span>
                                                        </div>
                                                    </td>
                                                    <td className="mono">{verification.student?.studentNumber}</td>
                                                    <td>
                                                        <div className="document-stack">
                                                            {verification.idUrl && (
                                                                <button
                                                                    className="document-link-pill"
                                                                    onClick={() => handleViewDocument(verification.idUrl!)}
                                                                    title="Certified ID"
                                                                >
                                                                    <FileText size={14} /> ID
                                                                </button>
                                                            )}
                                                            {verification.enrollmentUrl && (
                                                                <button
                                                                    className="document-link-pill"
                                                                    onClick={() => handleViewDocument(verification.enrollmentUrl!)}
                                                                    title="Certified Enrollment"
                                                                >
                                                                    <FileText size={14} /> Enrollment
                                                                </button>
                                                            )}
                                                            {verification.transcriptUrl && (
                                                                <button
                                                                    className="document-link-pill"
                                                                    onClick={() => handleViewDocument(verification.transcriptUrl!)}
                                                                    title="Certified Academic Record"
                                                                >
                                                                    <FileText size={14} /> Academic
                                                                </button>
                                                            )}
                                                            {verification.feeStatementUrl && (
                                                                <button
                                                                    className="document-link-pill"
                                                                    onClick={() => handleViewDocument(verification.feeStatementUrl!)}
                                                                    title="Fee Statement"
                                                                >
                                                                    <FileText size={14} /> Fees
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{new Date(verification.submittedAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn approve"
                                                                onClick={() => handleApprove(verification.id)}
                                                            >
                                                                <CheckCircle size={16} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="action-btn reject"
                                                                onClick={() => handleReject(verification.id)}
                                                            >
                                                                <XCircle size={16} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                pendingCampaigns.length === 0 && (
                                    <div className="empty-state">
                                        <CheckCircle size={48} className="empty-icon" />
                                        <h3>All caught up!</h3>
                                        <p>No pending verifications at the moment.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* Donations Tab */}
                    {activeTab === 'donations' && (
                        <div className="admin-section">
                            <h2 className="section-title">Pending Donations</h2>
                            {pendingDonations.length > 0 ? (
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Donor</th>
                                                <th>Amount</th>
                                                <th>Campaign / Type</th>
                                                <th>Proof</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingDonations.map((donation) => (
                                                <tr key={donation.id}>
                                                    <td>
                                                        <div className="font-medium text-gray-900">
                                                            {donation.is_anonymous ? 'Anonymous' : donation.guest_name || 'Guest'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{donation.guest_email}</div>
                                                    </td>
                                                    <td className="font-bold text-emerald-600">
                                                        R{donation.amount.toLocaleString()}
                                                    </td>
                                                    <td>
                                                        {donation.campaign_id ? (
                                                            <div>
                                                                <div className="text-sm font-medium">{donation.campaign?.title}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    By {donation.campaign?.student?.first_name} {donation.campaign?.student?.last_name}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="badge bg-purple-100 text-purple-700">Platform Tip</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {donation.proof_of_payment_url ? (
                                                            <button
                                                                onClick={() => handleViewDocument(donation.proof_of_payment_url)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                                            >
                                                                <FileText size={14} /> View Proof
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 italic">No proof</span>
                                                        )}
                                                    </td>
                                                    <td>{new Date(donation.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn approve"
                                                                onClick={() => handleApproveDonation(donation)}
                                                                title="Confirm Receipt"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                className="action-btn reject"
                                                                onClick={() => handleRejectDonation(donation.id)}
                                                                title="Reject"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <CheckCircle size={48} className="empty-icon" />
                                    <h3>No pending donations</h3>
                                    <p>All donations have been processed.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Universities Tab */}
                    {activeTab === 'universities' && (
                        <div className="admin-section">
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>University</th>
                                            <th>Bank</th>
                                            <th>Account Name</th>
                                            <th>Account Number</th>
                                            <th>Branch Code</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {universities.map((university) => (
                                            <tr key={university.id}>
                                                <td>
                                                    <div className="university-name-cell">
                                                        <div className="university-icon-sm">
                                                            <Landmark size={20} strokeWidth={1.5} />
                                                        </div>
                                                        {university.name}
                                                    </div>
                                                </td>
                                                <td>{university.bankName}</td>
                                                <td>{university.accountName}</td>
                                                <td className="mono">{university.accountNumber}</td>
                                                <td className="mono">{university.branchCode}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleEditUniversity(university)}
                                                        >
                                                            <Edit size={16} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="action-btn reject"
                                                            onClick={() => handleDeleteUniversity(university.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <div className="admin-section">
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>University</th>
                                            <th>Stud. Number</th>
                                            <th>Course</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student: any) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <div className="student-cell">
                                                        <div className="student-avatar-table">
                                                            {student.firstName?.[0]}{student.lastName?.[0]}
                                                        </div>
                                                        <div className="student-info-table">
                                                            <span className="student-name-table">
                                                                {student.firstName} {student.lastName}
                                                            </span>
                                                            <span className="student-email-table">{student.phone || 'No Phone'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{student.university?.name || 'Unknown'}</td>
                                                <td className="mono">{student.studentNumber}</td>
                                                <td>{student.course}</td>
                                                <td>
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`status-badge ${student.verificationStatus === 'approved' ? 'verified' : student.verificationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
                                                            {student.verificationStatus}
                                                        </span>
                                                        {pendingCampaigns.some(c => c.studentId === student.id) && (
                                                            <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 whitespace-nowrap">
                                                                Pending Campaign
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleViewStudent(student)}
                                                        >
                                                            <Eye size={16} />
                                                            View
                                                        </button>
                                                        <button
                                                            className="action-btn reject"
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {activeTab === 'archive' && (
                        <div className="admin-section">
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Disabled At</th>
                                            <th>Permanent Deletion In</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disabledProfiles.map((profile: any) => {
                                            const daysLeft = Math.max(0, Math.ceil((new Date(profile.scheduled_deletion_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                                            const userData = profile.user_data || {};
                                            return (
                                                <tr key={profile.id}>
                                                    <td>
                                                        <div className="student-cell">
                                                            <div className="student-avatar-table">
                                                                {userData.first_name?.[0]}{userData.last_name?.[0]}
                                                            </div>
                                                            <div className="student-info-table">
                                                                <span className="student-name-table">
                                                                    {userData.first_name} {userData.last_name}
                                                                </span>
                                                                <span className="student-email-table">{profile.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="capitalize">{profile.role}</td>
                                                    <td>{new Date(profile.disabled_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={daysLeft < 7 ? 'text-red-500 font-bold' : ''}>
                                                            {daysLeft} days
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn edit"
                                                                onClick={() => handleRestoreProfile(profile.id)}
                                                            >
                                                                <RotateCcw size={16} />
                                                                Restore
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {disabledProfiles.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                                    No archived profiles.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Other Tabs - Placeholder */}
                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="admin-section">
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Donor</th>
                                            <th>Details</th>
                                            <th>Amount</th>
                                            <th>Reference</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allTransactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.created_at).toLocaleDateString()} <span className="text-gray-400 text-xs">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{tx.guest_name || 'Anonymous'}</span>
                                                        <span className="text-xs text-gray-500">{tx.guest_email || 'No email'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {tx.campaign ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">Campaign Donation</span>
                                                            <span className="text-xs text-gray-500">To: {tx.campaign.student?.first_name} ({tx.campaign.title})</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-primary-600">Platform Support</span>
                                                            <span className="text-xs text-gray-500">Direct Donation</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="font-bold text-gray-900">R{tx.amount.toLocaleString()}</td>
                                                <td className="mono text-xs">{tx.payment_reference || '-'}</td>
                                                <td>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'received' ? 'bg-green-100 text-green-800' :
                                                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {tx.status === 'received' ? 'Completed' : tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {allTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <AdminReports transactions={allTransactions} stats={stats} />
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <AdminSettings />
                    )}
                </div>
            </main>

            {rejectingId && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <h3>Reject Verification</h3>
                            <button className="close-modal" onClick={() => setRejectingId(null)}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="mb-4">Please select a reason for rejecting this verification request:</p>
                            <div className="rejection-reasons-grid">
                                {REJECTION_REASONS.map((reason) => (
                                    <label key={reason} className={`reason-pill ${selectedReason === reason ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="rejectionReason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="hidden-radio"
                                        />
                                        {reason}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="btn btn-secondary" onClick={() => setRejectingId(null)}>Cancel</button>
                            <button
                                className="btn btn-primary btn-error"
                                disabled={!selectedReason}
                                onClick={confirmReject}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DocumentViewerModal
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                url={viewerUrl}
                title={viewerTitle}
            />
        </div>
    );
};

export default AdminDashboard;
