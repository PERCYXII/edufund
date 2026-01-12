import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Clock, User, GraduationCap } from 'lucide-react';
import type { CampaignWithStudent } from '../types';
import './CampaignCard.css';

interface CampaignCardProps {
    campaign: CampaignWithStudent;
    showFullStory?: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, showFullStory = false }) => {
    const goal = campaign.goal || 0;
    const raised = campaign.raised || 0;
    const percentFunded = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

    // Use campaign image, fallback to student profile image, then placeholder
    const campaignImage = campaign.images?.[0] || campaign.student?.profileImage || null;

    return (
        <Link to={`/campaign/${campaign.id}`} className="campaign-card">
            {/* Banner Image */}
            <div className="campaign-card-banner">
                {campaignImage ? (
                    <img src={campaignImage} alt={campaign.title} className="campaign-banner-img" />
                ) : (
                    <div className="campaign-banner-placeholder">
                        <GraduationCap size={48} strokeWidth={1.5} />
                    </div>
                )}
                <div className="campaign-banner-overlay" />

                {/* Badges */}
                <div className="campaign-badges">
                    {campaign.isUrgent && (
                        <span className="urgent-badge">URGENT</span>
                    )}
                    {campaign.category && (
                        <span className="category-badge">{campaign.category.replace('_', ' ')}</span>
                    )}
                </div>

                {/* Student Avatar */}
                <div className="student-avatar-float">
                    {campaign.student?.profileImage ? (
                        <img src={campaign.student.profileImage} alt={`${campaign.student.firstName}`} />
                    ) : (
                        <User size={24} strokeWidth={1.5} />
                    )}
                </div>
            </div>

            <div className="campaign-card-body">
                <div className="campaign-name-row">
                    <h3 className="campaign-student-name">{campaign.student.firstName} {campaign.student.lastName}</h3>
                    {campaign.student.verificationStatus === 'approved' && (
                        <CheckCircle size={20} className="verified-icon" />
                    )}
                </div>

                <p className="campaign-course">{campaign.student.course}</p>
                <p className="campaign-university">
                    {campaign.university.name} • {campaign.student.yearOfStudy}
                </p>

                {showFullStory ? (
                    <p className="campaign-story">{campaign.story}</p>
                ) : (
                    <p className="campaign-story-preview">{campaign.story}</p>
                )}

                <div className="campaign-progress">
                    <div className="progress-amounts">
                        <span className="amount-raised">R{raised.toLocaleString()}</span>
                        <span className="amount-goal">of R{goal.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${percentFunded}%` }}
                        />
                    </div>
                </div>

                <div className="campaign-stats">
                    <div className="stat-group">
                        <span className="stat-item">
                            <Users size={16} />
                            {campaign.donors}
                        </span>
                        <span className="stat-item">
                            <Clock size={16} />
                            {campaign.daysLeft}d
                        </span>
                    </div>
                    <span className="percent-funded">{Math.round(percentFunded)}%</span>
                </div>

                <div className="campaign-card-action">
                    <div className="btn-support-now">
                        Support Student
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CampaignCard;

