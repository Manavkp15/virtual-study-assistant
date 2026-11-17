import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface DailyStudyHeadline {
  id: number;
  en: string;
  gu: string;
  hi: string;
}

export const DAILY_STUDY_HEADLINES: DailyStudyHeadline[] = [
  {
    id: 1,
    en: "Ready to dive into today's lessons? Time to level up your skills!",
    gu: "આજના પાઠ શીખવા માટે તૈયાર છો? તમારી કુશળતા વધારવાનો સમય!",
    hi: "आज के पाठ सीखने के लिए तैयार? अपने कौशल को बढ़ाने का समय!"
  },
  {
    id: 2,
    en: "A fresh day to learn, grow, and conquer new concepts!",
    gu: "નવા ખ્યાલો શીખવા, આગળ વધવા અને સિદ્ધિ મેળવવાનો નવો દિવસ!",
    hi: "नई अवधारणाओं को सीखने, आगे बढ़ने और सफलता पाने का नया दिन!"
  },
  {
    id: 3,
    en: "Small daily steps lead to massive academic milestones!",
    gu: "દરરોજના નાના પગલાં ભવ્ય શૈક્ષણિક સિદ્ધિઓ તરફ દોરી જાય છે!",
    hi: "हर दिन के छोटे कदम बड़ी शैक्षणिक उपलब्धियों की ओर ले जाते हैं!"
  },
  {
    id: 4,
    en: "Stay curious, stay determined—today's study is tomorrow's superpower!",
    gu: "જિજ્ઞાસુ અને દ્રઢ રહો—આજનો અભ્યાસ આવતીકાલની સુપરપાવર છે!",
    hi: "जिज्ञासु और दृढ़ रहें—आज की पढ़ाई कल की महाशक्ति है!"
  },
  {
    id: 5,
    en: "Consistency beats intensity—keep your learning momentum rolling!",
    gu: "સાતત્ય ઉત્સાહ કરતાં વધુ શક્તિશાળી છે—તમારી શીખવાની ગતિ જાળવી રાખો!",
    hi: "निरंतरता तीव्रता से अधिक शक्तिशाली है—अपनी सीखने की गति बनाए रखें!"
  },
  {
    id: 6,
    en: "Every problem you solve today makes your thinking sharper and clearer!",
    gu: "આજે તમે ઉકેલો છો તે દરેક પ્રશ્ન તમારી વિચારસરણીને વધુ તેજ અને સ્પષ્ટ બનાવે છે!",
    hi: "आज आपका हल किया गया हर सवाल आपकी सोच को और अधिक तेज़ व स्पष्ट बनाता है!"
  },
  {
    id: 7,
    en: "Mistakes are golden clues that show you how to succeed!",
    gu: "ભૂલો એ સુવર્ણ સંકેતો છે જે તમને સફળ થવાનો સાચો માર્ગ બતાવે છે!",
    hi: "गलतियाँ वे सुनहरे संकेत हैं जो आपको सफल होने का सही रास्ता दिखाती हैं!"
  },
  {
    id: 8,
    en: "Focus on deep understanding today, and top scores will naturally follow!",
    gu: "આજે ઊંડી સમજણ પર ધ્યાન આપો, ઉત્તમ પરિણામ આપમેળે આવશે!",
    hi: "आज गहरी समझ पर ध्यान दें, उत्कृष्ट परिणाम अपने आप आएंगे!"
  },
  {
    id: 9,
    en: "Turn every doubt into discovery with active practice today!",
    gu: "આજે સક્રિય પ્રેક્ટિસ સાથે દરેક શંકાને નવી શોધમાં ફેરવો!",
    hi: "आज सक्रिय अभ्यास के साथ हर संदेह को नई खोज में बदलें!"
  },
  {
    id: 10,
    en: "One chapter at a time, one concept at a time—you are unstoppable!",
    gu: "એક સમયે એક પ્રકરણ, એક સમયે એક સંકલ્પના—તમારી પ્રગતિ અટકશે નહીં!",
    hi: "एक समय में एक अध्याय, एक समय में एक अवधारणा—आप अजेय हैं!"
  },
  {
    id: 11,
    en: "Hard work bridges the gap between dreams and academic excellence!",
    gu: "સખત મહેનત સપના અને શૈક્ષણિક ઉત્કૃષ્ટતા વચ્ચેનો સેતુ બાંધે છે!",
    hi: "कठिन परिश्रम सपनों और शैक्षणिक उत्कृष्टता के बीच का सेतु है!"
  },
  {
    id: 12,
    en: "Sharpen your mind today—every formula and lesson counts!",
    gu: "તમારા મગજને તેજ બનાવો—દરેક સૂત્ર અને પાઠ અત્યંત મૂલ્યવાન છે!",
    hi: "अपने मस्तिष्क को तेज़ बनाएं—हर सूत्र और पाठ अत्यंत मूल्यवान है!"
  },
  {
    id: 13,
    en: "Dedication today unlocks endless opportunities tomorrow!",
    gu: "આજનું સમર્પણ આવતીકાલની અસીમ તકોના દરવાજા ખોલે છે!",
    hi: "आज का समर्पण कल के असीम अवसरों के द्वार खोलता है!"
  },
  {
    id: 14,
    en: "Challenge yourself with new questions today—growth happens outside your comfort zone!",
    gu: "આજે નવા પ્રશ્નો સાથે તમારી જાતને પડકારો—સાચો વિકાસ કમ્ફર્ટ ઝોનની બહાર થાય છે!",
    hi: "आज नए प्रश्नों के साथ खुद को चुनौती दें—सच्चा विकास आराम क्षेत्र से बाहर होता है!"
  },
  {
    id: 15,
    en: "Celebrate your progress, strengthen weak spots, and rise higher!",
    gu: "તમારી પ્રગતિની ઉજવણી કરો, નબળા મુદ્દાઓને મજબૂત બનાવો અને આગળ વધો!",
    hi: "अपनी प्रगति की सराहना करें, कमजोर बिंदुओं को मजबूत बनाएं और आगे बढ़ें!"
  },
  {
    id: 16,
    en: "Your focus determines your reality—give today's revision your best!",
    gu: "તમારી એકાગ્રતા તમારા પરિણામને ઘડે છે—આજના પુનરાવર્તનને તમારું શ્રેષ્ઠ આપો!",
    hi: "आपकी एकाग्रता आपके परिणाम को तय करती है—आज के पुनरीक्षण को अपना सर्वश्रेष्ठ दें!"
  },
  {
    id: 17,
    en: "A quiet hour of study today creates a lifetime of wisdom!",
    gu: "આજનો શાંતિપૂર્વકનો અભ્યાસ જીવનભર માટે જ્ઞાનની મૂડી બનાવે છે!",
    hi: "आज का एकाग्र अध्ययन जीवन भर के लिए ज्ञान की पूँजी बनाता है!"
  },
  {
    id: 18,
    en: "Believe in yourself and your ability to master difficult topics!",
    gu: "તમારી જાતમાં અને અઘરા વિષયોમાં નિપુણતા મેળવવાની તમારી ક્ષમતા પર વિશ્વાસ રાખો!",
    hi: "स्वयं पर और कठिन विषयों में महारत हासिल करने की अपनी क्षमता पर विश्वास रखें!"
  },
  {
    id: 19,
    en: "Review your past mistakes today—they are stepping stones to mastery!",
    gu: "આજે તમારી જૂની ભૂલોનું પુનરાવર્તન કરો—તે નિપુણતા તરફ લઈ જતી સીડી છે!",
    hi: "आज अपनी पुरानी गलतियों की समीक्षा करें—वे महारत की ओर ले जाने वाली सीढ़ियाँ हैं!"
  },
  {
    id: 20,
    en: "Smart preparation and patience make the toughest exams feel simple!",
    gu: "સ્માર્ટ તૈયારી અને ધીરજ સૌથી અઘરી પરીક્ષાઓને પણ સરળ બનાવી દે છે!",
    hi: "स्मार्ट तैयारी और धैर्य सबसे कठिन परीक्षाओं को भी आसान बना देते हैं!"
  },
  {
    id: 21,
    en: "Excellence is not an accident; it is a habit formed through daily study!",
    gu: "શ્રેષ્ઠતા એ કોઈ અકસ્માત નથી; તે દૈનિક અભ્યાસ દ્વારા કેળવાતી આદત છે!",
    hi: "उत्कृष्टता कोई संयोग नहीं; यह दैनिक अध्ययन से विकसित होने वाली आदत है!"
  },
  {
    id: 22,
    en: "Feed your brain with fresh knowledge today—curiosity knows no bounds!",
    gu: "આજે તમારા મગજને નવા જ્ઞાનથી સમૃદ્ધ કરો—જિજ્ઞાસાની કોઈ સીમા નથી હોતી!",
    hi: "आज अपने मस्तिष्क को नए ज्ञान से समृद्ध करें—जिज्ञासा की कोई सीमा नहीं होती!"
  },
  {
    id: 23,
    en: "Organize your study goals today and make every minute matter!",
    gu: "આજે તમારા અભ્યાસના લક્ષ્યોનું આયોજન કરો અને દરેક મિનિટને સાર્થક બનાવો!",
    hi: "आज अपने अध्ययन के लक्ष्यों को व्यवस्थित करें और हर मिनट को सार्थक बनाएं!"
  },
  {
    id: 24,
    en: "Progress, not perfection—every effort you make today brings you closer to your goal!",
    gu: "સંપૂર્ણતા કરતાં પ્રગતિ મહત્વની છે—આજે તમારો દરેક પ્રયાસ તમને લક્ષ્યની નજીક લાવે છે!",
    hi: "पूर्णता से अधिक प्रगति महत्वपूर्ण है—आज आपका हर प्रयास आपको लक्ष्य के करीब लाता है!"
  },
  {
    id: 25,
    en: "Power through your lessons today; proud achievements are waiting for you!",
    gu: "આજે ઉત્સાહ સાથે તમારા પાઠ પૂર્ણ કરો; ગૌરવપૂર્ણ સિદ્ધિઓ તમારી રાહ જોઈ રહી છે!",
    hi: "आज उत्साह के साथ अपने पाठ पूरे करें; गौरवपूर्ण उपलब्धियां आपकी प्रतीक्षा कर रही हैं!"
  },
  {
    id: 26,
    en: "Ask questions, explore theories, and unlock the true joy of learning today!",
    gu: "પ્રશ્નો પૂછો, સિદ્ધાંતો સમજો અને આજે શીખવાના સાચા આનંદનો અનુભવ કરો!",
    hi: "प्रश्न पूछें, सिद्धांतों को समझें और आज सीखने के वास्तविक आनंद का अनुभव करें!"
  },
  {
    id: 27,
    en: "Take a quick practice quiz today and celebrate how much you've improved!",
    gu: "આજે એક ઝડપી પ્રેક્ટિસ ટેસ્ટ આપો અને જુઓ કે તમારી કુશળતા કેટલી વધી છે!",
    hi: "आज एक त्वरित अभ्यास परीक्षा दें और देखें कि आपके कौशल में कितना सुधार हुआ है!"
  },
  {
    id: 28,
    en: "Stay disciplined, stay driven—your dedication today builds a shining future!",
    gu: "શિસ્તબદ્ધ રહો, પ્રેરિત રહો—આજનું તમારું સમર્પણ ઉજ્જવળ ભવિષ્યનું નિર્માણ કરે છે!",
    hi: "अनुशासित रहें, प्रेरित रहें—आज का आपका समर्पण उज्ज्वल भविष्य का निर्माण करता है!"
  },
  {
    id: 29,
    en: "You are capable of incredible things—let today's study session prove it!",
    gu: "તમે અદ્ભુત સિદ્ધિઓ મેળવવા સક્ષમ છો—આજના અભ્યાસ સત્રથી તે સાબિત કરી બતાવો!",
    hi: "आप अद्भुत उपलब्धियां हासिल करने में सक्षम हैं—आज के अध्ययन से इसे साबित करें!"
  },
  {
    id: 30,
    en: "End your study session today with satisfaction and renewed energy for tomorrow!",
    gu: "આજના અભ્યાસ સત્રને સંતોષ અને આવતીકાલ માટે નવી ઊર્જા સાથે પૂર્ણ કરો!",
    hi: "आज के अध्ययन सत्र को संतुष्टि और कल के लिए नई ऊर्जा के साथ पूरा करें!"
  },
  {
    id: 31,
    en: "Every day is a fresh chapter of growth—keep shining and learning!",
    gu: "દરેક દિવસ પ્રગતિનો એક નવો અધ્યાય છે—દરરોજ ચમકતા રહો અને શીખતા રહો!",
    hi: "हर दिन प्रगति का एक नया अध्याय है—हर दिन चमकते रहें और नया सीखते रहें!"
  }
];

