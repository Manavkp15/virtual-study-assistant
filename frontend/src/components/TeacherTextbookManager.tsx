import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BookOpen,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';

interface Textbook {
  id: string;
  title: string;
  titleGu?: string;
  board: string;
  standard: string;
  subject: string;
  medium: string;
  academicYear: string;
  chapterNumber?: number;
  chapterName?: string;
  chunkCount: number;
  createdAt: string;
}

export const TeacherTextbookManager: React.FC = () => {
  const { t } = useTranslation('common');
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [board, setBoard] = useState('NCERT');
  const [standard, setStandard] = useState('Standard 8');
  const [subject, setSubject] = useState('Science');
  const [medium, setMedium] = useState('English');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [chapterNumber, setChapterNumber] = useState('1');
  const [chapterName, setChapterName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchTextbooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rag/textbooks');
      setTextbooks(res.data.textbooks || []);
    } catch (err) {
      console.error('Failed to load textbooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextbooks();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: tr('કૃપા કરીને પુસ્તકનું શીર્ષક દાખલ કરો.', 'Please enter textbook title.') });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    if (titleGu.trim()) formData.append('titleGu', titleGu.trim());
    formData.append('board', board);
    formData.append('standard', standard);
    formData.append('subject', subject);
    formData.append('medium', medium);
    formData.append('academicYear', academicYear);
    if (chapterNumber) formData.append('chapterNumber', chapterNumber);
    if (chapterName.trim()) formData.append('chapterName', chapterName.trim());
    if (textContent.trim()) formData.append('textContent', textContent.trim());
    if (selectedFile) formData.append('file', selectedFile);

    try {
      await api.post('/rag/textbooks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback({
        type: 'success',
        message: tr('પાઠ્યપુસ્તક સફળતાપૂર્વક નોલેજ બેઝમાં ઇન્ડેક્સ થયું!', 'Textbook successfully indexed into knowledge base!')
      });
      setShowAddModal(false);
      resetForm();
      fetchTextbooks();
    } catch (err: any) {
      console.error('Failed to upload textbook:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || tr('અપલોડ કરવામાં નિષ્ફળ', 'Failed to index textbook.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(tr(`શું તમે ખરેખર "${name}" કાઢી નાખવા માંગો છો?`, `Are you sure you want to delete "${name}"?`))) {
      return;
    }

    try {
      await api.delete(`/rag/textbooks/${id}`);
      setFeedback({
        type: 'success',
        message: tr('પાઠ્યપુસ્તક કાઢી નાખવામાં આવ્યું.', 'Textbook removed.')
      });
      fetchTextbooks();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: tr('કાઢી નાખવામાં નિષ્ફળ.', 'Failed to delete textbook.')
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setTitleGu('');
    setChapterNumber('1');
    setChapterName('');
    setTextContent('');
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{tr('અધિકૃત પાઠ્યપુસ્તક સંચાલન', 'Textbook Knowledge Base Management')}</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tr('NCERT અને ગુજરાત બોર્ડ પાઠ્યપુસ્તક કેન્દ્ર', 'NCERT & Gujarat Board Textbook Repository')}
          </h2>
          <p className="text-xs text-slate-400">
            {tr(
              'શિક્ષકો ધોરણ ૬-૮ ના પાઠ્યપુસ્તકો, પ્રકરણો અને સત્તાવાર સાહિત્ય અપલોડ કરી શકે છે જેને વિદ્યાર્થીઓ માટે AI RAG સિસ્ટમમાં સ્વચાલિત ઇન્ડેક્સ કરવામાં આવે છે.',
              'Upload official NCERT and GSEB textbooks by board, class, subject, medium, and academic year. Text is chunked and vectorized for student RAG assistance.'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTextbooks}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
            title={tr('રિફ્રેશ કરો', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('નવું પાઠ્યપુસ્તક ઉમેરો', '+ Add Textbook')}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Textbooks Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>{tr('હાલના ઇન્ડેક્સ થયેલા પાઠ્યપુસ્તકો', 'Indexed Textbooks')} ({textbooks.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">{tr('પાઠ્યપુસ્તકો લોડ થઈ રહ્યા છે...', 'Loading textbooks...')}</p>
          </div>
        ) : textbooks.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-400">{tr('કોઈ પાઠ્યપુસ્તકો મળ્યા નથી', 'No textbooks found.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textbooks.map((b) => (
              <div
                key={b.id}
                className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-4 shadow-md space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          b.board === 'NCERT'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {b.board}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                        {b.standard}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                        {b.medium} Medium
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-xs sm:text-sm truncate max-w-sm">
                      {b.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                    title={tr('કાઢી નાખો', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>
                    {b.subject} • {b.academicYear}
                  </span>
                  <span className="font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    {b.chunkCount} {tr('સેમેન્ટિક ચંક્સ', 'Semantic Chunks')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Textbook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>{tr('નવું પાઠ્યપુસ્તક / પ્રકરણ અપલોડ કરો', 'Index New Textbook into RAG')}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {tr('પુસ્તકનું શીર્ષક (English) *', 'Textbook / Chapter Title (English) *')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NCERT Class 8 Science - Chapter 12: Friction"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {tr('પુસ્તકનું શીર્ષક (ગુજરાતી)', 'Title (Gujarati)')}
                </label>
                <input
                  type="text"
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="દા.ત. GSEB ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૨: ઘર્ષણ"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">{tr('બોર્ડ *', 'Board *')}</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="NCERT">NCERT</option>
                    <option value="GSEB">GSEB (Gujarat Board)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{tr('ધોરણ *', 'Class *')}</label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Standard 6">Standard 6</option>
                    <option value="Standard 7">Standard 7</option>
                    <option value="Standard 8">Standard 8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{tr('વિષય *', 'Subject *')}</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Science">Science (વિજ્ઞાન)</option>
                    <option value="Mathematics">Mathematics (ગણિત)</option>
                    <option value="Social Science">Social Science (સા.વિ.)</option>
                    <option value="English">English</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{tr('માધ્યમ *', 'Medium *')}</label>
                  <select
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="English">English Medium</option>
                    <option value="Gujarati">Gujarati Medium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{tr('શૈક્ષણિક વર્ષ', 'Academic Year')}</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{tr('પ્રકરણ નંબર', 'Chapter No.')}</label>
                  <input
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Text content or PDF file */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {tr('પ્રકરણનું લખાણ / વિષયવસ્તુ (RAG ચંક્સ બનાવવા માટે)', 'Chapter Text Content for RAG Chunking')}
                </label>
                <textarea
                  rows={5}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={tr(
                    'અહીં પ્રકરણનું લખાણ પેસ્ટ કરો. તે આપમેળે નાના અર્થપૂર્ણ ફકરાઓમાં વિભાજિત થઈને વેક્ટર ડેટાબેઝમાં સંગ્રહિત થશે...',
                    'Paste textbook content here to automatically chunk and vectorize for student semantic search...'
                  )}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {tr('અથવા પાઠ્યપુસ્તક પીડીએફ (.pdf) પસંદ કરો', 'Or Attach Textbook PDF (.pdf)')}
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  {tr('રદ કરો', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/30 flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>{tr('ઇન્ડેક્સ થઈ રહ્યું છે...', 'Indexing...')}</span>
                  ) : (
                    <span>{tr('નોલેજ બેઝમાં સેવ કરો', 'Index Textbook')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
