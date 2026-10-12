import React from 'react';
import StaffInbox from '@/components/StaffInbox';

const AdminInbox: React.FC = () => {
  return (
    <StaffInbox
      role="admin"
      title="Admin Inbox"
      badgeLabel="Admin Inbox"
      badgeClass="border-primary text-primary"
      limit={300}
    />
  );
};

export default AdminInbox;
