import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, SearchX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FIELDS_OF_STUDY } from '../data/constants';
import type { CampaignWithStudent, University } from '../types';
import CampaignCard from '../components/CampaignCard';
import { CampaignCardSkeleton } from '../components/Skeleton';
import '../components/Skeleton.css';
import './Browse.css';

const Browse: React.FC = () => {
    const [campaigns, setCampaigns] = useState<CampaignWithStudent[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState('');
    const [selectedField, setSelectedField] = useState('');
    const [sortBy, setSortBy] = useState('urgent');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Universities
                const { data: uniData } = await supabase
                    .from('universities')
                    .select('*')
                    .order('name');

                if (uniData) {
                    // Map to University type
                    setUniversities(uniData.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        bankName: u.bank_name,
                        accountNumber: u.account_number,
                        branchCode: u.branch_code,
                        accountName: u.account_name,
                        // Add other fields as needed
                    })));
                }

                // Fetch Campaigns with related student and university data
                // Note: We're assuming the foreign key relationships are set up correctly
                // campaign -> student (student_id) -> university (university_id)
                // However, our type expects university at top level.
                // We'll fetch deeply and flatten.

                const { data: campaignData, error } = await supabase
                    .from('campaigns')
                    .select(`
                        *,
                        student:students (
                            *,
                            university:universities (*)
                        )
                    `)
                    .eq('status', 'active'); // Only show active campaigns

                if (error) throw error;

                if (campaignData) {
                    // Filter out campaigns with missing student or university data (data integrity issue)
                    const validCampaigns = campaignData.filter((c: any) => c.student && c.student.university);
                    
                    const mappedCampaigns: CampaignWithStudent[] = validCampaigns.map((c: any) => ({
                        id: c.id,
                        studentId: c.student_id,
                        title: c.title,
                        story: c.story,
                        goal: c.goal_amount || 0,
                        raised: c.raised_amount || 0,
                        donors: c.donors || 0,
                        daysLeft: 30, // calculated below
                        // Ideally daysLeft is calculated from endDate
                        startDate: c.start_date,
                        endDate: c.end_date,
                        status: c.status,
                        paused: c.is_paused,
                        type: c.type || (c.is_urgent ? 'quick_assist' : 'standard'),
                        category: c.category,
                        isUrgent: c.is_urgent,
                        fundingBreakdown: c.funding_breakdown || [], // Assuming Supabase returns JSON/array
                        images: c.images,
                        createdAt: c.created_at,
                        updatedAt: c.updated_at,

                        student: {
                            id: c.student.id,
                            email: c.student.email, // This might not be joined if not in students table or public
                            // Wait, emails are usually in auth.users or profiles. 'students' table might not have it unless duplicated.
                            // For now assuming it is there or we don't display it explicitly in cards.
                            firstName: c.student.first_name,
                            lastName: c.student.last_name,
                            phone: c.student.phone,
                            universityId: c.student.university_id,
                            studentNumber: c.student.student_number,
                            course: c.student.course,
                            yearOfStudy: c.student.year_of_study,
                            expectedGraduation: c.student.expected_graduation,
                            verificationStatus: c.student.verification_status,
                            profileImage: c.student.profile_image_url,
                            createdAt: c.student.created_at,
                            updatedAt: c.student.updated_at
                        },
                        university: {
                            id: c.student.university.id,
                            name: c.student.university.name,
                            bankName: c.student.university.bank_name,
                            accountNumber: c.student.university.account_number,
                            branchCode: c.student.university.branch_code,
                            accountName: c.student.university.account_name
                        }
                    }));

                    // Recalculate daysLeft dynamically
                    const withDaysLeft = mappedCampaigns.map(c => {
                        const end = new Date(c.endDate);
                        const now = new Date();
                        const diffTime = end.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return { ...c, daysLeft: diffDays > 0 ? diffDays : 0 };
                    });

                    setCampaigns(withDaysLeft);
                }

            } catch (err) {
                console.error("Error fetching browse data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredCampaigns = useMemo(() => {
        let result = [...campaigns];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                (c.student.firstName || '').toLowerCase().includes(query) ||
                (c.student.lastName || '').toLowerCase().includes(query) ||
                (c.student.course || '').toLowerCase().includes(query) ||
                (c.university.name || '').toLowerCase().includes(query)
            );
        }

        // University filter
        if (selectedUniversity) {
            result = result.filter(c => c.university.name === selectedUniversity);
        }

        // Field filter
        if (selectedField && selectedField !== 'All Fields') {
            const field = selectedField.toLowerCase();
            result = result.filter(c => {
                const course = (c.student.course || '').toLowerCase();
                // Basic matching logic
                if (field.includes('engineering')) return course.includes('eng');
                if (field.includes('medicine') || field.includes('health')) return course.includes('med') || course.includes('nurs');
                if (field.includes('business') || field.includes('commerce')) return course.includes('com') || course.includes('account');
                if (field.includes('law')) return course.includes('law') || course.includes('llb');
                if (field.includes('science') || field.includes('technology')) return course.includes('sc') || course.includes('tech');
                if (field.includes('arts')) return course.includes('art') || course.includes('design');
                if (field.includes('education')) return course.includes('edu') || course.includes('teach');
                return true;
            });
        }

        // Sorting
        switch (sortBy) {
            case 'urgent':
                result.sort((a, b) => {
                    if (a.isUrgent && !b.isUrgent) return -1;
                    if (!a.isUrgent && b.isUrgent) return 1;
                    return a.daysLeft - b.daysLeft;
                });
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'almostFunded':
                result.sort((a, b) => (b.raised / b.goal) - (a.raised / a.goal));
                break;
            case 'popular':
                result.sort((a, b) => b.donors - a.donors);
                break;
        }

        return result;
    }, [campaigns, searchQuery, selectedUniversity, selectedField, sortBy]);

    const urgentCount = campaigns.filter(c => c.isUrgent && c.daysLeft <= 15).length;

    if (isLoading) {
        return (
            <div className="browse-page">
                <div className="container">
                    {/* Header Skeleton */}
                    <div className="browse-header">
                        <div className="skeleton skeleton-text" style={{ width: '300px', height: '40px', margin: '0 auto' }} />
                        <div className="skeleton skeleton-text" style={{ width: '400px', height: '20px', margin: '1rem auto 0' }} />
                    </div>

                    {/* Filters Skeleton */}
                    <div className="filters-card">
                        <div className="filters-grid">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="filter-group">
                                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', marginBottom: '8px' }} />
                                    <div className="skeleton skeleton-rounded" style={{ width: '100%', height: '44px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Campaigns Grid Skeleton */}
                    <div className="campaigns-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <CampaignCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="browse-page">
            <div className="container">
                {/* Header */}
                <div className="browse-header">
                    <h1 className="browse-title">Browse Student Campaigns</h1>
                    <p className="browse-subtitle">Find and support students who need your help</p>
                </div>

                {/* Filters */}
                <div className="filters-card">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Search</label>
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name or course..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input search-input"
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">University</label>
                            <select
                                value={selectedUniversity}
                                onChange={(e) => setSelectedUniversity(e.target.value)}
                                className="form-input form-select"
                            >
                                <option value="">All Universities</option>
                                {universities.map(uni => (
                                    <option key={uni.id} value={uni.name}>{uni.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Field of Study</label>
                            <select
                                value={selectedField}
                                onChange={(e) => setSelectedField(e.target.value)}
                                className="form-input form-select"
                            >
                                {FIELDS_OF_STUDY.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="form-input form-select"
                            >
                                <option value="urgent">Most Urgent</option>
                                <option value="newest">Newest First</option>
                                <option value="almostFunded">Almost Funded</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Urgent Banner */}
                {urgentCount > 0 && (
                    <div className="urgent-banner">
                        <div className="urgent-icon-wrapper">
                            <Clock size={32} />
                        </div>
                        <div className="urgent-text">
                            <h3>{urgentCount} campaigns ending soon!</h3>
                            <p>These students need your help before their deadlines</p>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="results-info">
                    <p>Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Campaign Grid */}
                {filteredCampaigns.length > 0 ? (
                    <div className="campaigns-grid">
                        {filteredCampaigns.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">
                            <SearchX size={64} strokeWidth={1.5} />
                        </div>
                        <h3>No active campaigns found</h3>
                        <p>Try adjusting your filters or check back later</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Browse;
