import React from 'react';
import { TeacherTextbookManager } from '../components/TeacherTextbookManager';

export const TeacherTextbooksPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <TeacherTextbookManager />
    </div>
  );
};

export default TeacherTextbooksPage;
