import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export interface EmergencyIDCardProps {
    firstName: string;
    lastName: string;
    patientId?: string;
    dateOfBirth?: string;
    bloodType?: string;
    address?: string;
    occupation?: string;
    issueDate?: string;
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
    accessUrl: string;
    profilePicture?: string | null;
}

export const EmergencyIDCard: React.FC<EmergencyIDCardProps> = ({
    firstName,
    lastName,
    patientId,
    dateOfBirth,
    bloodType,
    address,
    occupation,
    issueDate,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
    accessUrl,
    profilePicture,
}) => {
    const calculateAge = (dobString: string | undefined) => {
        if (!dobString) return null;
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return null;
        const maxAge = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
        return maxAge;
    };
    const age = calculateAge(dateOfBirth);

    return (
        <div
            id="emergency-id-card-element"
            className="flex items-center justify-between w-[1012px] h-[638px] rounded-[24px] overflow-hidden shadow-none border-0"
            style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#ffffff' }}
        >
            {/* Left Side */}
            <div
                className="w-[35%] h-full flex flex-col items-center justify-between py-8 px-6 border-r-4"
                style={{ backgroundColor: '#ffffff', borderColor: 'rgba(225, 29, 72, 0.2)' }}
            >
                <div className="flex items-center justify-center w-full">
                    <div
                        className="shrink-0 rounded-lg p-1"
                        style={{ background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.1), rgba(255, 255, 255, 0))' }}
                    >
                        <img src="/images/logo.webp" alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
                    </div>
                </div>

                {/* Middle: Profile Picture */}
                <div className="flex flex-col items-center justify-center flex-1 w-full my-2">
                    {profilePicture ? (
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg" style={{ borderColor: '#ffffff', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15)' }}>
                            <img src={profilePicture} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                    ) : (
                        <div className="w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-lg" style={{ backgroundColor: '#f8fafc', borderColor: '#ffffff', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15)' }}>
                            <svg className="w-16 h-16" style={{ color: '#cbd5e1' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Bottom: QR Code */}
                <div className="flex flex-col items-center">
                    <div
                        className="font-bold text-[10px] uppercase tracking-[0.2em] text-center mb-3"
                        style={{ color: '#94a3b8' }}
                    >
                        Emergency Scan
                    </div>
                    <div
                        className="p-3 rounded-xl shadow-sm border mb-3"
                        style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}
                    >
                        <QRCodeCanvas
                            value={accessUrl}
                            size={140}
                            bgColor={"#ffffff"}
                            fgColor={"#e11d48"}
                            level={"H"}
                            includeMargin={false}
                            imageSettings={{
                                src: "/images/logo.webp",
                                x: undefined,
                                y: undefined,
                                height: 36,
                                width: 36,
                                excavate: true
                            }}
                        />
                    </div>
                    <div
                        className="text-center font-semibold text-[10px] leading-snug px-4"
                        style={{ color: '#64748b' }}
                    >
                        Scan with any smartphone camera for critical medical history.
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div
                className="w-[65%] h-full relative overflow-hidden p-10"
                style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)', color: '#ffffff' }}
            >
                <div
                    className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                ></div>
                <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2">
                    <svg className="w-80 h-80" style={{ color: 'rgba(244, 63, 94, 0.15)' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div
                                    className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-sm border"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                    Emergency Medical ID
                                </div>
                                <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">
                                    {firstName} {lastName}
                                </h1>
                            </div>
                            <div
                                className="p-3 rounded-2xl border shadow-lg flex flex-col items-center justify-center min-w-[80px]"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 1)' }}
                            >
                                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#e11d48' }}>Blood</div>
                                <div className="text-3xl font-black" style={{ color: '#e11d48' }}>{bloodType || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-2xl border shadow-inner" style={{ backgroundColor: 'rgba(136, 19, 55, 0.4)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#fecdd3' }}>Patient ID</div>
                            <div className="text-lg font-bold" style={{ color: '#ffffff' }}>
                                {patientId ? `SMRS-${patientId.substring(0, 8).toUpperCase()}` : 'Not Assigned'}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border shadow-inner" style={{ backgroundColor: 'rgba(136, 19, 55, 0.4)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#fecdd3' }}>Occupation</div>
                            <div className="text-sm font-bold pr-2 whitespace-normal break-words" style={{ color: '#ffffff', lineHeight: '1.4' }}>
                                {occupation || 'Not specified'}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border shadow-inner" style={{ backgroundColor: 'rgba(136, 19, 55, 0.4)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#fecdd3' }}>Date of Birth</div>
                            <div className="text-sm font-bold flex flex-wrap items-center gap-2" style={{ color: '#ffffff', lineHeight: '1.4' }}>
                                <span>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</span>
                                {age !== null && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffe4e6' }}>
                                        {age} yrs
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border shadow-inner" style={{ backgroundColor: 'rgba(136, 19, 55, 0.4)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#fecdd3' }}>Location</div>
                            <div className="text-sm font-bold pr-2 whitespace-normal break-words" style={{ color: '#ffffff', lineHeight: '1.4' }}>
                                {address || 'Not specified'}
                            </div>
                        </div>

                        <div
                            className="p-4 rounded-2xl border shadow-inner col-span-2 flex justify-between items-center"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }}
                        >
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-2" style={{ color: '#ffe4e6' }}>
                                    Emergency Contact
                                    {emergencyContactRelationship && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.20)', color: '#ffffff' }}>
                                            {emergencyContactRelationship}
                                        </span>
                                    )}
                                </div>
                                <div className="text-lg font-bold" style={{ color: '#ffffff', lineHeight: '1.4' }}>
                                    {emergencyContactName || 'Not assigned'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#ffe4e6' }}>Phone</div>
                                <div className="text-lg font-bold" style={{ color: '#ffffff', lineHeight: '1.4' }}>
                                    {emergencyContactPhone || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                                <svg className="w-5 h-5" style={{ color: '#ffffff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-xs tracking-wide uppercase" style={{ color: '#ffffff' }}>Instruction for Medical Personnel</div>
                                <div className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Scan QR to view complete medical history, active prescriptions, and care plans.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};