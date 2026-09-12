import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, ShieldCheck, CheckCircle2, Save, BookOpen, Lock, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfilePage: React.FC = () => {
  const { user, updateProfileState } = useAuth();
  const { t, i18n } = useTranslation(['common', 'auth']);

  const isTeacher = user?.role === 'ADMIN';
  const isGu = i18n.language === 'gu';

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const currentStandard = user?.profile?.standard || 'Standard 8';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/auth/profile', { name });
      updateProfileState({ name });
      setMessage(isGu ? 'પ્રોફાઇલ વિગતો સફળતાપૂર્વક અપડેટ થઈ!' : 'Profile details updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage(isGu ? 'પ્રોફાઇલ અપડેટ કરવામાં નિષ્ફળ.' : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const getStandardLabel = (std: string) => {
    const key = `standards.${std.toLowerCase().replace(' ', '')}`;
    return t(key, std);
  };

  return (
    <div className="space-y-8 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          {isTeacher ? (
            <ShieldCheck className="w-7 h-7 text-purple-400" />
          ) : (
            <User className="w-7 h-7 text-blue-400" />
          )}
          <span>
            {isTeacher
              ? (isGu ? 'શિક્ષક પ્રોફાઇલ વિગતો' : 'Teacher Profile Details')
              : (isGu ? 'વિદ્યાર્થી પ્રોફાઇલ વિગતો' : 'Student Profile Details')}
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isTeacher
            ? (isGu ? 'તમારા શિક્ષક એકાઉન્ટની વિગતો મેનેજ કરો' : 'Manage your personal teacher account details')
            : (isGu ? 'તમારી વિદ્યાર્થી પ્રોફાઇલ માહિતી જુઓ અને મેનેજ કરો' : 'View and manage your student profile information')}
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Role Indicator Badge */}
          {isTeacher && (
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">
                  {isGu ? 'ભૂમિકા: શિક્ષક / એડમિન' : 'Role: Teacher / Admin'}
                </span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 font-bold uppercase">
                {isGu ? 'સક્રિય' : 'Active'}
              </span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              {t('auth:fullName')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email Address (Read Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{t('auth:email')}</span>
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed font-medium"
            />
          </div>

          {/* Academic Standard / Grade (STUDENT ONLY - READ ONLY) */}
          {!isTeacher && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>{isGu ? 'શૈક્ષણિક ધોરણ (ફક્ત વાંચવા માટે)' : 'Academic Standard / Grade (Read-Only)'}</span>
                </label>
                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>{isGu ? 'નોંધણી વખતે સોંપાયેલ' : 'Assigned on Registration'}</span>
                </span>
              </div>
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-bold text-blue-400">📚 {getStandardLabel(currentStandard)}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {isGu ? 'સોંપેલ ધોરણ' : 'Assigned Grade'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  {isGu ? 'નિશ્ચિત' : 'Fixed'}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 ${
              isTeacher
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            } text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common:saving') : (isGu ? 'પ્રોફાઇલ વિગતો સાચવો' : 'Save Profile Details')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
