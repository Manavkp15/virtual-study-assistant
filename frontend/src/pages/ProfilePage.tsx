import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Save,
  BookOpen,
  Lock,
  Mail,
  Camera,
  Trash2,
  AlertCircle,
  Loader2,
  Phone,
  Hash,
  School
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';

export const ProfilePage: React.FC = () => {
  const { user, updateProfileState } = useAuth();
  const { t, i18n } = useTranslation(['common', 'auth']);

  const isTeacher = user?.role === 'ADMIN';

  const [name, setName] = useState(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || user?.profile?.mobileNumber || '');
  const [rollNumber, setRollNumber] = useState(user?.profile?.rollNumber || '');
  const [udiseCode, setUdiseCode] = useState(user?.profile?.udiseCode || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobileNumber(user.mobileNumber || user.profile?.mobileNumber || '');
      setRollNumber(user.profile?.rollNumber || '');
      setUdiseCode(user.profile?.udiseCode || '');
    }
  }, [user]);

  const currentStandard = user?.profile?.standard || 'Standard 8';

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side image validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAvatarError(tr('કૃપા કરીને ફક્ત JPG, PNG અથવા WEBP ઈમેજ પસંદ કરો.', 'Please select a valid image file (JPG, PNG, or WEBP).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(tr('ઈમેજનું કદ 5MB થી ઓછું હોવું જોઈએ.', 'Image size must be less than 5MB.'));
      return;
    }

    setAvatarError('');
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateProfileState({ avatarUrl: res.data.avatarUrl });
      setMessage(tr('પ્રોફાઇલ ફોટો સફળતાપૂર્વક અપડેટ થયો!', 'Profile picture updated successfully!'));
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setAvatarError(err.response?.data?.error || tr('ફોટો અપલોડ કરવામાં નિષ્ફળ.', 'Failed to upload photo.'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm(tr('શું તમે તમારો પ્રોફાઇલ ફોટો દૂર કરવા માંગો છો?', 'Are you sure you want to remove your profile picture?'))) return;
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      await api.delete('/auth/avatar');
      updateProfileState({ avatarUrl: null });
      setMessage(tr('પ્રોફાઇલ ફોટો સફળતાપૂર્વક દૂર કરવામાં આવ્યો.', 'Profile picture removed successfully.'));
    } catch (err: any) {
      console.error('Failed to remove avatar:', err);
      setAvatarError(err.response?.data?.error || tr('ફોટો દૂર કરવામાં નિષ્ફળ.', 'Failed to remove photo.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload: any = {
        name,
        mobileNumber
      };
      if (!isTeacher) {
        payload.rollNumber = rollNumber;
        payload.udiseCode = udiseCode;
      }
      const res = await api.put('/auth/profile', payload);
      if (res.data.user) {
        updateProfileState(res.data.user);
      } else {
        updateProfileState({
          name,
          mobileNumber,
          profile: user?.profile
            ? {
                ...user.profile,
                mobileNumber,
                rollNumber,
                udiseCode
              }
            : undefined
        });
      }
      setMessage(tr('પ્રોફાઇલ વિગતો સફળતાપૂર્વક અપડેટ થઈ!', 'Profile details updated successfully!'));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setMessage(err.response?.data?.error || tr('પ્રોફાઇલ અપડેટ કરવામાં નિષ્ફળ.', 'Failed to update profile.'));
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
              ? tr('શિક્ષક પ્રોફાઇલ વિગતો', 'Teacher Profile Details')
              : tr('વિદ્યાર્થી પ્રોફાઇલ વિગતો', 'Student Profile Details')}
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isTeacher
            ? tr('તમારા શિક્ષક એકાઉન્ટની વિગતો મેનેજ કરો', 'Manage your personal teacher account details')
            : tr('તમારી વિદ્યાર્થી પ્રોફાઇલ માહિતી જુઓ અને મેનેજ કરો', 'View and manage your student profile information')}
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
                  {tr('ભૂમિકા: શિક્ષક / એડમિન', 'Role: Teacher / Admin')}
                </span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 font-bold uppercase">
                {tr('સક્રિય', 'Active')}
              </span>
            </div>
          )}

          {/* Profile Picture Upload Section */}
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Preview with Camera Overlay */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title={tr('પ્રોફાઇલ ફોટો બદલવા માટે ક્લિક કરો', 'Click to change profile picture')}
            >
              <div
                className={`w-24 h-24 rounded-full overflow-hidden border-2 shadow-xl flex items-center justify-center transition-all group-hover:border-opacity-100 ${
                  isTeacher ? 'border-purple-500/50 bg-purple-950/40' : 'border-blue-500/50 bg-blue-950/40'
                }`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center font-extrabold text-3xl text-white ${
                      isTeacher
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    }`}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Floating Camera Button Badge */}
              <div
                className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg transition-transform group-hover:scale-110 ${
                  isTeacher ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Controls & Description */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h3 className="text-sm font-bold text-white">
                  {tr('પ્રોફાઇલ ફોટો', 'Profile Picture')}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                  JPG, PNG, WEBP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tr('તમારો વાસ્તવિક ફોટો અપલોડ કરો જેથી શિક્ષકો અને સહપાઠીઓ તમને ઓળખી શકે (મહત્તમ કદ 5MB).', 'Upload your photo so teachers and peers can recognize your account (max size 5MB).', 'अपनी वास्तविक तस्वीर अपलोड करें ताकि शिक्षक और सहपाठी आपको पहचान सकें (अधिकतम आकार 5MB)।')}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all text-white shadow-md ${
                    isTeacher
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {uploadingAvatar
                      ? tr('અપલોડ થઈ રહ્યું છે...', 'Uploading...')
                      : (user?.avatarUrl
                          ? tr('ફોટો બદલો', 'Change Photo')
                          : tr('નવો ફોટો અપલોડ કરો', 'Upload Photo'))}
                  </span>
                </button>

                {user?.avatarUrl && (
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={handleRemoveAvatar}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tr('ફોટો દૂર કરો', 'Remove')}</span>
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="text-xs text-rose-400 flex items-center justify-center sm:justify-start space-x-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{avatarError}</span>
                </p>
              )}
            </div>
          </div>

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

          {/* TEACHER PROFILE: Mobile Number */}
          {isTeacher && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center space-x-1.5">
                <Phone className="w-4 h-4 text-purple-400" />
                <span>{tr('મોબાઇલ નંબર', 'Mobile Number')}</span>
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder={tr('દા.ત. 9876543210', 'e.g. 9876543210')}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {tr('શિક્ષકનો સંપર્ક નંબર', 'Teacher contact mobile number')}
              </p>
            </div>
          )}

          {/* STUDENT PROFILE: Roll Number, Mobile Number, UDISE Code */}
          {!isTeacher && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center space-x-1.5">
                    <Hash className="w-4 h-4 text-blue-400" />
                    <span>{tr('રોલ નંબર', 'Roll Number')}</span>
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder={tr('દા.ત. 15', 'e.g. 15')}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {tr('વિદ્યાર્થીનો રોલ નંબર', 'Student classroom roll number')}
                  </p>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center space-x-1.5">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>{tr('મોબાઇલ નંબર', 'Mobile Number')}</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder={tr('દા.ત. 9876543210', 'e.g. 9876543210')}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {tr('10 અંકનો માન્ય મોબાઇલ નંબર દાખલ કરો', 'Valid 10-digit mobile number')}
                  </p>
                </div>
              </div>

              {/* UDISE Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center space-x-1.5">
                  <School className="w-4 h-4 text-blue-400" />
                  <span>{tr('UDISE કોડ', 'UDISE Code')}</span>
                </label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  placeholder={tr('દા.ત. 24070100101', 'e.g. 24070100101')}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 tracking-wider transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {tr('શાળાનો માન્ય UDISE કોડ દાખલ કરો', 'Enter valid school UDISE code')}
                </p>
              </div>
            </>
          )}

          {/* Academic Standard / Grade (STUDENT ONLY - READ ONLY) */}
          {!isTeacher && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>{tr('શૈક્ષણિક ધોરણ (ફક્ત વાંચવા માટે)', 'Academic Standard / Grade (Read-Only)')}</span>
                </label>
                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>{tr('નોંધણી વખતે સોંપાયેલ', 'Assigned on Registration')}</span>
                </span>
              </div>
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-bold text-blue-400">📚 {getStandardLabel(currentStandard)}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {tr('સોંપેલ ધોરણ', 'Assigned Grade')}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  {tr('નિશ્ચિત', 'Fixed')}
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
            <span>{saving ? t('common:saving') : tr('પ્રોફાઇલ વિગતો સાચવો', 'Save Profile Details')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
