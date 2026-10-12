import React from 'react';
import StaffInbox from '@/components/StaffInbox';

const DoctorInbox: React.FC = () => {
  return (
    <StaffInbox
      role="doctor"
      title="Messages from Patients"
      badgeLabel="Doctor Inbox"
      badgeClass="border-healing text-healing"
      limit={200}
    />
  );
};

export default DoctorInbox;
