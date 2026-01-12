
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    GraduationCap,
    Heart,
    Users,
    FileText,
    Building,
    Shield,
    Eye,
    ArrowRight,
    Clock,
    CheckCircle,
    Lock,
    Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CampaignWithStudent } from '../types';
import CampaignCard from '../components/CampaignCard';
import { CampaignCardSkeleton } from '../components/Skeleton';
import PlatformDonationButton from '../components/PlatformDonationButton';
import './Landing.css';



import { useAuth } from '../context/AuthContext'; // Import Auth

const CountUp = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(ease * end));

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [end, duration]);

    return <>{count}</>;
};

const Landing: React.FC = () => {
    const { isLoggedIn } = useAuth(); // Get auth state
    // navigate removed as unused

    // Add refresh trigger
    const [refreshKey, setRefreshKey] = useState(0);

    const [featuredCampaigns, setFeaturedCampaigns] = useState<CampaignWithStudent[]>([]);
    const [stats, setStats] = useState({
        totalFunded: 0,
        studentsHelped: 0,
        totalDonors: 0,
        partnerUniversities: 0,
    });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [heroImages] = useState([
        '/images/uct-campus.png',
        '/images/wits-campus.png',
        '/images/stellenbosch-campus.png',
        '/images/up-campus.png',
        '/images/uj-campus.png',
        '/images/tut-campus.png'
    ]);
    const location = useLocation();

    const urgentCount = featuredCampaigns.filter(c => c.isUrgent).length; // Based on fetched

    // Auto-rotate hero images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [heroImages.length]);

    // Handle scroll to section from navigation state
    useEffect(() => {
        if (location.state && (location.state as any).scrollTo) {
            const sectionId = (location.state as any).scrollTo;
            const element = document.getElementById(sectionId);
            if (element) {
                // Small timeout to ensure rendering is complete
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [location]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Featured Campaigns (Latest 3 Active)
                const { data: campaignData } = await supabase
                    .from('campaigns')
                    .select(`
                        *,
                        student:students (
                            *,
                            university:universities(*)
                        )
                    `)
                    .eq('status', 'active')
                    .order('is_urgent', { ascending: false }) // Urgent first
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (campaignData) {
                    const mapped: CampaignWithStudent[] = campaignData.map((c: any) => ({
                        id: c.id,
                        studentId: c.student_id,
                        title: c.title,
                        story: c.story,
                        goal: c.goal_amount || 0,
                        raised: c.raised_amount || 0,
                        donors: c.donors || 0,
                        daysLeft: 30, // calculated below
                        startDate: c.start_date,
                        endDate: c.end_date, // Keep endDate for consistency with type
                        status: c.status,
                        type: c.type || (c.is_urgent ? 'quick_assist' : 'standard'),
                        category: c.category,
                        isUrgent: c.is_urgent,
                        fundingBreakdown: c.funding_breakdown || [],
                        images: c.images,
                        createdAt: c.created_at,
                        updatedAt: c.updated_at,
                        student: {
                            id: c.student.id,
                            email: c.student.email,
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

                    // Recalculate daysLeft using endDate
                    const withDays = mapped.map(c => {
                        const end = new Date(c.endDate); // Use endDate as per type definition
                        const now = new Date();
                        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return { ...c, daysLeft: diff > 0 ? diff : 0 };
                    });

                    setFeaturedCampaigns(withDays);
                }

                // 2. Fetch Stats (Approximations & RPCs)
                // Universities count
                const { count: uniCount } = await supabase.from('universities').select('*', { count: 'exact', head: true });

                // Donors count - using RPC (existing)
                const { data: donorCountData, error: donorRpcError } = await supabase.rpc('get_total_unique_donors');
                const realDonorCount = (!donorRpcError && donorCountData !== null) ? donorCountData : 0;

                // Funded Students - Fallback to active campaigns count (since RPC failed)
                const { count: activeCampaignsCount } = await supabase
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                const studentsHelpedCount = activeCampaignsCount || 850;

                // Total funded - using RPC
                const { data: totalRaisedData, error: rpcError } = await supabase.rpc('get_total_donations');

                let totalRaised = 0;
                if (!rpcError && totalRaisedData !== null) {
                    totalRaised = totalRaisedData;
                } else {
                    // Fallback to manual sum if RPC fails
                    const { data: donations } = await supabase.from('donations').select('amount').eq('payment_status', 'completed');
                    totalRaised = donations ? donations.reduce((acc, curr) => acc + curr.amount, 0) : 0;
                }

                setStats({
                    totalFunded: totalRaised,
                    studentsHelped: studentsHelpedCount,
                    totalDonors: realDonorCount,
                    partnerUniversities: uniCount || 26
                });

            } catch (error) {
                console.error("Error fetching landing data", error);
            }
        };

        fetchData();
    }, [refreshKey]); // Re-fetch when refreshKey changes

    const handleDonationSuccess = () => {
        // Trigger re-fetch of stats
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="landing-page">
            {/* Hero Section with Carousel */}
            <section className="hero-section">
                {/* Carousel Background */}
                <div className="hero-carousel">
                    {heroImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`hero-slide ${idx === currentImageIndex ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                    <div className="hero-overlay" />
                </div>

                <div className="container hero-container">
                    <div className="hero-grid">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                Empowering<br />
                                <span className="hero-highlight">South African Students</span>
                            </h1>
                            <p className="hero-subtitle">
                                Help deserving South African students complete their university education.
                                100% of donations go directly to university accounts at UCT, Wits, Stellenbosch,
                                UP, and partner institutions – verified, transparent, and tax-deductible.
                            </p>
                            <div className="hero-buttons">
                                <Link to={isLoggedIn ? "/dashboard" : "/register/student"} className="btn btn-lg hero-btn-primary">
                                    <GraduationCap size={24} />
                                    {isLoggedIn ? "Go to Dashboard" : "Start Your Campaign"}
                                </Link>
                                <Link to="/browse" className="btn btn-lg hero-btn-secondary">
                                    <Heart size={24} />
                                    Support a Student
                                </Link>
                            </div>
                            <div className="hero-donate-cta">
                                <PlatformDonationButton
                                    className="btn btn-lg hero-btn-donate"
                                    onDonationSuccess={handleDonationSuccess}
                                />
                                <span className="donate-note">Help us keep the platform running</span>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <div className="hero-circle-outer" />
                            <div className="hero-circle-inner">
                                <GraduationCap size={120} strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hero-stats">
                        <div className="stat-card">
                            <span className="stat-value">
                                R{stats.totalFunded > 1000000
                                    ? (stats.totalFunded / 1000000).toFixed(1) + 'M+'
                                    : stats.totalFunded.toLocaleString() + '+'}
                            </span>
                            <span className="stat-label">Funded to Date</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{stats.studentsHelped}+</span>
                            <span className="stat-label">Students Helped</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value"><CountUp end={stats.totalDonors} /></span>
                            <span className="stat-label">Generous Donors</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{stats.partnerUniversities}</span>
                            <span className="stat-label">Partner Universities</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="section section-alt">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">How UniFund Works</h2>
                        <p className="section-subtitle">Simple, transparent, and secure funding directly to your university</p>
                    </div>

                    <div className="steps-grid">
                        {[
                            { icon: Users, title: "Create Profile", desc: "Register and verify your student status with your university enrollment documents", color: "#3b82f6" },
                            { icon: FileText, title: "Build Campaign", desc: "Share your story, goals, and funding needs to connect with potential donors", color: "#a855f7" },
                            { icon: Heart, title: "Receive Support", desc: "Donors contribute to your education fund through our secure platform", color: "#ec4899" },
                            { icon: Building, title: "Direct Payment", desc: "Funds go directly to your university account with your student number as reference", color: "#22c55e" }
                        ].map((step, idx) => (
                            <div key={idx} className="step-card">
                                <div className="step-icon" style={{ background: step.color }}>
                                    <step.icon size={40} color="white" />
                                </div>
                                <div className="step-number">{idx + 1}</div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Campaigns */}
            <section className="section">
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Students Who Need Your Help</h2>
                            <p className="section-subtitle">Every contribution makes a difference</p>
                        </div>
                        <Link to="/browse" className="view-all-link">
                            View All <ArrowRight size={20} />
                        </Link>
                    </div>

                    {/* Urgent Banner */}
                    {urgentCount > 0 && (
                        <div className="urgent-banner">
                            <div className="urgent-icon">
                                <Clock size={32} />
                            </div>
                            <div className="urgent-content">
                                <h3>{urgentCount} campaigns ending soon!</h3>
                                <p>These students need your help before their deadlines</p>
                            </div>
                        </div>
                    )}

                    {featuredCampaigns.length > 0 ? (
                        <div className="campaigns-grid">
                            {featuredCampaigns.map((campaign) => (
                                <CampaignCard key={campaign.id} campaign={campaign} />
                            ))}
                        </div>
                    ) : (
                        <div className="campaigns-grid">
                            {[1, 2, 3].map((i) => (
                                <CampaignCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    <div className="mobile-view-all">
                        <Link to="/browse" className="btn btn-primary">View All Campaigns</Link>
                    </div>
                </div>
            </section>

            {/* Partner Universities Section */}
            <section className="section universities-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Partner Universities & Institutions</h2>
                        <p className="section-subtitle">We work with South Africa's leading universities, universities of technology, and TVET colleges</p>
                    </div>

                    {/* University Logos Carousel */}
                    <div className="logos-carousel-container">
                        <div className="logos-carousel">
                            <div className="logos-track">
                                {/* First set of logos */}
                                <div className="logo-item"><img src="/images/logos/wits-logo.jpg" alt="Wits University" /></div>
                                <div className="logo-item"><img src="/images/logos/uj-logo.jpg" alt="University of Johannesburg" /></div>
                                <div className="logo-item"><img src="/images/logos/tut-logo.png" alt="Tshwane University of Technology" /></div>
                                <div className="logo-item"><img src="/images/logos/university of cape town logo.png" alt="University of Cape Town" /></div>
                                <div className="logo-item"><img src="/images/logos/stellenbosch university logo.png" alt="Stellenbosch University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of pretoria logo.png" alt="University of Pretoria" /></div>
                                <div className="logo-item"><img src="/images/logos/nelson-mandela-university-logo.png" alt="Nelson Mandela University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of kwazulu-natal logo.png" alt="University of KwaZulu-Natal" /></div>
                                <div className="logo-item"><img src="/images/logos/university of free state logo.png" alt="University of Free State" /></div>
                                <div className="logo-item"><img src="/images/logos/rhodes university logo.png" alt="Rhodes University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of south africa logo.png" alt="UNISA" /></div>
                                <div className="logo-item"><img src="/images/logos/northwestern university logo.png" alt="North-West University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of western cape logo.png" alt="University of Western Cape" /></div>
                                <div className="logo-item"><img src="/images/logos/cape peninsula university of technology logo.png" alt="CPUT" /></div>
                                <div className="logo-item"><img src="/images/logos/durban university of technology logo.jpg" alt="DUT" /></div>
                                <div className="logo-item"><img src="/images/logos/central university of technology logo.png" alt="CUT" /></div>
                                <div className="logo-item"><img src="/images/logos/mangosuthu university of technology logo.png" alt="MUT" /></div>
                                <div className="logo-item"><img src="/images/logos/sol plaatje university logo.png" alt="Sol Plaatje University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of mpumalanga logo.jpg" alt="University of Mpumalanga" /></div>
                                <div className="logo-item"><img src="/images/logos/university of limpopo logo.png" alt="University of Limpopo" /></div>
                                <div className="logo-item"><img src="/images/logos/university of venda logo.png" alt="University of Venda" /></div>
                                <div className="logo-item"><img src="/images/logos/university of zululand logo.png" alt="University of Zululand" /></div>
                                <div className="logo-item"><img src="/images/logos/university of fort hare logo.png" alt="University of Fort Hare" /></div>
                                <div className="logo-item"><img src="/images/logos/walter sisulu university logo.png" alt="Walter Sisulu University" /></div>
                                <div className="logo-item"><img src="/images/logos/cjc-logo.png" alt="Central Johannesburg College" /></div>
                                {/* Duplicate set for seamless loop */}
                                <div className="logo-item"><img src="/images/logos/wits-logo.jpg" alt="Wits University" /></div>
                                <div className="logo-item"><img src="/images/logos/uj-logo.jpg" alt="University of Johannesburg" /></div>
                                <div className="logo-item"><img src="/images/logos/tut-logo.png" alt="Tshwane University of Technology" /></div>
                                <div className="logo-item"><img src="/images/logos/university of cape town logo.png" alt="University of Cape Town" /></div>
                                <div className="logo-item"><img src="/images/logos/stellenbosch university logo.png" alt="Stellenbosch University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of pretoria logo.png" alt="University of Pretoria" /></div>
                                <div className="logo-item"><img src="/images/logos/nelson-mandela-university-logo.png" alt="Nelson Mandela University" /></div>
                                <div className="logo-item"><img src="/images/logos/university of kwazulu-natal logo.png" alt="University of KwaZulu-Natal" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Campus Images Grid */}
                    <div className="universities-grid">
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/uct-campus.png" alt="University of Cape Town" />
                            </div>
                            <div className="university-info">
                                <h3>University of Cape Town</h3>
                                <p>UCT</p>
                            </div>
                        </div>
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/stellenbosch-campus.png" alt="Stellenbosch University" />
                            </div>
                            <div className="university-info">
                                <h3>Stellenbosch University</h3>
                                <p>SU</p>
                            </div>
                        </div>

                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/cape peninsula university of technology building.jpg" alt="Cape Peninsula University of Technology" />
                            </div>
                            <div className="university-info">
                                <h3>Cape Peninsula University of Technology</h3>
                                <p>CPUT</p>
                            </div>
                        </div>
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/sefako makgatho health sciences university building.jpg" alt="Sefako Makgatho Health Sciences University" />
                            </div>
                            <div className="university-info">
                                <h3>Sefako Makgatho University</h3>
                                <p>SMU</p>
                            </div>
                        </div>
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/spu-campus.jpg" alt="Sol Plaatje University" />
                            </div>
                            <div className="university-info">
                                <h3>University of Johannesburg</h3>
                                <p>UJ</p>
                            </div>
                        </div>
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/University of the Witwatersrand building.jpg" alt="University of the Witwatersrand Building" />
                            </div>
                            <div className="university-info">
                                <h3>Wits Great Hall</h3>
                                <p>WITS</p>
                            </div>
                        </div>
                        <div className="university-card">
                            <div className="university-image">
                                <img src="/images/university of pretoria building.jpg" alt="University of Pretoria Building" />
                            </div>
                            <div className="university-info">
                                <h3>UP Main Campus</h3>
                                <p>UP / Tuks</p>
                            </div>
                        </div>
                    </div>

                    <p className="universities-note">
                        <Building size={20} />
                        Supporting students from {stats.partnerUniversities} universities, 50+ TVET colleges, and private institutions across South Africa
                    </p>
                </div>
            </section>

            {/* Trust Section */}
            <section className="section trust-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title light">Why Trust UniFund?</h2>
                        <p className="section-subtitle light">Your donations make a real impact, guaranteed</p>
                    </div>

                    <div className="trust-grid">
                        {[
                            { icon: Shield, title: "Verified Students", desc: "Every student is verified through official enrollment documents and university records" },
                            { icon: Building, title: "Direct to University", desc: "You pay directly to the university – UniFund never holds student funds. Your donation is transferred immediately using the student number as reference." },
                            { icon: Lock, title: "Data Protection", desc: "We are fully POPIA compliant. Your documents are encrypted and only used for legitimate verification purposes." },
                            { icon: Eye, title: "Full Transparency", desc: "Track exactly where your money goes with detailed payment confirmations from the university" }
                        ].map((item, idx) => (
                            <div key={idx} className="trust-card">
                                <div className="trust-icon">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="trust-title">{item.title}</h3>
                                <p className="trust-desc">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="landing-trust-logos mt-16">
                        <p className="trust-values-title">Rooted in Ubuntu & Local Impact</p>
                        <div className="flex justify-center items-center gap-8 flex-wrap">
                            <img src="/images/logos/proudly-south-african-logo.png" alt="Proudly South African" className="landing-v-logo" />
                            <img src="/images/dept-education-logo.jpg" alt="South African Department of Education" className="landing-v-logo" />
                            <img src="/images/logos/ubuntu-logo.jpg" alt="Ubuntu - Humanity Towards Others" className="landing-v-logo" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Student Success Stories */}
            <section className="section success-stories-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Student Success Stories</h2>
                        <p className="section-subtitle">See the impact of your donations in action</p>
                    </div>

                    <div className="stories-grid">
                        <div className="story-card">
                            <div className="story-image">
                                <img src="/images/student-campus.png" alt="Student on campus" />
                            </div>
                            <div className="story-content">
                                <h3>Campus Life</h3>
                                <p>Your donations help students thrive in their academic journey, attending classes and engaging with their community.</p>
                            </div>
                        </div>
                        <div className="story-card">
                            <div className="story-image">
                                <img src="/images/student-library.png" alt="Student studying in library" />
                            </div>
                            <div className="story-content">
                                <h3>Focused Learning</h3>
                                <p>With financial stress reduced, students can focus on what matters most – their education and growth.</p>
                            </div>
                        </div>
                        <div className="story-card featured">
                            <div className="story-image">
                                <img src="/images/student-graduating.png" alt="Student graduating" />
                            </div>
                            <div className="story-content">
                                <h3>Graduation Day</h3>
                                <p>The ultimate goal – watching students achieve their dreams and graduate, ready to give back to their communities.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support UniFund Section */}
            <section className="section support-UniFund-section">
                <div className="container">
                    <div className="support-card">
                        <div className="support-content">
                            <div className="support-icon">
                                <Heart size={48} />
                            </div>
                            <h2 className="support-title">Support UniFund</h2>
                            <p className="support-desc">
                                Unlike student campaign donations (which go directly to universities),
                                your donation here goes to UniFund to keep our platform running.
                                This helps us verify students, maintain the website, and connect deserving learners with donors.
                            </p>
                            <div className="support-features">
                                <div className="support-feature">
                                    <CheckCircle size={20} />
                                    <span>100% goes to platform operations</span>
                                </div>
                                <div className="support-feature">
                                    <CheckCircle size={20} />
                                    <span>Verify more students</span>
                                </div>
                                <div className="support-feature">
                                    <CheckCircle size={20} />
                                    <span>Reach more donors</span>
                                </div>
                            </div>
                            <PlatformDonationButton
                                className="btn btn-lg support-btn"
                                onDonationSuccess={handleDonationSuccess}
                            />
                            <p className="support-note">Every contribution helps us help more students</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ubuntu Giving Message */}
            <section className="section ubuntu-section">
                <div className="container">
                    <div className="ubuntu-content">
                        <div className="ubuntu-icon">
                            <img src="/images/logos/ubuntu-logo.jpg" alt="Ubuntu" className="ubuntu-logo-large" />
                        </div>
                        <blockquote className="ubuntu-quote">
                            "Umuntu ngumuntu ngabantu"
                        </blockquote>
                        <p className="ubuntu-translation">
                            "I am because we are" – the spirit of Ubuntu
                        </p>
                        <p className="ubuntu-message">
                            In South Africa, we believe that our humanity is intertwined. When we lift one student,
                            we lift an entire family – and ultimately, our whole community. Your small act of giving
                            creates ripples that transform lives for generations. This is the power of Ubuntu in action.
                        </p>
                        <div className="ubuntu-values">
                            <div className="ubuntu-value">
                                <Heart size={24} />
                                <span>Compassion</span>
                            </div>
                            <div className="ubuntu-value">
                                <Users size={24} />
                                <span>Community</span>
                            </div>
                            <div className="ubuntu-value">
                                <Sparkles size={24} />
                                <span>Hope</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Make a Difference?</h2>
                        <p className="cta-subtitle">Whether you're a student seeking funding or a donor wanting to help, join our community today.</p>
                        <div className="cta-buttons">
                            <Link to={isLoggedIn ? "/dashboard" : "/register/student"} className="btn btn-lg cta-btn-student" style={{ fontWeight: 600 }}>
                                {isLoggedIn ? "Go to Dashboard" : "I'm a Student"}
                            </Link>
                            <Link to="/browse" className="btn btn-lg cta-btn-donor" style={{ fontWeight: 600 }}>
                                I Want to Donate
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};


export default Landing;