/**
 * Calculates a deterministic daily index based on the calendar day of the year.
 * This guarantees that:
 * 1. The headline automatically rotates at midnight every single day.
 * 2. It stays stable and persistent throughout that calendar day.
 * 3. It supports full trilingual localization (English, Gujarati, Hindi).
 */
export function getDailyStudyHeadline(lang: string = 'en', customDate?: Date): DailyStudyHeadline & { text: string; dayIndex: number } {
  const now = customDate || new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.max(1, Math.floor(diff / oneDay));

  // Modulo index ensures continuous cycle through all 31 quotes across the 365 days of the year
  const index = (dayOfYear - 1) % DAILY_STUDY_HEADLINES.length;
  const item = DAILY_STUDY_HEADLINES[index];

  const currentLang = (lang || 'en').toLowerCase();
  let text = item.en;
  if (currentLang.startsWith('gu')) {
    text = item.gu;
  } else if (currentLang.startsWith('hi')) {
    text = item.hi;
  }

  return {
    ...item,
    text,
    dayIndex: index + 1
  };
}

/**
 * React hook to automatically provide the current localized daily study headline.
 * Re-evaluates when language changes.
 */
export function useDailyStudyHeadline(): DailyStudyHeadline & { text: string; dayIndex: number } {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  return useMemo(() => getDailyStudyHeadline(lang), [lang]);
}
